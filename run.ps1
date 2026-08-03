Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host "  Nepal Dev Terminal - Full Stack Start" -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host ""

$ngrokPath = Join-Path $PSScriptRoot "ngrok.exe"
if (-not (Test-Path $ngrokPath)) {
    Write-Host "  Downloading ngrok..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip" -OutFile "$PSScriptRoot\ngrok.zip"
    Expand-Archive -Path "$PSScriptRoot\ngrok.zip" -DestinationPath "$PSScriptRoot\ngrok-tmp" -Force
    Move-Item "$PSScriptRoot\ngrok-tmp\ngrok.exe" $ngrokPath -Force
    Remove-Item "$PSScriptRoot\ngrok.zip", "$PSScriptRoot\ngrok-tmp" -Recurse -Force
    Write-Host "  ngrok installed!" -ForegroundColor Green
}

Write-Host "  Starting ngrok tunnel for web (port 3001)..." -ForegroundColor Cyan
Start-Process -FilePath $ngrokPath -ArgumentList "http 3001" -WindowStyle Hidden
Start-Sleep -Seconds 3

Write-Host "  Starting ngrok tunnel for signaling (port 8001)..." -ForegroundColor Cyan
Start-Process -FilePath $ngrokPath -ArgumentList "http 8001" -WindowStyle Hidden
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "  --- ngrok URLs ---" -ForegroundColor White
$resp = try { Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop } catch { $null }
if ($resp -and $resp.tunnels) {
    foreach ($t in $resp.tunnels) {
        Write-Host "    $($t.proto) -> $($t.public_url)" -ForegroundColor Green
    }
} else {
    Write-Host "    (ngrok inspect not ready yet)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "  Starting Python signaling server on port 8001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "cd '${PSScriptRoot}\server'; python call_server.py" -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host "  Starting Next.js on port 3001..." -ForegroundColor Cyan
Write-Host ""
npm run dev