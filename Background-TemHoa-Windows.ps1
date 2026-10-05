# Optional Python AI worker. Called only by the authenticated localhost server.
$script:TemHoaAIJobs = @{}
$script:TemHoaAIPath = Join-Path ([IO.Path]::GetTempPath()) ('TemHoa-AI-' + [Guid]::NewGuid().ToString('N'))
function Invoke-TemHoaBackground([string]$method, [string]$query, $request) {
    $bundled = !!$env:TEMHOA_AI_EXE
    $python = if ($bundled) { $env:TEMHOA_AI_EXE } else { Join-Path $taskRoot '.temhoa-ai\Scripts\python.exe' }
    $ready = (Test-Path -LiteralPath $python) -and ($bundled -or (Test-Path -LiteralPath (Join-Path $taskRoot '.temhoa-ai\ready')))
    if ($method -eq 'GET') {
        $match = [regex]::Match($query, '(?:^|&)job=([a-f0-9]{32})(?:&|$)')
        if (!$query) { return @{ available = $ready; models = @('fast','quality') } }
        if (!$match.Success -or !$script:TemHoaAIJobs.ContainsKey($match.Groups[1].Value)) { throw 'Khong tim thay tac vu AI.' }
        $job = $script:TemHoaAIJobs[$match.Groups[1].Value]
        $result = Join-Path $job.folder 'result.json'
        if (Test-Path -LiteralPath $result) { return ([IO.File]::ReadAllText($result,[Text.Encoding]::UTF8) | ConvertFrom-Json) }
        if (((Get-Date) - $job.started).TotalSeconds -gt 600) {
            if (!$job.process.HasExited) { $job.process.Kill() }
            return @{ state='error'; error='AI qua thoi gian. Hay chon che do Nhanh hoac anh nho hon.' }
        }
        if ($job.process.HasExited) { return @{ state='error'; error='Bo AI chua chay duoc. Hay khoi dong lai hoac cai lai TEMhoa.' } }
        return @{ state='running' }
    }
    if ($method -ne 'POST') { throw 'Unsupported AI method.' }
    if (!$ready) { throw 'Chua cai AI. Hay chay Cai-AI-Windows.bat trong thu muc phan mem.' }
    if ($request.mode -notin @('fast','quality')) { throw 'Invalid AI mode.' }
    foreach ($job in $script:TemHoaAIJobs.Values) {
        if (!$job.process.HasExited) { throw 'Mot anh khac dang xu ly. Hay doi hoan tat.' }
    }
    foreach ($job in $script:TemHoaAIJobs.Values) { Remove-Item -LiteralPath $job.folder -Recurse -Force -ErrorAction SilentlyContinue; $job.process.Dispose() }
    $script:TemHoaAIJobs.Clear()
    $id = [Guid]::NewGuid().ToString('N')
    $folder = Join-Path $script:TemHoaAIPath $id
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
    [IO.File]::WriteAllText((Join-Path $folder 'request.json'), (ConvertTo-Json -InputObject $request -Depth 5 -Compress), [Text.UTF8Encoding]::new($false))
    $helper = Join-Path $taskRoot 'background_ai.py'
    $arguments = if ($bundled) { @('--job',('"'+$folder+'"')) } else { @(('"'+$helper+'"'),'--job',('"'+$folder+'"')) }
    $process = Start-Process -FilePath $python -ArgumentList $arguments -WindowStyle Hidden -PassThru
    $script:TemHoaAIJobs[$id] = @{ process=$process; folder=$folder; started=(Get-Date) }
    return @{ job=$id }
}
function Close-TemHoaBackground {
    foreach ($job in $script:TemHoaAIJobs.Values) { if (!$job.process.HasExited) { $job.process.Kill() }; $job.process.Dispose() }
    if (Test-Path -LiteralPath $script:TemHoaAIPath) { Remove-Item -LiteralPath $script:TemHoaAIPath -Recurse -Force -ErrorAction SilentlyContinue }
}
