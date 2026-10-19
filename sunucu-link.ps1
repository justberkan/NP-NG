$ErrorActionPreference = 'Stop'
# Beklenmeyen hata olursa pencere aninda kapanmasin: hatayi goster ve bekle
trap {
  Write-Host ''
  Write-Host ('HATA: ' + $_) -ForegroundColor Red
  Write-Host 'Bu pencerenin fotografini Claude''a gonder.' -ForegroundColor Yellow
  Read-Host 'Cikmak icin Enter'
  exit 1
}
Set-Location $PSScriptRoot
$port = 3000
if (-not (Test-Path (Join-Path $PSScriptRoot 'server.js'))) {
  Write-Host 'server.js bulunamadi. Zip''i once bir klasore CIKAR, sonra bu dosyayi o klasorden calistir.' -ForegroundColor Red
  Read-Host 'Cikmak icin Enter'
  exit
}
# Tam sunucu paketinde node\node.exe hazir gelir (kurulum gerekmez); yoksa bilgisayarda kurulu Node.js
$node = Join-Path $PSScriptRoot 'node\node.exe'
if (-not (Test-Path $node)) {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  $node = if ($cmd) { $cmd.Source } else { $null }
}
if (-not $node) {
  Write-Host ''
  Write-Host 'Node.js bulunamadi: bu klasorde node\node.exe yok, bilgisayarda da kurulu degil.' -ForegroundColor Yellow
  Write-Host 'Tam sunucu paketini kullan ya da acilan sayfadan LTS surumunu kur.' -ForegroundColor Yellow
  Start-Process 'https://nodejs.org'
  Read-Host 'Cikmak icin Enter'
  exit
}
if (-not (Test-Path '.\cloudflared.exe')) {
  Write-Host 'Tunel programi indiriliyor (sadece ilk seferde), bekle...'
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '.\cloudflared.exe'
}
# Eski tunel kalmasin (eski link zaten gecersiz olur)
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force

# Sunucu ayakta mi? Dogrudan 127.0.0.1'e TCP baglantisi (localhost/IPv6 ve proxy ayarlarindan etkilenmez)
function Test-Port([int]$p) {
  $c = New-Object System.Net.Sockets.TcpClient
  try { $iar = $c.BeginConnect('127.0.0.1', $p, $null, $null); return ($iar.AsyncWaitHandle.WaitOne(700) -and $c.Connected) }
  catch { return $false } finally { $c.Close() }
}

# 1) Sunucu: zaten calisiyorsa (onceki denemeden kalan) yeniden kullan, yoksa baslat ve 60 sn'ye kadar bekle
#    (ilk acilista antivirus node.exe'yi tararken baslangic uzun surebilir)
if (Test-Port $port) {
  Write-Host 'Sunucu zaten calisiyor (port 3000), yeniden kullaniliyor.' -ForegroundColor Green
} else {
  $srv = Start-Process $node -ArgumentList 'server.js', $port -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Minimized
  Write-Host 'Sunucu baslatiliyor' -NoNewline
  $local = $false
  for ($i = 0; $i -lt 90 -and -not $local; $i++) {
    Start-Sleep -Milliseconds 700
    Write-Host '.' -NoNewline
    if ($srv.HasExited) { break }
    $local = Test-Port $port
  }
  Write-Host ''
  if (-not $local) {
    if ($srv.HasExited) { Write-Host 'Sunucu kapandi: port 3000 baska bir programda olabilir. Once DURDUR.bat calistir, tekrar dene.' -ForegroundColor Red }
    else { Write-Host 'Sunucu 60 sn icinde yanit vermedi. 1 dk bekleyip SUNUCU-INTERNET.bat dosyasini tekrar calistir (acik sunucu yeniden kullanilir).' -ForegroundColor Red }
    Read-Host 'Cikmak icin Enter'
    exit
  }
  Write-Host 'Sunucu calisiyor.' -ForegroundColor Green
}

# 2) Tunel: http2 kullan (bazi aglarda varsayilan QUIC/UDP engelli oldugu icin 1033 hatasi verir)
$log = Join-Path $env:TEMP 'mmofps-tunnel.log'
if (Test-Path $log) { Remove-Item $log -Force }
$tun = Start-Process '.\cloudflared.exe' -ArgumentList 'tunnel', '--url', "http://127.0.0.1:$port", '--protocol', 'http2', '--no-autoupdate', '--logfile', $log -PassThru -WindowStyle Minimized

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
