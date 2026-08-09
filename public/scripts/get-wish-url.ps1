# Guideshin — extract Genshin wish history URL (PC)
# Run: irm https://guideshin.ru/scripts/get-wish-url.ps1 | iex
# Open Wish History in game first and wait until it loads.

$ErrorActionPreference = "Continue"
try { chcp 65001 | Out-Null } catch {}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Ok($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host $msg -ForegroundColor Red }

function Find-LatestAuthUrlInText([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  # Берём ПОСЛЕДНЮЮ ссылку — в логах/кэше она самая свежая
  $matches = [regex]::Matches(
    $text,
    'https://[^\s"''<>]+authkey=[^\s"''<>]+',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )
  if ($matches.Count -eq 0) { return $null }
  $value = $matches[$matches.Count - 1].Value
  return ($value -replace '[\\]+$', '' -replace '[\x00-\x1F]+', '')
}

function Read-FileAsLatin1([string]$path) {
  try {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::GetEncoding(28591))
  } catch {
    try { return Get-Content -LiteralPath $path -Raw -ErrorAction Stop } catch { return $null }
  }
}

$candidates = New-Object System.Collections.Generic.List[object]

@(
  "$env:USERPROFILE\AppData\LocalLow\miHoYo\Genshin Impact\output_log.txt",
  "$env:USERPROFILE\AppData\LocalLow\HoYoverse\Genshin Impact\output_log.txt",
  "$env:USERPROFILE\AppData\LocalLow\miHoYo\GenshinImpact\output_log.txt"
) | ForEach-Object {
  if (Test-Path -LiteralPath $_) {
    $item = Get-Item -LiteralPath $_
    [void]$candidates.Add([pscustomobject]@{ Path = $item.FullName; Time = $item.LastWriteTimeUtc })
  }
}

$cacheRoots = @(
  "$env:USERPROFILE\AppData\LocalLow\miHoYo",
  "$env:USERPROFILE\AppData\LocalLow\HoYoverse"
)
foreach ($root in $cacheRoots) {
  if (-not (Test-Path -LiteralPath $root)) { continue }
  Get-ChildItem -LiteralPath $root -Recurse -Filter "data_2" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 12 |
    ForEach-Object {
      [void]$candidates.Add([pscustomobject]@{ Path = $_.FullName; Time = $_.LastWriteTimeUtc })
    }
}

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
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 6 |
    ForEach-Object {
      [void]$candidates.Add([pscustomobject]@{ Path = $_.FullName; Time = $_.LastWriteTimeUtc })
    }
}

if ($candidates.Count -eq 0) {
  Write-Err "Genshin log not found."
  Write-Warn "Open game -> Wish History -> wait for load -> run again."
  exit 1
}

# Сначала самые свежие файлы
$ordered = $candidates |
  Sort-Object Time -Descending |
  Group-Object Path |
  ForEach-Object { $_.Group | Select-Object -First 1 }

$url = $null
$source = $null
foreach ($entry in $ordered) {
  $text = Read-FileAsLatin1 $entry.Path
  $found = Find-LatestAuthUrlInText $text
  if ($found) {
    $url = $found
    $source = $entry.Path
    break
  }
}

if (-not $url) {
  Write-Err "authkey URL not found."
  Write-Warn "1) Switch to the needed Genshin account"
  Write-Warn "2) Open Wish History and wait until it fully loads"
  Write-Warn "3) Close history and run this command again"
  exit 1
}

try {
  Set-Clipboard -Value $url
  Write-Ok "OK! Link copied to clipboard."
  Write-Host ""
  Write-Host "Back to Guideshin -> paste from clipboard." -ForegroundColor Cyan
  Write-Host "Source: $source" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host $url -ForegroundColor DarkGray
} catch {
  Write-Warn "Clipboard failed. Copy the link manually:"
  Write-Host $url
}
