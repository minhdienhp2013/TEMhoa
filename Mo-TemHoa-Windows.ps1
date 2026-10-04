$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$taskHtml = Join-Path $taskRoot 'TemHoa-MinhDien.html'
if (!(Test-Path -LiteralPath $taskHtml)) { throw 'TemHoa-MinhDien.html is missing. Extract the complete ZIP first.' }
$taskBytes = [System.IO.File]::ReadAllBytes($taskHtml)
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
            $taskReader = [System.IO.StreamReader]::new($taskStream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $taskFirst = $taskReader.ReadLine()
            if (!$taskFirst) { continue }
            do { $taskHeader = $taskReader.ReadLine() } while ($taskHeader)
            $taskParts = $taskFirst.Split(' ')
            $taskRoute = ($taskParts[1] -split '\?')[0]
            $taskOk = $taskParts[0] -eq 'GET' -and ($taskRoute -eq '/' -or $taskRoute -eq '/TemHoa-MinhDien.html')
            if ($taskOk) { $taskBody = $taskBytes; $taskStatus = '200 OK' } else { $taskBody = [System.Text.Encoding]::UTF8.GetBytes('Not found'); $taskStatus = '404 Not Found' }
            $taskResponse = "HTTP/1.1 $taskStatus`r`nContent-Type: text/html; charset=utf-8`r`nContent-Length: $($taskBody.Length)`r`nCache-Control: no-store`r`nPermissions-Policy: local-fonts=(self)`r`nConnection: close`r`n`r`n"
            $taskHeadBytes = [System.Text.Encoding]::ASCII.GetBytes($taskResponse)
            $taskStream.Write($taskHeadBytes,0,$taskHeadBytes.Length)
            $taskStream.Write($taskBody,0,$taskBody.Length)
            $taskStream.Flush()
        } catch { } finally { $taskClient.Dispose() }
    }
} finally { $taskListener.Stop() }
