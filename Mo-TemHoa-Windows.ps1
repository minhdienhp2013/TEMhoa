$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $taskRoot 'Background-TemHoa-Windows.ps1')
$taskHtml = Join-Path $taskRoot 'TemHoa-MinhDien.html'
if (!(Test-Path -LiteralPath $taskHtml)) { throw 'TemHoa-MinhDien.html is missing. Extract the complete ZIP first.' }
$taskToken = [Guid]::NewGuid().ToString('N')
$taskTemplateRoot = if ($env:TEMHOA_TEMPLATE_ROOT) { $env:TEMHOA_TEMPLATE_ROOT } else { Join-Path $taskRoot 'Mau-Tem-Hoa' }
$taskHtmlText = [System.IO.File]::ReadAllText($taskHtml, [System.Text.Encoding]::UTF8)
$taskHtmlText = [regex]::new('<script>').Replace($taskHtmlText, "<script>window.TEMHOA_TOKEN='$taskToken';window.TEMHOA_NATIVE_PRINT=true;window.TEMHOA_DESKTOP=$($env:TEMHOA_DESKTOP -eq '1' | ConvertTo-Json -Compress);</script><script>", 1)
$taskBytes = [System.Text.Encoding]::UTF8.GetBytes($taskHtmlText)
function Get-TemplatePath([string]$name) {
    $name = $name.Trim()
    if (!$name -or $name.Length -gt 80 -or $name -match '[\x00-\x1f\\/:*?"<>|]') { throw 'Invalid template name (1-80 characters, no file path characters).' }
    if ($name.Split('.')[0] -match '^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$') { throw 'Reserved template filename.' }
    $path = Join-Path $taskTemplateRoot ($name + '.json')
    if ((Test-Path -LiteralPath $path) -and (([System.IO.File]::GetAttributes($path) -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)) { throw 'Invalid template file.' }
    return $path
}
function Test-Template($data) {
    if (!$data -or $data.version -ne 1 -or !$data.settings -or $data.settings.text -isnot [string]) { throw 'Invalid template JSON.' }
}
function Get-TemHoaCutterPorts {
    try {
        if (-not ('System.IO.Ports.SerialPort' -as [type])) {
            Add-Type -AssemblyName System.IO.Ports -ErrorAction Stop
        }
        $rawPorts = @(
            [System.IO.Ports.SerialPort]::GetPortNames() |
            Where-Object { $_ } |
            ForEach-Object { $_.Split([char]0)[0].Trim().ToUpperInvariant() } |
            Where-Object { $_ -cmatch '\ACOM[0-9]+\z' } |
            Select-Object -Unique |
            Sort-Object { [long]$_.Substring(3) }
        )
        $pnpLabels = @{}
        try {
            $pnpItems = @(Get-CimInstance -ClassName Win32_PnPEntity -Filter "Name LIKE '%(COM%'" -ErrorAction Stop)
            foreach ($item in $pnpItems) {
                if ($item.Name -match '\((COM[0-9]+)\)') {
                    $comKey = $matches[1].ToUpperInvariant()
                    if (-not $pnpLabels.ContainsKey($comKey)) {
                        $pnpLabels[$comKey] = [string]$item.Name
                    }
                }
            }
        } catch { }
        $details = @(
            foreach ($p in $rawPorts) {
                $lbl = if ($pnpLabels.ContainsKey($p)) { $pnpLabels[$p] } else { $p }
                $isUsb = ($lbl -match '(?i)USB|CH340|CH341|FTDI|CP210|PL2303|Serial|Arduino|Cutter|Plotter')
                [pscustomobject]@{
                    port = $p
                    label = $lbl
                    usb = [bool]$isUsb
                    num = [long]$p.Substring(3)
                }
            }
        ) | Sort-Object @{ Expression = { if ($_.usb) { 0 } else { 1 } } }, @{ Expression = { $_.num } } | Where-Object { $null -ne $_ }
        $sortedPorts = @()
        $cleanDetails = @()
        foreach ($d in @($details)) {
            if ($null -ne $d -and $d.port) {
                $sortedPorts += $d.port
                $cleanDetails += @{ port = $d.port; label = $d.label; usb = [bool]$d.usb }
            }
        }
        return @{ ports = $sortedPorts; details = $cleanDetails; available = $true }
    } catch {
        return @{ ports = @(); details = @(); available = $false }
    }
}
function Test-TemHoaSafeHpgl([string]$hpgl) {
    if ([string]::IsNullOrWhiteSpace($hpgl)) { throw 'HP-GL job payload is empty.' }
    if ($hpgl -cmatch '[^INSPUDA0-9,; \t\r\n-]') { throw 'HP-GL job contains disallowed characters or commands.' }
    if ([System.Text.Encoding]::ASCII.GetByteCount($hpgl) -gt 8388608) { throw 'HP-GL job exceeds 8 MB limit.' }
    if ($hpgl -cnotmatch '(?:IN|SP|PA|PU|PD)') { throw 'HP-GL job contains no cutting commands.' }
    if ($hpgl -cmatch '(?<![A-Z])(?!(?:IN|SP|PA|PU|PD)(?![A-Z]))[A-Z]+') { throw 'HP-GL job contains unsupported commands.' }
    if ($hpgl -cmatch '\A[ \t\r\n,;]*[0-9-]') { throw 'HP-GL job must begin with a valid command.' }
    if ($hpgl -cmatch '-(?![0-9])|[0-9]-') { throw 'HP-GL job contains invalid negative coordinate syntax.' }
    if ($hpgl -cmatch '(?:\A|[; \t\r\nINSPUDA]),|,[ \t\r\n]*(?:[;INSPUDA]|\z)|,[ \t\r\n]*,') { throw 'HP-GL job contains invalid comma syntax.' }
    if ($hpgl -cmatch '(?:IN|PA)[ \t\r\n]*[0-9,-]|SP[ \t\r\n]*(?:-|,[ \t\r\n]*[0-9]|[0-9]+[ \t\r\n]*,)') { throw 'HP-GL job contains invalid command arguments.' }
}
function Read-TemHoaJsonBody($stream, $headers, [int]$maxBytes, [string]$limitError) {
    [long]$length = 0
    if (-not $headers['content-length'] -or -not [long]::TryParse($headers['content-length'], [ref]$length) -or $length -le 0 -or $length -gt $maxBytes) {
        throw $limitError
    }
    $stream.ReadTimeout = 30000
    $payload = [byte[]]::new([int]$length)
    $read = 0
    while ($read -lt $length) {
        $received = $stream.Read($payload, $read, [int]$length - $read)
        if ($received -le 0) { throw 'Incomplete request body.' }
        $read += $received
    }
    return ([System.Text.Encoding]::UTF8.GetString($payload) | ConvertFrom-Json)
}
$script:TemHoaCut = $null
function Invoke-TemHoaCutterJob($request) {
    if (!$request) { throw 'Invalid cut request.' }
    $busy = Get-TemHoaCutStatus
    if ($busy.running) {
        return @{ status = '409 Conflict'; body = @{ error = 'A cut job is already running. Pause/Cancel it first.' } }
    }
    if ($request.port -isnot [string]) { throw 'Invalid COM port.' }
    $port = $request.port.Trim().ToUpperInvariant()
    if ($port -cnotmatch '\ACOM[0-9]+\z') { throw 'Invalid COM port name.' }
    $cutterInfo = Get-TemHoaCutterPorts
    if (-not $cutterInfo.available) {
        return @{ status = '503 Service Unavailable'; body = @{ error = 'Serial port support is unavailable on this system.' } }
    }
    if (@($cutterInfo.ports) -notcontains $port) { throw "COM port $port is not available." }

    $allowedBauds = @(4800, 9600, 19200, 38400, 57600, 115200)
    $baud = 9600
    if ($null -ne $request.baudRate) {
        if ($request.baudRate -is [bool]) { throw 'Invalid baud rate.' }
        $parsedBaud = 0
        if ($request.baudRate -is [string]) {
            $trimmedBaud = $request.baudRate.Trim()
            if ($trimmedBaud -cnotmatch '\A[0-9]+\z' -or -not [int]::TryParse($trimmedBaud, [ref]$parsedBaud)) { throw 'Invalid baud rate.' }
        } elseif ($request.baudRate -is [ValueType]) {
            $baudDouble = [double]$request.baudRate
            if ([double]::IsNaN($baudDouble) -or [double]::IsInfinity($baudDouble) -or $baudDouble -ne [Math]::Floor($baudDouble) -or $baudDouble -lt 1 -or $baudDouble -gt 1000000) {
                throw 'Invalid baud rate.'
            }
            $parsedBaud = [int]$baudDouble
        } else {
            throw 'Invalid baud rate.'
        }
        if ($allowedBauds -notcontains $parsedBaud) { throw 'Unsupported baud rate.' }
        $baud = $parsedBaud
    }

    $flow = 'None'
    if ($null -ne $request.flowControl) {
        if ($request.flowControl -isnot [string]) { throw 'Invalid flow control.' }
        switch ($request.flowControl.Trim().ToLowerInvariant()) {
            '' { $flow = 'None' }
            'requesttosend' { $flow = 'RequestToSend' }
            'rts' { $flow = 'RequestToSend' }
            'xonxoff' { $flow = 'XOnXOff' }
            'none' { $flow = 'None' }
            default { throw 'Unsupported flow control.' }
        }
    }

    if ($request.hpgl -isnot [string]) { throw 'Invalid HP-GL payload.' }
    Test-TemHoaSafeHpgl $request.hpgl
    $byteCount = [System.Text.Encoding]::ASCII.GetByteCount($request.hpgl)

    $helper = Join-Path $taskRoot 'Cutter-TemHoa-Windows.ps1'
    if (!(Test-Path -LiteralPath $helper -PathType Leaf)) {
        return @{ status = '503 Service Unavailable'; body = @{ error = 'Missing Cutter-TemHoa-Windows.ps1. Download the complete update.' } }
    }

    $cutJob = Join-Path ([System.IO.Path]::GetTempPath()) ('TemHoa-cut-' + [Guid]::NewGuid().ToString('N') + '.hpgl')
    $cutControl = [System.IO.Path]::ChangeExtension($cutJob, '.ctl')
    $proc = $null
    try {
        [System.IO.File]::WriteAllText($cutJob, $request.hpgl, [System.Text.Encoding]::ASCII)
        [System.IO.File]::WriteAllText($cutControl, 'run', [System.Text.Encoding]::ASCII)
        $powerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
        $psi = [System.Diagnostics.ProcessStartInfo]::new()
        $psi.FileName = $powerShell
        $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$helper`" -SendJob -PortName $port -BaudRate $baud -FlowControl $flow -JobPath `"$cutJob`" -ControlPath `"$cutControl`""
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8
        $proc = [System.Diagnostics.Process]::Start($psi)
        # Run in the background so the UI can poll status and send Pause / Resume / Cancel while cutting.
        $script:TemHoaCut = @{
            proc = $proc
            out = $proc.StandardOutput.ReadToEndAsync()
            err = $proc.StandardError.ReadToEndAsync()
            job = $cutJob
            control = $cutControl
            port = $port
            bytes = $byteCount
            deadline = [DateTime]::UtcNow.AddHours(2)
        }
        $proc = $null
        return @{ status = '200 OK'; body = @{ started = $true; port = $port; bytes = $byteCount } }
    } catch {
        if ($null -ne $proc) { try { $proc.Kill() } catch {}; try { $proc.Dispose() } catch {} }
        foreach ($f in @($cutJob, $cutControl)) { if (Test-Path -LiteralPath $f) { Remove-Item -LiteralPath $f -Force -ErrorAction SilentlyContinue } }
        return @{ status = '503 Service Unavailable'; body = @{ error = $_.Exception.Message } }
    }
}

function Get-TemHoaCutStatus {
    $cut = $script:TemHoaCut
    if ($null -eq $cut) { return @{ running = $false; idle = $true } }
    $proc = $cut.proc
    if (-not $proc.HasExited) {
        if ([DateTime]::UtcNow -gt $cut.deadline) {
            try { $proc.Kill() } catch {}
        } else {
            $mode = ''
            try { $mode = ([System.IO.File]::ReadAllText($cut.control)).Trim().ToLowerInvariant() } catch {}
            return @{ running = $true; paused = ($mode -eq 'pause'); cancelling = ($mode -eq 'cancel'); port = $cut.port; bytes = $cut.bytes }
        }
    }
    try { $proc.WaitForExit() } catch {}
    $outText = ''; $errText = ''
    try { $outText = $cut.out.GetAwaiter().GetResult() } catch {}
    try { $errText = $cut.err.GetAwaiter().GetResult() } catch {}
    $exitCode = -1
    try { $exitCode = $proc.ExitCode } catch {}
    try { $proc.Dispose() } catch {}
    foreach ($f in @($cut.job, $cut.control)) { if ($f -and (Test-Path -LiteralPath $f)) { Remove-Item -LiteralPath $f -Force -ErrorAction SilentlyContinue } }
    $script:TemHoaCut = $null
    if ($exitCode -ne 0) {
        $errClean = if ($errText -and $errText.Trim()) { $errText.Trim() } elseif ($outText -and $outText.Trim()) { $outText.Trim() } else { "Failed to send job to $($cut.port)." }
        return @{ running = $false; done = $true; ok = $false; error = $errClean; port = $cut.port; bytes = $cut.bytes }
    }
    $wasStopped = [bool]($outText -match '"stopped"\s*:\s*true')
    return @{ running = $false; done = $true; ok = $true; stopped = $wasStopped; port = $cut.port; bytes = $cut.bytes }
}

function Set-TemHoaCutControl($request) {
    if (!$request -or $request.action -isnot [string]) { throw 'Invalid cut control request.' }
    $action = $request.action.Trim().ToLowerInvariant()
    if ($action -notin @('pause', 'resume', 'cancel')) { throw 'Unsupported cut control action.' }
    $cut = $script:TemHoaCut
    if ($null -ne $cut -and -not $cut.proc.HasExited) {
        $value = if ($action -eq 'resume') { 'run' } else { $action }
        [System.IO.File]::WriteAllText($cut.control, $value, [System.Text.Encoding]::ASCII)
        if ($action -eq 'cancel') {
            $exited = $false
            try { $exited = $cut.proc.WaitForExit(4500) } catch {}
            if (-not $exited) {
                try { $cut.proc.Kill() } catch {}
            }
            $finalStatus = Get-TemHoaCutStatus
            return @{ running = $false; stopped = $true; action = 'cancel'; port = $cut.port }
        }
        return @{ running = $true; paused = ($action -eq 'pause'); action = $action; port = $cut.port }
    }
    if ($action -eq 'cancel' -and $request.port -is [string] -and $request.port.Trim()) {
        $resetReq = [pscustomobject]@{
            port = $request.port
            baudRate = if ($null -ne $request.baudRate) { $request.baudRate } else { 9600 }
            flowControl = if ($request.flowControl -is [string] -and $request.flowControl) { $request.flowControl } else { 'None' }
            hpgl = 'IN;SP1;PU;PU0,0;'
        }
        $outcome = Invoke-TemHoaCutterJob $resetReq
        if ($null -ne $script:TemHoaCut) {
            try { $script:TemHoaCut.proc.WaitForExit(2000) | Out-Null } catch {}
            $null = Get-TemHoaCutStatus
        }
        return @{ running = $false; stopped = $true; action = 'cancel'; port = $request.port.Trim().ToUpperInvariant() }
    }
    return @{ running = $false; error = 'No cut job is running.' }
}
$taskListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 8765)
try { $taskListener.Start() } catch {
    $taskListener.Stop()
    $taskListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $taskListener.Start()
}
$taskPort = $taskListener.LocalEndpoint.Port
$taskUrl = "http://127.0.0.1:$taskPort/"
$taskBrowsers = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
    "${env:LOCALAPPDATA}\Microsoft\Edge\Application\msedge.exe"
)
$taskBrowser = $taskBrowsers | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if ($env:TEMHOA_DESKTOP -ne '1') {
    if ($taskBrowser) { Start-Process -FilePath $taskBrowser -ArgumentList $taskUrl } else { Start-Process $taskUrl }
}
Write-Host "Tem Hoa: $taskUrl"
Write-Host 'Keep this window open while using Tem Hoa. Close it to stop.'
try {
    while ($true) {
        $taskClient = $taskListener.AcceptTcpClient()
        try {
            $taskStream = $taskClient.GetStream()
            $taskStream.ReadTimeout = 3000
            $taskHeaderBuffer = [System.IO.MemoryStream]::new()
            while ($true) {
                $taskByte = $taskStream.ReadByte()
                if ($taskByte -lt 0) { throw 'Incomplete request.' }
                $taskHeaderBuffer.WriteByte([byte]$taskByte)
                if ($taskHeaderBuffer.Length -gt 16384) { throw 'Request headers too large.' }
                if ($taskHeaderBuffer.Length -ge 4) {
                    $taskArray = $taskHeaderBuffer.GetBuffer(); $taskN = [int]$taskHeaderBuffer.Length
                    if ($taskArray[$taskN-4] -eq 13 -and $taskArray[$taskN-3] -eq 10 -and $taskArray[$taskN-2] -eq 13 -and $taskArray[$taskN-1] -eq 10) { break }
                }
            }
            $taskLines = [System.Text.Encoding]::ASCII.GetString($taskHeaderBuffer.ToArray()).Split(@("`r`n"), [System.StringSplitOptions]::None)
            $taskHeaderBuffer.Dispose()
            $taskParts = $taskLines[0].Split(' ')
            $taskHeaders = @{}
            foreach ($taskLine in $taskLines | Select-Object -Skip 1) {
                $taskColon = $taskLine.IndexOf(':')
                if ($taskColon -gt 0) { $taskHeaders[$taskLine.Substring(0,$taskColon).ToLowerInvariant()] = $taskLine.Substring($taskColon+1).Trim() }
            }
            $taskRouteParts = $taskParts[1] -split '\?', 2
            $taskRoute = $taskRouteParts[0]
            $taskStatus = '200 OK'; $taskMime = 'application/json; charset=utf-8'; $taskResult = $null
            if ($taskParts[0] -eq 'GET' -and ($taskRoute -eq '/' -or $taskRoute -eq '/TemHoa-MinhDien.html')) {
                $taskBody = $taskBytes; $taskMime = 'text/html; charset=utf-8'
            } elseif ($taskParts[0] -eq 'GET' -and $taskRoute -in @('/studio.css','/studio-core.js','/studio.js','/studio-objects.js', '/image-tools.js', '/image-tools.css', '/clipboard-tools.js', '/shape-tools.js', '/color-tools.js', '/cloud-cut-core.js', '/cloud-cut-tools.js', '/cloud-cut-tools.css')) {
                $taskStaticPath = Join-Path $taskRoot $taskRoute.Substring(1)
                if (Test-Path -LiteralPath $taskStaticPath -PathType Leaf) {
                    $taskBody = [System.IO.File]::ReadAllBytes($taskStaticPath)
                    $taskMime = if ($taskRoute.EndsWith('.css')) { 'text/css; charset=utf-8' } else { 'text/javascript; charset=utf-8' }
                } else {
                    $taskStatus = '404 Not Found'; $taskBody = [System.Text.Encoding]::UTF8.GetBytes('{"error":"File not found."}')
                }
            } elseif ($taskParts[0] -eq 'GET' -and ($taskRoute -eq '/favicon.ico' -or $taskRoute.StartsWith('/assets/'))) {
                $taskRel = if ($taskRoute -eq '/favicon.ico') { 'assets\temhoa.ico' } else { $taskRoute.Substring(1).Replace('/', '\') }
                $taskAssetsRoot = [System.IO.Path]::GetFullPath((Join-Path $taskRoot 'assets')).TrimEnd('\') + '\'
                $taskAssetPath = ''
                try { $taskAssetPath = [System.IO.Path]::GetFullPath((Join-Path $taskRoot $taskRel)) } catch { $taskAssetPath = '' }
                if ($taskAssetPath -and (Test-Path -LiteralPath $taskAssetPath -PathType Leaf) -and $taskAssetPath.StartsWith($taskAssetsRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
                    $taskBody = [System.IO.File]::ReadAllBytes($taskAssetPath)
                    $taskMime = switch -Wildcard ($taskAssetPath) {
                        '*.ico' { 'image/x-icon' }
                        '*.png' { 'image/png' }
                        '*.svg' { 'image/svg+xml' }
                        Default { 'application/octet-stream' }
                    }
                } else {
                    $taskStatus = '404 Not Found'; $taskBody = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Asset not found."}')
                }
            } elseif ($taskRoute -eq '/api/background' -and $taskHeaders['x-temhoa-token'] -eq $taskToken) {
                try {
                    $taskRequest = $null
                    if ($taskParts[0] -eq 'POST') {
                        $taskLength = [int]$taskHeaders['content-length']
                        if ($taskLength -le 0 -or $taskLength -gt 16777216) { throw 'AI image too large or empty.' }
                        $taskStream.ReadTimeout = 30000
                        $taskPayload = [byte[]]::new($taskLength); $taskRead = 0
                        while ($taskRead -lt $taskLength) {
                            $taskReceived = $taskStream.Read($taskPayload,$taskRead,$taskLength-$taskRead)
                            if ($taskReceived -le 0) { throw 'Incomplete AI request.' }
                            $taskRead += $taskReceived
                        }
                        $taskRequest = [Text.Encoding]::UTF8.GetString($taskPayload) | ConvertFrom-Json
                    }
                    $taskQuery = if ($taskRouteParts.Length -gt 1) { $taskRouteParts[1] } else { '' }
                    $taskResult = Invoke-TemHoaBackground $taskParts[0] $taskQuery $taskRequest
                } catch { $taskStatus = '400 Bad Request'; $taskResult = @{ error = $_.Exception.Message } }
                $taskBody = [Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $taskResult -Depth 10 -Compress))
            } elseif ($taskRoute -in @('/api/printers','/api/printer-properties','/api/print') -and $taskHeaders['x-temhoa-token'] -eq $taskToken) {
                try {
                    Add-Type -AssemblyName System.Drawing
                    $taskPrinterNames = @([System.Drawing.Printing.PrinterSettings]::InstalledPrinters | ForEach-Object { [string]$_ })
                    if ($taskRoute -eq '/api/printers' -and $taskParts[0] -eq 'GET') {
                        $taskPrinterSettings = [System.Drawing.Printing.PrinterSettings]::new()
                        $taskResult = @{ names = $taskPrinterNames; default = $taskPrinterSettings.PrinterName }
                    } elseif ($taskParts[0] -eq 'POST' -and $taskRoute -ne '/api/printers') {
                        $taskLength = [int]$taskHeaders['content-length']
                        $taskLimit = if ($taskRoute -eq '/api/print') { 67108864 } else { 16384 }
                        if ($taskLength -le 0 -or $taskLength -gt $taskLimit) { throw 'Print request too large or empty.' }
                        $taskStream.ReadTimeout = 30000
                        $taskPayload = [byte[]]::new($taskLength); $taskRead = 0
                        while ($taskRead -lt $taskLength) {
                            $taskReceived = $taskStream.Read($taskPayload,$taskRead,$taskLength-$taskRead)
                            if ($taskReceived -le 0) { throw 'Incomplete print request.' }
                            $taskRead += $taskReceived
                        }
                        $taskRequest = [System.Text.Encoding]::UTF8.GetString($taskPayload) | ConvertFrom-Json
                        if ($taskPrinterNames -notcontains [string]$taskRequest.printer) { throw 'Printer not found.' }
                        if ($taskRoute -eq '/api/printer-properties') {
                            # Same native Printing Preferences command used by cat_mdco.
                            Start-Process -FilePath (Join-Path $env:SystemRoot 'System32\rundll32.exe') -ArgumentList @('printui.dll,PrintUIEntry','/e','/n',('"' + [string]$taskRequest.printer + '"')) | Out-Null
                        } else {
                            $taskAllowedPapers = @('29.7x21','21x29.7','42x29.7','29.7x42','21x14.8','14.8x21')
                            $taskPaperKey = ([double]$taskRequest.widthCm).ToString('0.###',[System.Globalization.CultureInfo]::InvariantCulture) + 'x' + ([double]$taskRequest.heightCm).ToString('0.###',[System.Globalization.CultureInfo]::InvariantCulture)
                            if ($taskAllowedPapers -notcontains $taskPaperKey) { throw 'Invalid print paper size.' }
                            if ($taskRequest.color -isnot [bool] -or $taskRequest.png -isnot [string] -or !$taskRequest.png.StartsWith('iVBORw0KGgo')) { throw 'Invalid print image.' }
                            if ($null -ne $taskRequest.copies -and ([double]$taskRequest.copies -lt 1 -or [double]$taskRequest.copies -gt 99 -or [double]$taskRequest.copies -ne [Math]::Floor([double]$taskRequest.copies))) { throw 'Invalid number of copies.' }
                            $taskPrintHelper = Join-Path $taskRoot 'Print-TemHoa-Windows.ps1'
                            if (!(Test-Path -LiteralPath $taskPrintHelper)) { throw 'Missing Print-TemHoa-Windows.ps1. Download the complete update.' }
                            $taskPrintJob = Join-Path ([System.IO.Path]::GetTempPath()) ('TemHoa-print-' + [Guid]::NewGuid().ToString('N') + '.json')
                            [System.IO.File]::WriteAllText($taskPrintJob,(ConvertTo-Json -InputObject $taskRequest -Depth 10 -Compress),[System.Text.UTF8Encoding]::new($false))
                            try {
                                $taskPowerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
                                Start-Process -FilePath $taskPowerShell -ArgumentList @('-NoProfile','-STA','-ExecutionPolicy','Bypass','-File',('"'+$taskPrintHelper+'"'),'-JobPath',('"'+$taskPrintJob+'"')) -WindowStyle Hidden | Out-Null
                            } catch { Remove-Item -LiteralPath $taskPrintJob -Force; throw }
                        }
                        $taskResult = @{ opened = $true }
                    } else { throw 'Unsupported print method.' }
                } catch { $taskStatus = '400 Bad Request'; $taskResult = @{ error = $_.Exception.Message } }
                $taskBody = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $taskResult -Depth 20 -Compress))
            } elseif ($taskRoute -eq '/api/cutters' -and $taskHeaders['x-temhoa-token'] -eq $taskToken) {
                if ($taskParts[0] -eq 'GET') {
                    $taskCutterInfo = Get-TemHoaCutterPorts
                    $taskResult = @{ ports = @($taskCutterInfo.ports); portDetails = @($taskCutterInfo.details); supported = [bool]$taskCutterInfo.available }
                } else {
                    $taskStatus = '400 Bad Request'; $taskResult = @{ error = 'Unsupported cutter method.' }
                }
                $taskBody = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $taskResult -Depth 10 -Compress))
            } elseif ($taskRoute -eq '/api/cut' -and $taskHeaders['x-temhoa-token'] -eq $taskToken) {
                try {
                    if ($taskParts[0] -ne 'POST') { throw 'Unsupported cut method.' }
                    $taskRequest = Read-TemHoaJsonBody $taskStream $taskHeaders 10485760 'Cut request too large or empty.'
                    $taskOutcome = Invoke-TemHoaCutterJob $taskRequest
                    $taskStatus = $taskOutcome.status
                    $taskResult = $taskOutcome.body
                } catch {
                    $taskStatus = '400 Bad Request'
                    $taskResult = @{ error = $_.Exception.Message }
                }
                $taskBody = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $taskResult -Depth 10 -Compress))
            } elseif ($taskRoute -eq '/api/cut-status' -and $taskHeaders['x-temhoa-token'] -eq $taskToken) {
                try {
                    if ($taskParts[0] -ne 'GET') { throw 'Unsupported cut status method.' }
                    $taskResult = Get-TemHoaCutStatus
                } catch {
                    $taskStatus = '400 Bad Request'
                    $taskResult = @{ error = $_.Exception.Message }
                }
                $taskBody = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $taskResult -Depth 10 -Compress))
            } elseif ($taskRoute -eq '/api/cut-control' -and $taskHeaders['x-temhoa-token'] -eq $taskToken) {
                try {
                    if ($taskParts[0] -ne 'POST') { throw 'Unsupported cut control method.' }
                    $taskRequest = Read-TemHoaJsonBody $taskStream $taskHeaders 4096 'Cut control request too large or empty.'
                    $taskResult = Set-TemHoaCutControl $taskRequest
                } catch {
                    $taskStatus = '400 Bad Request'
                    $taskResult = @{ error = $_.Exception.Message }
                }
                $taskBody = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $taskResult -Depth 10 -Compress))
            } elseif ($taskRoute -eq '/api/templates' -and $taskHeaders['x-temhoa-token'] -eq $taskToken) {
                try {
                    New-Item -ItemType Directory -Force -Path $taskTemplateRoot | Out-Null
                    if ($taskParts[0] -eq 'GET') {
                        $taskNameMatch = if ($taskRouteParts.Length -gt 1) { [regex]::Match($taskRouteParts[1], '(?:^|&)name=([^&]*)') } else { $null }
                        if ($taskNameMatch -and $taskNameMatch.Success) {
                            $taskName = [Uri]::UnescapeDataString($taskNameMatch.Groups[1].Value)
                            $taskPath = Get-TemplatePath $taskName
                            if (!(Test-Path -LiteralPath $taskPath)) { throw 'Template not found.' }
                            if ((Get-Item -LiteralPath $taskPath).Length -gt 33554432) { throw 'Template too large.' }
                            $taskResult = [System.IO.File]::ReadAllText($taskPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
                            Test-Template $taskResult
                        } else {
                            $taskNames = @(Get-ChildItem -LiteralPath $taskTemplateRoot -File -Filter '*.json' | Where-Object { ($_.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0 } | Sort-Object Name | ForEach-Object { $_.BaseName })
                            $taskResult = @{ names = $taskNames }
                        }
                    } elseif ($taskParts[0] -eq 'DELETE') {
                        $taskNameMatch = if ($taskRouteParts.Length -gt 1) { [regex]::Match($taskRouteParts[1], '(?:^|&)name=([^&]*)') } else { $null }
                        if (!$taskNameMatch -or !$taskNameMatch.Success) { throw 'Missing template name.' }
                        $taskPath = Get-TemplatePath ([Uri]::UnescapeDataString($taskNameMatch.Groups[1].Value))
                        if (!(Test-Path -LiteralPath $taskPath -PathType Leaf)) { throw 'Template not found.' }
                        Remove-Item -LiteralPath $taskPath -ErrorAction Stop
                        $taskResult = @{ name = [System.IO.Path]::GetFileNameWithoutExtension($taskPath) }
                    } elseif ($taskParts[0] -eq 'POST') {
                        $taskLength = [int]$taskHeaders['content-length']
                        if ($taskLength -le 0 -or $taskLength -gt 33554432) { throw 'Template request too large or empty.' }
                        $taskPayload = [byte[]]::new($taskLength); $taskRead = 0
                        while ($taskRead -lt $taskLength) {
                            $taskReceived = $taskStream.Read($taskPayload,$taskRead,$taskLength-$taskRead)
                            if ($taskReceived -le 0) { throw 'Incomplete request body.' }
                            $taskRead += $taskReceived
                        }
                        $taskRequest = [System.Text.Encoding]::UTF8.GetString($taskPayload) | ConvertFrom-Json
                        $taskPath = Get-TemplatePath $taskRequest.name
                        Test-Template $taskRequest.template
                        $taskJson = ConvertTo-Json -InputObject $taskRequest.template -Depth 100 -Compress
                        if ([System.Text.Encoding]::UTF8.GetByteCount($taskJson) -gt 33554432) { throw 'Template too large.' }
                        $taskTemporary = Join-Path $taskTemplateRoot ([Guid]::NewGuid().ToString('N') + '.tmp')
                        try {
                            [System.IO.File]::WriteAllText($taskTemporary,$taskJson,[System.Text.UTF8Encoding]::new($false))
                            if (Test-Path -LiteralPath $taskPath) { [System.IO.File]::Replace($taskTemporary,$taskPath,($taskTemporary + '.bak')) } else { [System.IO.File]::Move($taskTemporary,$taskPath) }
                        } finally { if (Test-Path -LiteralPath $taskTemporary) { Remove-Item -LiteralPath $taskTemporary }; if (Test-Path -LiteralPath ($taskTemporary + '.bak')) { Remove-Item -LiteralPath ($taskTemporary + '.bak') } }
                        $taskResult = @{ name = [System.IO.Path]::GetFileNameWithoutExtension($taskPath) }
                    } else { throw 'Unsupported request method.' }
                } catch { $taskStatus = '400 Bad Request'; $taskResult = @{ error = $_.Exception.Message } }
                $taskBody = [System.Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $taskResult -Depth 100 -Compress))
            } else {
                $taskStatus = '403 Forbidden'; $taskBody = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Cannot access templates."}')
            }
            $taskResponse = "HTTP/1.1 $taskStatus`r`nContent-Type: $taskMime`r`nContent-Length: $($taskBody.Length)`r`nCache-Control: no-store`r`nPermissions-Policy: local-fonts=(self)`r`nConnection: close`r`n`r`n"
            $taskHeadBytes = [System.Text.Encoding]::ASCII.GetBytes($taskResponse)
            $taskStream.Write($taskHeadBytes,0,$taskHeadBytes.Length)
            $taskStream.Write($taskBody,0,$taskBody.Length)
            $taskStream.Flush()
        } catch { } finally { $taskClient.Dispose() }
    }
} finally { $taskListener.Stop(); Close-TemHoaBackground }

