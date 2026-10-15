$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$port = 3000
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host ''
  Write-Host 'Node.js kurulu degil. Acilan sayfadan LTS surumunu indirip kur, sonra bu dosyayi tekrar calistir.' -ForegroundColor Yellow
  Start-Process 'https://nodejs.org'
  Read-Host 'Cikmak icin Enter'
  exit
}
if (-not (Test-Path '.\cloudflared.exe')) {
  Write-Host 'Tunel programi indiriliyor (sadece ilk seferde), bekle...'
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '.\cloudflared.exe'
}
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
$srv = Start-Process node -ArgumentList 'server.js', $port -PassThru -WindowStyle Minimized
Start-Sleep -Seconds 2
$log = Join-Path $env:TEMP 'mmofps-tunnel.log'
if (Test-Path $log) { Remove-Item $log -Force }
$tun = Start-Process '.\cloudflared.exe' -ArgumentList 'tunnel', '--url', "http://localhost:$port", '--logfile', $log -PassThru -WindowStyle Minimized
$url = $null
for ($i = 0; $i -lt 40 -and -not $url; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path $log) {
    $m = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($m) { $url = $m.Matches[0].Value }
  }
}
Write-Host ''
if (-not $url) {
  Write-Host 'Internet linki alinamadi. Internet baglantini kontrol edip tekrar dene.' -ForegroundColor Red
  Read-Host 'Cikmak icin Enter'
  exit
}
Set-Content -Path (Join-Path $PSScriptRoot 'LINK.txt') -Value $url
try { Set-Clipboard -Value $url } catch {}
Write-Host '==============================================================' -ForegroundColor Green
Write-Host ' OYUN LINKI (panoya kopyalandi, arkadaslarina yapistir):' -ForegroundColor Green
Write-Host ''
Write-Host "   $url" -ForegroundColor Cyan
Write-Host ''
Write-Host ' Arkadaslar linki tarayicida acar, Cevrimici Arena > Kayit ol.' -ForegroundColor Green
Write-Host ' Sen de ayni linki tarayicinda ac.' -ForegroundColor Green
Write-Host ' Kapatmak icin DURDUR.bat dosyasini calistir.' -ForegroundColor Green
Write-Host '==============================================================' -ForegroundColor Green
Start-Process $url
Write-Host ''
Read-Host 'Bu pencereyi kapatabilirsin (sunucu arkada calismaya devam eder). Enter'
