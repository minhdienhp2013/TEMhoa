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
        '' { return [System.IO.Ports.Handshake]::None }
        'requesttosend' { return [System.IO.Ports.Handshake]::RequestToSend }
        'rts' { return [System.IO.Ports.Handshake]::RequestToSend }
        'xonxoff' { return [System.IO.Ports.Handshake]::XOnXOff }
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
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($hpgl)

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
        [System.Threading.Thread]::Sleep(120)

        # Split by semicolon (HP-GL command terminator) so both single-line jobs (like TestBox)
        # Subdivide every PU/PD move into <= 160-unit (4 mm) sub-steps and keep lookahead <= 50 ms
        # so at most ONE 4 mm step is buffered in the cutter at any moment. This makes Pause and Cancel
        # stop the physical cutter within ~0.15 seconds (<= 4 mm) instead of running through a large buffer.
        $assumedMmPerSec = 26.0
        $perStepOverheadMs = 10.0
        $maxLookaheadMs = 50.0
        $maxSubStepUnits = 160.0
        $lastX = 0.0; $lastY = 0.0
        $penDown = $false
        $stopped = $false
        $virtualFinishUtc = [DateTime]::UtcNow
        $rawCommands = $hpgl -split ';'

        function Invoke-HandlePauseOrCancel {
            $ctrl = Get-CutControl -Path $ControlFile
            if ($ctrl -eq 'pause') {
                try { $serial.DiscardOutBuffer() } catch {}
                $liftBytes = [System.Text.Encoding]::ASCII.GetBytes('PU;')
                $serial.Write($liftBytes, 0, $liftBytes.Length)
                $serial.BaseStream.Flush()
                while ($ctrl -eq 'pause') {
                    [System.Threading.Thread]::Sleep(50)
                    $ctrl = Get-CutControl -Path $ControlFile
                }
                if ($ctrl -ne 'cancel' -and $penDown) {
                    $rx = [int][Math]::Round($lastX)
                    $ry = [int][Math]::Round($lastY)
                    $resumeBytes = [System.Text.Encoding]::ASCII.GetBytes("PU$rx,$ry;PD$rx,$ry;")
                    $serial.Write($resumeBytes, 0, $resumeBytes.Length)
                    $serial.BaseStream.Flush()
                    [System.Threading.Thread]::Sleep(45)
                }
                $script:virtualFinishUtc = [DateTime]::UtcNow
            }
            if ($ctrl -eq 'cancel') {
                try { $serial.DiscardOutBuffer() } catch {}
                $cancelBytes = [System.Text.Encoding]::ASCII.GetBytes('IN;SP1;PU;PU0,0;')
                $serial.Write($cancelBytes, 0, $cancelBytes.Length)
                $serial.BaseStream.Flush()
                [System.Threading.Thread]::Sleep(350)
                return $true
            }
            return $false
        }

        foreach ($rawCmd in $rawCommands) {
            $cmd = ($rawCmd -replace '[\r\n\t ]+', '').ToUpperInvariant()
            if ($cmd.Length -eq 0) { continue }

            if (Invoke-HandlePauseOrCancel) { $stopped = $true; break }

            if ($cmd -eq 'IN') {
                $tokenBytes = [System.Text.Encoding]::ASCII.GetBytes('IN;')
                $serial.Write($tokenBytes, 0, $tokenBytes.Length)
                $serial.BaseStream.Flush()
                [System.Threading.Thread]::Sleep(250)
                $virtualFinishUtc = [DateTime]::UtcNow
                continue
            }
            if ($cmd.StartsWith('SP')) {
                $tokenBytes = [System.Text.Encoding]::ASCII.GetBytes($cmd + ';')
                $serial.Write($tokenBytes, 0, $tokenBytes.Length)
                $serial.BaseStream.Flush()
                [System.Threading.Thread]::Sleep(80)
                $virtualFinishUtc = [DateTime]::UtcNow
                continue
            }

            if ($cmd.StartsWith('PU') -or $cmd.StartsWith('PD')) {
                $prefix = $cmd.Substring(0, 2)
                $isPd = ($prefix -eq 'PD')
                $coordMatches = [regex]::Matches($cmd.Substring(2), '(-?\d+),(-?\d+)')

                if ($coordMatches.Count -eq 0) {
                    $tokenBytes = [System.Text.Encoding]::ASCII.GetBytes($prefix + ';')
                    $serial.Write($tokenBytes, 0, $tokenBytes.Length)
                    $serial.BaseStream.Flush()
                    if ($isPd -and -not $penDown) { [System.Threading.Thread]::Sleep(45); $penDown = $true }
                    elseif (-not $isPd -and $penDown) { [System.Threading.Thread]::Sleep(35); $penDown = $false }
                    continue
                }

                foreach ($cm in $coordMatches) {
                    $targetX = [double]$cm.Groups[1].Value
                    $targetY = [double]$cm.Groups[2].Value
                    $startX = $lastX
                    $startY = $lastY
                    $totalDx = $targetX - $startX
                    $totalDy = $targetY - $startY
                    $totalUnits = [Math]::Sqrt($totalDx * $totalDx + $totalDy * $totalDy)
                    $subSteps = [Math]::Max(1, [int][Math]::Ceiling($totalUnits / $maxSubStepUnits))

                    for ($s = 1; $s -le $subSteps; $s++) {
                        if (Invoke-HandlePauseOrCancel) { $stopped = $true; break }

                        $ratio = [double]$s / [double]$subSteps
                        $sx = [int][Math]::Round($startX + $totalDx * $ratio)
                        $sy = [int][Math]::Round($startY + $totalDy * $ratio)
                        $stepDx = [double]$sx - $lastX
                        $stepDy = [double]$sy - $lastY
                        $stepMm = [Math]::Sqrt($stepDx * $stepDx + $stepDy * $stepDy) / 40.0
                        $lastX = [double]$sx
                        $lastY = [double]$sy

                        $penToggleMs = 0.0
                        if ($isPd -and -not $penDown) { $penToggleMs = 45.0; $penDown = $true }
                        elseif (-not $isPd -and $penDown) { $penToggleMs = 35.0; $penDown = $false }

                        $subToken = "$prefix$sx,$sy;"
                        $subBytes = [System.Text.Encoding]::ASCII.GetBytes($subToken)
                        while ($serial.BytesToWrite -gt 0) {
                            [System.Threading.Thread]::Sleep(5)
                        }
                        $serial.Write($subBytes, 0, $subBytes.Length)
                        $serial.BaseStream.Flush()

                        $wireMs = ($subBytes.Length * 10.0 / [double]$TargetBaud) * 1000.0
                        $moveMs = ($stepMm / $assumedMmPerSec) * 1000.0 + $penToggleMs + $perStepOverheadMs
                        $stepMs = [Math]::Max($wireMs, $moveMs)
                        $nowUtc = [DateTime]::UtcNow
                        if ($virtualFinishUtc -lt $nowUtc) { $virtualFinishUtc = $nowUtc }
                        $virtualFinishUtc = $virtualFinishUtc.AddMilliseconds($stepMs)

                        while (($virtualFinishUtc - [DateTime]::UtcNow).TotalMilliseconds -gt $maxLookaheadMs) {
                            [System.Threading.Thread]::Sleep(15)
                            if ($ControlFile -and (Get-CutControl -Path $ControlFile) -in @('pause', 'cancel')) { break }
                        }
                    }
                    if ($stopped) { break }
                }
                if ($stopped) { break }
                continue
            }

            $otherBytes = [System.Text.Encoding]::ASCII.GetBytes($cmd + ';')
            $serial.Write($otherBytes, 0, $otherBytes.Length)
            $serial.BaseStream.Flush()
        }

        # Wait for the cutter to physically finish the last buffered step before closing the port.
        $finishDeadline = $virtualFinishUtc.AddMilliseconds(250)
        while (-not $stopped -and [DateTime]::UtcNow -lt $finishDeadline) {
            if ($ControlFile -and (Invoke-HandlePauseOrCancel)) {
                $stopped = $true
                break
            }
            [System.Threading.Thread]::Sleep(20)
        }

        $serial.BaseStream.Flush()
        $drainDeadline = [DateTime]::UtcNow.AddSeconds(30)
        while ($serial.BytesToWrite -gt 0 -and [DateTime]::UtcNow -lt $drainDeadline) {
            [System.Threading.Thread]::Sleep(25)
        }
        [System.Threading.Thread]::Sleep(250)
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
