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
# Eski tunel ve sunucu surecleri kalmasin (eski link zaten gecersiz olur)
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
$srv = Start-Process node -ArgumentList 'server.js', $port -PassThru -WindowStyle Minimized

# 1) Sunucu gercekten ayaga kalkti mi?
$local = $false
for ($i = 0; $i -lt 20 -and -not $local; $i++) {
  Start-Sleep -Milliseconds 500
  try { $r = Invoke-WebRequest -Uri "http://localhost:$port/api/info" -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { $local = $true } } catch {}
}
if (-not $local) {
  Write-Host 'Sunucu baslamadi (port 3000 baska bir programda olabilir). Once DURDUR.bat calistir, tekrar dene.' -ForegroundColor Red
  Read-Host 'Cikmak icin Enter'
  exit
}

# 2) Tunel: http2 kullan (bazi aglarda varsayilan QUIC/UDP engelli oldugu icin 1033 hatasi verir)
$log = Join-Path $env:TEMP 'mmofps-tunnel.log'
if (Test-Path $log) { Remove-Item $log -Force }
$tun = Start-Process '.\cloudflared.exe' -ArgumentList 'tunnel', '--url', "http://localhost:$port", '--protocol', 'http2', '--no-autoupdate', '--logfile', $log -PassThru -WindowStyle Minimized

# 3) Link yazilsa bile tunel baglanmadan acilirsa 1033 verir: "Registered tunnel connection" gorunene kadar bekle
$url = $null; $registered = $false
for ($i = 0; $i -lt 60 -and -not ($url -and $registered); $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path $log) {
    $txt = Get-Content $log -Raw -ErrorAction SilentlyContinue
    if (-not $url -and $txt) {
      $m = [regex]::Matches($txt, 'https://(?!api\.)[a-z0-9-]+\.trycloudflare\.com') | Select-Object -First 1
      if ($m) { $url = $m.Value }
    }
    if ($txt -match 'Registered tunnel connection') { $registered = $true }
  }
}
Write-Host ''
if (-not $url -or -not $registered) {
  Write-Host 'Tunel baglanamadi. Internet/guvenlik duvari (VPN, okul-is agi) cloudflare baglantisini engelliyor olabilir.' -ForegroundColor Red
  Write-Host "Ayrintilar: $log" -ForegroundColor Yellow
  Read-Host 'Cikmak icin Enter'
  exit
}

# 4) Linke disaridan gercekten ulasiliyor mu? (DNS yayilmasi birkac saniye surebilir)
$ok = $false
for ($i = 0; $i -lt 30 -and -not $ok; $i++) {
  try { $r = Invoke-WebRequest -Uri "$url/api/info" -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { $ok = $true } } catch { Start-Sleep -Seconds 2 }
}
Set-Content -Path (Join-Path $PSScriptRoot 'LINK.txt') -Value $url
try { Set-Clipboard -Value $url } catch {}
Write-Host '==============================================================' -ForegroundColor Green
if ($ok) { Write-Host ' OYUN LINKI (panoya kopyalandi, arkadaslarina yapistir):' -ForegroundColor Green }
else { Write-Host ' LINK HAZIR AMA HENUZ DOGRULANAMADI (1 dk bekleyip dene):' -ForegroundColor Yellow }
Write-Host ''
Write-Host "   $url" -ForegroundColor Cyan
Write-Host ''
Write-Host ' Arkadaslar linki tarayicida acar, Cevrimici Arena > Kayit ol.' -ForegroundColor Green
Write-Host ' Bu link SADECE bu acilista gecerli; sunucuyu kapatinca/yeniden acinca YENI link olusur.' -ForegroundColor Green
Write-Host ' Kapatmak icin DURDUR.bat dosyasini calistir.' -ForegroundColor Green
Write-Host '==============================================================' -ForegroundColor Green
if ($ok) { Start-Process $url }
Write-Host ''
Read-Host 'Bu pencereyi kapatabilirsin (sunucu arkada calismaya devam eder). Enter'
