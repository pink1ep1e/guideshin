# Guideshin — извлечение ссылки истории молитв Genshin Impact (PC)
# Запуск: irm https://guideshin.ru/scripts/get-wish-url.ps1 | iex
# Перед запуском откройте в игре «История молитв» и дождитесь загрузки.

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Ok($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host $msg -ForegroundColor Red }

function Find-AuthUrlInText([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  # Полный URL с authkey (API или web-страница истории)
  $m = [regex]::Match(
    $text,
    'https://[^\s"''<>]+authkey=[^\s"''<>]+',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )
  if ($m.Success) {
    return ($m.Value -replace '[\\]+$', '' -replace '[\x00-\x1F]+', '')
  }
  return $null
}

function Read-FileAsLatin1([string]$path) {
  try {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::GetEncoding(28591))
  } catch {
    try { return Get-Content -LiteralPath $path -Raw -ErrorAction Stop } catch { return $null }
  }
}

$candidates = New-Object System.Collections.Generic.List[string]

# Логи клиента
@(
  "$env:USERPROFILE\AppData\LocalLow\miHoYo\Genshin Impact\output_log.txt",
  "$env:USERPROFILE\AppData\LocalLow\HoYoverse\Genshin Impact\output_log.txt",
  "$env:USERPROFILE\AppData\LocalLow\miHoYo\GenshinImpact\output_log.txt"
) | ForEach-Object {
  if (Test-Path -LiteralPath $_) { [void]$candidates.Add($_) }
}

# Chromium cache data_2 (актуальный способ после обновлений клиента)
$cacheRoots = @(
  "$env:USERPROFILE\AppData\LocalLow\miHoYo",
  "$env:USERPROFILE\AppData\LocalLow\HoYoverse"
)
foreach ($root in $cacheRoots) {
  if (-not (Test-Path -LiteralPath $root)) { continue }
  Get-ChildItem -LiteralPath $root -Recurse -Filter "data_2" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 8 |
    ForEach-Object { [void]$candidates.Add($_.FullName) }
}

# Также ищем webCaches рядом с типовыми путями установки
$installHints = @(
  "C:\Program Files\Genshin Impact",
  "C:\Program Files\HoYoPlay\games\Genshin Impact game",
  "D:\Genshin Impact",
  "D:\Program Files\Genshin Impact",
  "E:\Genshin Impact"
)
foreach ($hint in $installHints) {
  if (-not (Test-Path -LiteralPath $hint)) { continue }
  Get-ChildItem -LiteralPath $hint -Recurse -Filter "data_2" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match "webCaches" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 4 |
    ForEach-Object { [void]$candidates.Add($_.FullName) }
}

if ($candidates.Count -eq 0) {
  Write-Err "Не найден лог Genshin Impact."
  Write-Warn "Откройте игру → История молитв → дождитесь загрузки → запустите скрипт снова."
  exit 1
}

$url = $null
foreach ($path in ($candidates | Select-Object -Unique)) {
  $text = Read-FileAsLatin1 $path
  $found = Find-AuthUrlInText $text
  if ($found) {
    $url = $found
    Write-Host "Источник: $path" -ForegroundColor DarkGray
    break
  }
}

if (-not $url) {
  Write-Err "Ссылка с authkey не найдена."
  Write-Warn "1) Откройте историю молитв в игре и подождите загрузки"
  Write-Warn "2) Закройте окно истории"
  Write-Warn "3) Запустите эту команду снова"
  exit 1
}

try {
  Set-Clipboard -Value $url
  Write-Ok "Готово! Ссылка скопирована в буфер обмена."
  Write-Host ""
  Write-Host "Вернитесь на Guideshin → кабинет молитв → «Вставить из буфера»." -ForegroundColor Cyan
  Write-Host ""
  Write-Host $url -ForegroundColor DarkGray
} catch {
  Write-Warn "Не удалось записать в буфер. Скопируйте ссылку вручную:"
  Write-Host $url
}
