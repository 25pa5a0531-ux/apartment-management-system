# Stop Apartment Management servers running on ports 5000 and 5173
Write-Host "Stopping Apartment Management servers..." -ForegroundColor Yellow

$p5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $p5000) {
    if ($p -and $p -ne 0) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "Terminated process $p on port 5000." -ForegroundColor Green
    }
}

$p5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $p5173) {
    if ($p -and $p -ne 0) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "Terminated process $p on port 5173." -ForegroundColor Green
    }
}

Write-Host "Both servers stopped successfully." -ForegroundColor Cyan
