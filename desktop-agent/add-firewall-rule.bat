@echo off
title DeskRemote - Windows Defender Firewall Configuration
echo ================================================================
echo        DeskRemote - Open Port 8765 in Windows Defender Firewall
echo ================================================================
echo.
echo Requesting Administrator privileges to allow inbound TCP 8765...
echo.

powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command \"Write-Host ''Configuring Windows Defender Firewall for DeskRemote...'' -ForegroundColor Cyan; New-NetFirewallRule -DisplayName ''DeskRemote Desktop Agent'' -Direction Inbound -LocalPort 8765 -Protocol TCP -Action Allow -Profile Any -ErrorAction SilentlyContinue; Write-Host ''`n[SUCCESS] Port 8765 is now OPEN for incoming connections from your phone!'' -ForegroundColor Green; Start-Sleep -Seconds 4\"'"

echo Done. Check the UAC prompt if one appeared.
pause