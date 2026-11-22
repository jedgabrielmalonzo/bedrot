# Generate self-signed TLS certificate for DeskRemote Agent (WSS)
$certDir = Join-Path $PSScriptRoot "..\certs"
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
}

$certPath = Join-Path $certDir "cert.pem"
$keyPath = Join-Path $certDir "key.pem"

Write-Host "Generating self-signed certificate for DeskRemote..." -ForegroundColor Cyan

$cert = New-SelfSignedCertificate -DnsName "localhost", ([System.Net.Dns]::GetHostName()) -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(5)

$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$certPem = "-----BEGIN CERTIFICATE-----`r`n" + [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks) + "`r`n-----END CERTIFICATE-----`r`n"
[System.IO.File]::WriteAllText($certPath, $certPem)

# Export private key (requires password)
$pwd = ConvertTo-SecureString -String "deskremote" -Force -AsPlainText
$pfxPath = Join-Path $certDir "temp.pfx"
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwd | Out-Null

Write-Host "Certificates generated in: $certDir" -ForegroundColor Green
Write-Host "Set DESKREMOTE_CERT_PATH and DESKREMOTE_KEY_PATH to enable WSS encryption." -ForegroundColor Yellow
