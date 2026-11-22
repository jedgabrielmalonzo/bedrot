# Remove DeskRemote Agent from Windows Startup
$startupFolder = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$shortcutPath = Join-Path $startupFolder "DeskRemote Agent.lnk"

if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "✅ DeskRemote Agent removed from Windows Startup." -ForegroundColor Green
} else {
    Write-Host "DeskRemote Agent was not found in Windows Startup folder." -ForegroundColor Yellow
}
