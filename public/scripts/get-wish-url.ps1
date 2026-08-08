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

function Find-AuthUrlInText([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
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

@(
  "$env:USERPROFILE\AppData\LocalLow\miHoYo\Genshin Impact\output_log.txt",
  "$env:USERPROFILE\AppData\LocalLow\HoYoverse\Genshin Impact\output_log.txt",
  "$env:USERPROFILE\AppData\LocalLow\miHoYo\GenshinImpact\output_log.txt"
) | ForEach-Object {
  if (Test-Path -LiteralPath $_) { [void]$candidates.Add($_) }
}

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
  Write-Err "Genshin log not found."
  Write-Warn "Open game -> Wish History -> wait for load -> run again."
  exit 1
}

$url = $null
foreach ($path in ($candidates | Select-Object -Unique)) {
  $text = Read-FileAsLatin1 $path
  $found = Find-AuthUrlInText $text
  if ($found) {
    $url = $found
    Write-Host "Source: $path" -ForegroundColor DarkGray
    break
  }
}

if (-not $url) {
  Write-Err "authkey URL not found."
  Write-Warn "1) Open Wish History in game and wait"
  Write-Warn "2) Close the history window"
  Write-Warn "3) Run this command again"
  exit 1
}

try {
  Set-Clipboard -Value $url
  Write-Ok "OK! Link copied to clipboard."
  Write-Host ""
  Write-Host "Back to Guideshin -> paste from clipboard." -ForegroundColor Cyan
  Write-Host ""
  Write-Host $url -ForegroundColor DarkGray
} catch {
  Write-Warn "Clipboard failed. Copy the link manually:"
  Write-Host $url
}
