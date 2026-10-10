[CmdletBinding()]
param(
  [switch]$Restart
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$localUrl = 'http://localhost:3000/'
$stdout = Join-Path $repoRoot 'nuxt-dev.stdout.log'
$stderr = Join-Path $repoRoot 'nuxt-dev.stderr.log'

function Open-LocalSiteInChrome {
  $deadline = (Get-Date).AddSeconds(30)
  $ready = $false
  do {
    try {
      $response = Invoke-WebRequest -Uri $localUrl -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        $ready = $true
        break
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  } while ((Get-Date) -lt $deadline)

  if (-not $ready) {
    throw "Local server did not respond within 30 seconds. Check $stdout and $stderr."
  }

  $chromeCandidates = @(
    (Join-Path $env:ProgramFiles 'Google\\Chrome\\Application\\chrome.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Google\\Chrome\\Application\\chrome.exe'),
    (Join-Path $env:LOCALAPPDATA 'Google\\Chrome\\Application\\chrome.exe')
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

  $chrome = $chromeCandidates | Select-Object -First 1
  if (-not $chrome) {
    $chrome = (Get-Command 'chrome.exe' -ErrorAction SilentlyContinue).Source
  }
  if (-not $chrome) { throw '找不到 Google Chrome。' }

  Start-Process -FilePath $chrome -ArgumentList $localUrl
}

$existingListeners = @(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue)

if ($existingListeners.Count -gt 0 -and -not $Restart) {
  $processIds = $existingListeners | Select-Object -ExpandProperty OwningProcess -Unique
  Write-Host "Local server is already running at $localUrl (PID: $($processIds -join ', '))."
  Open-LocalSiteInChrome
  exit 0
}

if ($existingListeners.Count -gt 0) {
  $existingListeners |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction Stop }
}

$startProcess = @{
  FilePath = 'npm.cmd'
  ArgumentList = @('run', 'dev', '--', '--host', '127.0.0.1')
  WorkingDirectory = $repoRoot
  RedirectStandardOutput = $stdout
  RedirectStandardError = $stderr
  WindowStyle = 'Hidden'
  PassThru = $true
}
$process = Start-Process @startProcess

Write-Host "Starting local server at $localUrl (PID: $($process.Id))."
Write-Host "Logs: $stdout and $stderr"
Open-LocalSiteInChrome
