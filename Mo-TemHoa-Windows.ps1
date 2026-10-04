$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$taskHtml = Join-Path $taskRoot 'TemHoa-MinhDien.html'
if (!(Test-Path -LiteralPath $taskHtml)) { throw 'TemHoa-MinhDien.html is missing. Extract the complete ZIP first.' }
$taskToken = [Guid]::NewGuid().ToString('N')
$taskTemplateRoot = Join-Path $taskRoot 'Mau-Tem-Hoa'
$taskHtmlText = [System.IO.File]::ReadAllText($taskHtml, [System.Text.Encoding]::UTF8)
$taskHtmlText = $taskHtmlText.Replace('<script>', "<script>window.TEMHOA_TOKEN='$taskToken';</script><script>")
$taskBytes = [System.Text.Encoding]::UTF8.GetBytes($taskHtmlText)
function Get-TemplatePath([string]$name) {
    $name = $name.Trim()
    if (!$name -or $name.Length -gt 80 -or $name -match '[\x00-\x1f\\/:*?"<>|]' -or $name.EndsWith('.')) { throw 'Invalid template name (1-80 characters, no file path characters).' }
    if ($name.Split('.')[0] -match '^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$') { throw 'Reserved template filename.' }
    $path = Join-Path $taskTemplateRoot ($name + '.json')
    if ((Test-Path -LiteralPath $path) -and (([System.IO.File]::GetAttributes($path) -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)) { throw 'Invalid template file.' }
    return $path
}
function Test-Template($data) {
    if (!$data -or $data.version -ne 1 -or !$data.settings -or $data.settings.text -isnot [string]) { throw 'Invalid template JSON.' }
}
$taskListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 8765)
try { $taskListener.Start() } catch {
    $taskListener.Stop()
    $taskListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $taskListener.Start()
}
$taskPort = $taskListener.LocalEndpoint.Port
$taskUrl = "http://localhost:$taskPort/"
$taskBrowsers = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
)
$taskBrowser = $taskBrowsers | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if ($taskBrowser) { Start-Process -FilePath $taskBrowser -ArgumentList $taskUrl } else { Start-Process $taskUrl }
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
            } elseif ($taskRoute -eq '/api/templates' -and $taskHeaders['x-temhoa-token'] -eq $taskToken) {
                try {
                    New-Item -ItemType Directory -Force -Path $taskTemplateRoot | Out-Null
                    if ($taskParts[0] -eq 'GET') {
                        $taskNameMatch = if ($taskRouteParts.Length -gt 1) { [regex]::Match($taskRouteParts[1], '(?:^|&)name=([^&]*)') } else { $null }
                        if ($taskNameMatch -and $taskNameMatch.Success) {
                            $taskName = [Uri]::UnescapeDataString($taskNameMatch.Groups[1].Value)
                            $taskPath = Get-TemplatePath $taskName
                            if (!(Test-Path -LiteralPath $taskPath)) { throw 'Template not found.' }
                            if ((Get-Item -LiteralPath $taskPath).Length -gt 262144) { throw 'Template too large.' }
                            $taskResult = [System.IO.File]::ReadAllText($taskPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
                            Test-Template $taskResult
                        } else {
                            $taskNames = @(Get-ChildItem -LiteralPath $taskTemplateRoot -File -Filter '*.json' | Where-Object { ($_.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0 } | Sort-Object Name | ForEach-Object { $_.BaseName })
                            $taskResult = @{ names = $taskNames }
                        }
                    } elseif ($taskParts[0] -eq 'POST') {
                        $taskLength = [int]$taskHeaders['content-length']
                        if ($taskLength -le 0 -or $taskLength -gt 262144) { throw 'Template request too large or empty.' }
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
                        if ([System.Text.Encoding]::UTF8.GetByteCount($taskJson) -gt 262144) { throw 'Template too large.' }
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
} finally { $taskListener.Stop() }
