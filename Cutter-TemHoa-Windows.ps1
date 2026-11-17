param(
    [switch]$ListPorts,
    [switch]$SendJob,
    [string]$PortName = '',
    [int]$BaudRate = 9600,
    [string]$FlowControl = 'RequestToSend',
    [string]$JobPath = '',
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
    if ($Hpgl -cmatch '[^INSPUD0-9,; \t\r\n-]') {
        throw 'HP-GL job contains disallowed characters or commands.'
    }
    if ([System.Text.Encoding]::ASCII.GetByteCount($Hpgl) -gt 8388608) {
        throw 'HP-GL job exceeds 8 MB limit.'
    }
    if ($Hpgl -cnotmatch '(?:IN|SP|PU|PD)') {
        throw 'HP-GL job contains no cutting commands.'
    }
    if ($Hpgl -cmatch '(?<![A-Z])(?!(?:IN|SP|PU|PD)(?![A-Z]))[A-Z]+') {
        throw 'HP-GL job contains unsupported commands.'
    }
    if ($Hpgl -cmatch '\A[ \t\r\n,;]*[0-9-]') {
        throw 'HP-GL job must begin with a valid command.'
    }
    if ($Hpgl -cmatch '-(?![0-9])|[0-9]-') {
        throw 'HP-GL job contains invalid negative coordinate syntax.'
    }
    if ($Hpgl -cmatch '(?:\A|[; \t\r\nINSPUD]),|,[ \t\r\n]*(?:[;INSPUD]|\z)|,[ \t\r\n]*,') {
        throw 'HP-GL job contains invalid comma syntax.'
    }
    if ($Hpgl -cmatch 'IN[ \t\r\n]*[0-9,-]|SP[ \t\r\n]*(?:-|,[ \t\r\n]*[0-9]|[0-9]+[ \t\r\n]*,)') {
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

function Send-HpglJob {
    param(
        [string]$TargetPort,
        [int]$TargetBaud,
        [string]$TargetFlow,
        [string]$SourcePath
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
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($hpgl)

    Initialize-SerialPortType
    $serial = $null
    try {
        $serial = [System.IO.Ports.SerialPort]::new($port, $TargetBaud, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One)
        $serial.Handshake = $handshake
        $serial.Encoding = [System.Text.Encoding]::ASCII
        $serial.WriteTimeout = 10000
        $serial.ReadTimeout = 2000
        $serial.DtrEnable = $true
        if ($handshake -eq [System.IO.Ports.Handshake]::None) {
            $serial.RtsEnable = $true
        }
        $serial.Open()

        # Pace writes in small chunks so CH340 USB-Serial and cutter buffers do not overflow.
        $chunkSize = 512
        for ($offset = 0; $offset -lt $bytes.Length; $offset += $chunkSize) {
            $count = [Math]::Min($chunkSize, $bytes.Length - $offset)
            $serial.Write($bytes, $offset, $count)
            if ($offset + $count -lt $bytes.Length) {
                [System.Threading.Thread]::Sleep(10)
            }
        }
        $serial.BaseStream.Flush()
        [System.Threading.Thread]::Sleep(50)
    } catch [System.TimeoutException] {
        throw "Het thoi gian cho khi gui lenh toi cong $port. Kiem tra may cat dang o che do Online, thu doi Flow Control sang None hoac chon dung Baud Rate (9600/38400)."
    } finally {
        if ($null -ne $serial) {
            try { if ($serial.IsOpen) { $serial.Close() } } catch {}
            try { $serial.Dispose() } catch {}
        }
    }

    return @{ sent = $true; port = $port; bytes = $bytes.Length }
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
        $result = Send-HpglJob -TargetPort $PortName -TargetBaud $BaudRate -TargetFlow $FlowControl -SourcePath $JobPath
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
