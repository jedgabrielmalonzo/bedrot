# Install DeskRemote Agent into Windows Startup folder
$startupFolder = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$agentRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$batPath = Join-Path $agentRoot "start-agent.bat"

$ws = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $startupFolder "DeskRemote Agent.lnk"
$shortcut = $ws.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = $agentRoot.Path
$shortcut.Description = "DeskRemote Desktop Agent"
$shortcut.Save()

Write-Host "✅ DeskRemote Agent registered to start automatically with Windows!" -ForegroundColor Green
Write-Host "Shortcut created at: $shortcutPath" -ForegroundColor Cyan
