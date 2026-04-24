$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $PSScriptRoot
$gameUrl = "http://localhost:5173"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm was not found. Install Node.js LTS first: https://nodejs.org/"
}

if (-not (Test-Path (Join-Path $projectDir "package.json"))) {
  throw "Could not find package.json in '$projectDir'."
}

Set-Location $projectDir

Write-Host "Starting web server..."
$serverProcess = Start-Process -FilePath "npm.cmd" `
  -ArgumentList @("run", "dev", "--", "--host", "--strictPort", "--port", "5173") `
  -WorkingDirectory $projectDir `
  -PassThru `
  -WindowStyle Minimized

function Stop-DevServer {
  if ($null -ne $serverProcess -and -not $serverProcess.HasExited) {
    & cmd.exe /c "taskkill /PID $($serverProcess.Id) /T /F >nul 2>&1"
  }
}

try {
  Write-Host "Waiting for server on $gameUrl ..."
  $isUp = $false
  for ($i = 0; $i -lt 90; $i++) {
    $client = $null
    try {
      $client = New-Object System.Net.Sockets.TcpClient
      $connectTask = $client.ConnectAsync("127.0.0.1", 5173)
      if ($connectTask.Wait(500)) {
        $isUp = $true
        break
      }
    } finally {
      if ($null -ne $client) {
        $client.Dispose()
      }
    }
    Start-Sleep -Milliseconds 500
  }

  if (-not $isUp) {
    throw "Server did not start in time."
  }

  $edgePath = Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe"
  $chromePath = Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"
  $launcherProfileDir = Join-Path $env:TEMP "space-ship-web-launcher-profile"
  New-Item -Path $launcherProfileDir -ItemType Directory -Force | Out-Null
  $browserProcess = $null

  if (Test-Path $edgePath) {
    $browserProcess = Start-Process -FilePath $edgePath -ArgumentList @("--new-window", "--app=$gameUrl", "--user-data-dir=$launcherProfileDir") -PassThru
  } elseif (Test-Path $chromePath) {
    $browserProcess = Start-Process -FilePath $chromePath -ArgumentList @("--new-window", "--app=$gameUrl", "--user-data-dir=$launcherProfileDir") -PassThru
  } else {
    Start-Process $gameUrl | Out-Null
    Write-Host "Opened in your default browser."
    Write-Host "Close this window to stop the server."
    [void](Read-Host "Press Enter after you close the game")
    return
  }

  Write-Host "Game opened. Closing the game window will stop the server."
  Start-Sleep -Milliseconds 800
  if ($browserProcess.HasExited) {
    # Some Chromium builds return from the launcher process immediately.
    # In that case, watch for any browser process tied to this dedicated profile.
    while ($true) {
      $matching = Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" |
        Where-Object { $_.CommandLine -like "*$launcherProfileDir*" }
      if (-not $matching) { break }
      Start-Sleep -Milliseconds 500
    }
  } else {
    Wait-Process -Id $browserProcess.Id
  }
}
finally {
  Write-Host "Stopping web server..."
  Stop-DevServer
}
