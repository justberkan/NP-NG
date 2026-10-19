$ErrorActionPreference = 'Stop'
# N.P.N.G. sunucu guncelleme: en son surumu GitHub'dan (justberkan/NP-NG, main) indirir, oyun dosyalarini yeniler.
# DOKUNMAZ: data\ (hesaplar), node\, cloudflared.exe, LINK.txt. Gelistirici klasorleri (docs, tests, electron) kopyalanmaz.
trap {
  Write-Host ''
  Write-Host ('HATA: ' + $_) -ForegroundColor Red
  Write-Host 'Guncelleme yarida kaldi; mevcut oyun dosyalari ve hesaplar yerinde. Bu pencerenin fotografini Claude''a gonder.' -ForegroundColor Yellow
  Read-Host 'Cikmak icin Enter'
  exit 1
}
Set-Location $PSScriptRoot
if (-not (Test-Path (Join-Path $PSScriptRoot 'server.js'))) { throw 'server.js bulunamadi: bu dosyayi oyun klasorunun icinden calistir.' }
function Get-Build([string]$f) { if (Test-Path $f) { $m = [regex]::Match((Get-Content $f -Raw), 'build (\d{12}[^<"]*)'); if ($m.Success) { return $m.Groups[1].Value.Trim() } }; return '?' }
$once = Get-Build (Join-Path $PSScriptRoot 'index.html')
$tmpRoot = [IO.Path]::GetTempPath()
$zip = Join-Path $tmpRoot 'npng-main.zip'
$tmp = Join-Path $tmpRoot 'npng-guncelle'
Write-Host "Su anki surum: $once"
Write-Host 'En son surum indiriliyor (60-100 MB, birkac dakika surebilir)...'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri 'https://github.com/justberkan/NP-NG/archive/refs/heads/main.zip' -OutFile $zip -UseBasicParsing
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $tmp -Force
$src = Get-ChildItem $tmp -Directory | Select-Object -First 1
if (-not $src -or -not (Test-Path (Join-Path $src.FullName 'server.js')) -or -not (Test-Path (Join-Path $src.FullName 'index.html'))) { throw 'Indirilen paket eksik (server.js / index.html yok).' }
# Sunucu dosyalari degisirse yeniden baslatmak gerekir; yalniz oyun (istemci) dosyalari degistiyse Ctrl+F5 yeter
function Get-ServerHash { $h = ''; foreach ($f in Get-ChildItem $PSScriptRoot -File | Where-Object { $_.Name -like 'server*' }) { $h += $f.Name + (Get-FileHash $f.FullName -Algorithm SHA256).Hash }; return $h }
$srvOnce = Get-ServerHash
$skip = @('data', 'node', 'docs', 'tests', 'electron', 'test-results', '_yedek', '.github', 'cloudflared.exe', 'LINK.txt')
$n = 0
foreach ($it in Get-ChildItem $src.FullName -Force) {
  if ($skip -contains $it.Name -or $it.Name.StartsWith('.')) { continue }
  Copy-Item -Path $it.FullName -Destination $PSScriptRoot -Recurse -Force
  $n++
}
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $zip -Force -ErrorAction SilentlyContinue
$sonra = Get-Build (Join-Path $PSScriptRoot 'index.html')
Write-Host ''
Write-Host "Guncellendi: $once  ->  $sonra  ($n oge yenilendi; hesaplar dokunulmadi)" -ForegroundColor Green
if ((Get-ServerHash) -ne $srvOnce) { Write-Host 'Sunucu dosyalari degisti: sunucu yeniden baslatilacak (internet linki degisir).' -ForegroundColor Yellow; exit 3 }
exit 0
