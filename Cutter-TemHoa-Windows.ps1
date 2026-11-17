param(
    [switch]$ListPorts,
    [switch]$SendJob,
    [string]$PortName = '',
    [int]$BaudRate = 9600,
    [string]$FlowControl = 'RequestToSend',
    [string]$JobPath = '',
    [string]$ControlPath = '',
    [switch]$Test
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Initialize-SerialPortType {
    if (-not ('System.IO.Ports.SerialPort' -as [type])) {
        Add-Type -AssemblyName System.IO.Ports -ErrorAction Stop
    }
}

function Get-SortedComPorts {
    Initialize-SerialPortType
    $ports = @(
        [System.IO.Ports.SerialPort]::GetPortNames() |
        Where-Object { $_ } |
        # Trim trailing NUL bytes from older Windows .NET Framework registry reads.
        ForEach-Object { $_.Split([char]0)[0].Trim().ToUpperInvariant() } |
        Where-Object { $_ -cmatch '\ACOM[0-9]+\z' } |
        Select-Object -Unique |
        Sort-Object { [long]$_.Substring(3) }
    )
    return ,$ports
}

function Test-SafeHpgl {
    param([string]$Hpgl)
    if ([string]::IsNullOrWhiteSpace($Hpgl)) {
        throw 'HP-GL job payload is empty.'
    }
    if ($Hpgl -cmatch '[^INSPUDA0-9,; \t\r\n-]') {
        throw 'HP-GL job contains disallowed characters or commands.'
    }
    if ([System.Text.Encoding]::ASCII.GetByteCount($Hpgl) -gt 8388608) {
        throw 'HP-GL job exceeds 8 MB limit.'
    }
    if ($Hpgl -cnotmatch '(?:IN|SP|PA|PU|PD)') {
        throw 'HP-GL job contains no cutting commands.'
    }
    if ($Hpgl -cmatch '(?<![A-Z])(?!(?:IN|SP|PA|PU|PD)(?![A-Z]))[A-Z]+') {
        throw 'HP-GL job contains unsupported commands.'
    }
    if ($Hpgl -cmatch '\A[ \t\r\n,;]*[0-9-]') {
        throw 'HP-GL job must begin with a valid command.'
    }
    if ($Hpgl -cmatch '-(?![0-9])|[0-9]-') {
        throw 'HP-GL job contains invalid negative coordinate syntax.'
    }
    if ($Hpgl -cmatch '(?:\A|[; \t\r\nINSPUDA]),|,[ \t\r\n]*(?:[;INSPUDA]|\z)|,[ \t\r\n]*,') {
        throw 'HP-GL job contains invalid comma syntax.'
    }
    if ($Hpgl -cmatch '(?:IN|PA)[ \t\r\n]*[0-9,-]|SP[ \t\r\n]*(?:-|,[ \t\r\n]*[0-9]|[0-9]+[ \t\r\n]*,)') {
        throw 'HP-GL job contains invalid command arguments.'
    }
}

function Resolve-FlowControl {
    param([string]$Value)
    $normalized = if ($null -eq $Value) { '' } else { $Value.Trim().ToLowerInvariant() }
    switch ($normalized) {
        '' { return [System.IO.Ports.Handshake]::RequestToSend }
        'requesttosend' { return [System.IO.Ports.Handshake]::RequestToSend }
        'rts' { return [System.IO.Ports.Handshake]::RequestToSend }
        'none' { return [System.IO.Ports.Handshake]::None }
        default { throw "Unsupported flow control: $Value" }
    }
}

function Get-CutControl {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path -PathType Leaf)) { return '' }
    try {
        return ([System.IO.File]::ReadAllText($Path)).Trim().ToLowerInvariant()
    } catch {
        return ''
    }
}

function Send-HpglJob {
    param(
        [string]$TargetPort,
        [int]$TargetBaud,
        [string]$TargetFlow,
        [string]$SourcePath,
        [string]$ControlFile = ''
    )
    $port = if ($null -eq $TargetPort) { '' } else { $TargetPort.Trim().ToUpperInvariant() }
    if ($port -cnotmatch '\ACOM[0-9]+\z') {
        throw 'Invalid COM port name.'
    }
    $allowedBauds = @(4800, 9600, 19200, 38400, 57600, 115200)
    if ($allowedBauds -notcontains $TargetBaud) {
        throw "Unsupported baud rate: $TargetBaud"
    }
    $handshake = Resolve-FlowControl -Value $TargetFlow
    if ([string]::IsNullOrWhiteSpace($SourcePath) -or -not (Test-Path -LiteralPath $SourcePath -PathType Leaf)) {
        throw 'HP-GL job file not found.'
    }
    $fileInfo = Get-Item -LiteralPath $SourcePath -ErrorAction Stop
    if (($fileInfo.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
        throw 'Invalid job file.'
    }
    if ($fileInfo.Length -le 0 -or $fileInfo.Length -gt 8388608) {
        throw 'HP-GL job must be between 1 byte and 8 MB.'
    }

    $hpgl = [System.IO.File]::ReadAllText($SourcePath, [System.Text.Encoding]::UTF8)
    Test-SafeHpgl -Hpgl $hpgl
    $wireHpgl = if ($hpgl.EndsWith("`n")) { $hpgl } else { $hpgl + "`r`n" }
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($wireHpgl)

    Initialize-SerialPortType
    $serial = $null
    try {
        $serial = New-Object System.IO.Ports.SerialPort $port, $TargetBaud, ([System.IO.Ports.Parity]::None), 8, ([System.IO.Ports.StopBits]::One)
        $serial.Handshake = $handshake
        $serial.Encoding = [System.Text.Encoding]::ASCII
        $serial.WriteTimeout = 10000
        $serial.ReadTimeout = 2000
        $serial.DtrEnable = $true
        $serial.RtsEnable = $true
        $serial.Open()
        [System.Threading.Thread]::Sleep(80)

        # Pace writes in small chunks so CH340 USB-Serial and cutter buffers do not overflow.
        # Send line by line and wait roughly as long as the cutter needs to move, because
        # without hardware flow control the small cutter buffer overflows and the cut stops early.
        $assumedMmPerSec = 40.0
        $lastX = 0.0; $lastY = 0.0
        $stopped = $false
        $lines = $wireHpgl -split "`n"
        foreach ($line in $lines) {
            $text = $line.Trim()
            if ($text.Length -eq 0) { continue }

            # Operator controls from the TemHoa UI: pause (lift blade and wait), resume, cancel (lift + return to origin).
            $control = Get-CutControl -Path $ControlFile
            if ($control -eq 'pause') {
                $liftBytes = [System.Text.Encoding]::ASCII.GetBytes("PU;`r`n")
                $serial.Write($liftBytes, 0, $liftBytes.Length)
                while ($control -eq 'pause') {
                    [System.Threading.Thread]::Sleep(100)
                    $control = Get-CutControl -Path $ControlFile
                }
            }
            if ($control -eq 'cancel') {
                $cancelBytes = [System.Text.Encoding]::ASCII.GetBytes("PU;PU0,0;`r`n")
                $serial.Write($cancelBytes, 0, $cancelBytes.Length)
                $stopped = $true
                break
            }

            $lineBytes = [System.Text.Encoding]::ASCII.GetBytes($text + "`r`n")
            $serial.Write($lineBytes, 0, $lineBytes.Length)
            $delayMs = 15.0
            $m = [regex]::Match($text, '^P[UD](-?\d+),(-?\d+);?$')
            if ($m.Success) {
                $x = [double]$m.Groups[1].Value; $y = [double]$m.Groups[2].Value
                $distMm = [Math]::Sqrt(($x - $lastX) * ($x - $lastX) + ($y - $lastY) * ($y - $lastY)) / 40.0
                $lastX = $x; $lastY = $y
                $delayMs = [Math]::Min(3000.0, 15.0 + ($distMm / $assumedMmPerSec) * 1000.0)
            }
            # Sleep in short slices so Pause / Cancel react quickly even during long moves.
            $waitUntil = [DateTime]::UtcNow.AddMilliseconds($delayMs)
            while ([DateTime]::UtcNow -lt $waitUntil) {
                [System.Threading.Thread]::Sleep(20)
                if ($ControlFile -and (Get-CutControl -Path $ControlFile) -in @('pause', 'cancel')) { break }
            }
        }
        if (-not $stopped -and $ControlFile -and (Get-CutControl -Path $ControlFile) -eq 'cancel') {
            $cancelBytes = [System.Text.Encoding]::ASCII.GetBytes("PU;PU0,0;`r`n")
            $serial.Write($cancelBytes, 0, $cancelBytes.Length)
            $stopped = $true
        }
        $serial.BaseStream.Flush()
        $drainDeadline = [DateTime]::UtcNow.AddSeconds(30)
        while ($serial.BytesToWrite -gt 0 -and [DateTime]::UtcNow -lt $drainDeadline) {
            [System.Threading.Thread]::Sleep(25)
        }
        [System.Threading.Thread]::Sleep(300)
    } catch [System.TimeoutException] {
        throw "Het thoi gian cho khi gui lenh toi cong $port. Kiem tra may cat dang o che do Online, thu doi Flow Control sang None hoac chon dung Baud Rate (9600/38400)."
    } finally {
        if ($null -ne $serial) {
            try { if ($serial.IsOpen) { $serial.Close() } } catch {}
            try { $serial.Dispose() } catch {}
        }
    }

    return @{ sent = $true; stopped = $stopped; port = $port; bytes = $bytes.Length }
}

try {
    $modeCount = ([int][bool]$ListPorts) + ([int][bool]$SendJob) + ([int][bool]$Test)
    if ($modeCount -ne 1) {
        throw 'Specify exactly one mode: -ListPorts, -SendJob, or -Test.'
    }

    if ($Test) {
        Test-SafeHpgl -Hpgl 'IN;SP1;PU0,0;PD100,100;PU;IN;'
        ConvertTo-Json -InputObject @{ ok = $true } -Compress
    } elseif ($ListPorts) {
        $ports = @(Get-SortedComPorts)
        ConvertTo-Json -InputObject @{ ports = $ports } -Compress
    } else {
        $result = Send-HpglJob -TargetPort $PortName -TargetBaud $BaudRate -TargetFlow $FlowControl -SourcePath $JobPath -ControlFile $ControlPath
        ConvertTo-Json -InputObject $result -Compress
    }
} catch {
    $message = if ($_.Exception.InnerException) { $_.Exception.InnerException.Message } else { $_.Exception.Message }
    [Console]::Error.WriteLine($message)
    exit 1
} finally {
    if ($SendJob -and $JobPath -and (Test-Path -LiteralPath $JobPath -PathType Leaf)) {
        Remove-Item -LiteralPath $JobPath -Force -ErrorAction SilentlyContinue
    }
}
