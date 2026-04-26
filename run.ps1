# Aletheia: Full-Stack Start Script (Improved)

Write-Host "🚀 Starting Aletheia Forensic Audit System..." -ForegroundColor Cyan

# Ensure any existing processes on the target ports are cleaned up
Write-Host "[CLEANUP] Checking for existing processes on ports 8005 and 5173..." -ForegroundColor Gray
$BackendPID = Get-NetTCPConnection -LocalPort 8005 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($BackendPID) {
    Write-Host "Stopping existing backend process ($BackendPID)..." -ForegroundColor Yellow
    Stop-Process -Id $BackendPID -Force
}

$FrontendPID = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($FrontendPID) {
    Write-Host "Stopping existing frontend process ($FrontendPID)..." -ForegroundColor Yellow
    Stop-Process -Id $FrontendPID -Force
}

# 1. Start Backend API
Write-Host "[BACKEND] Initializing FastAPI on port 8005..." -ForegroundColor Yellow
$BackendProcess = Start-Process python -ArgumentList "backend/api.py" -NoNewWindow -PassThru

# 2. Start Frontend
Write-Host "[FRONTEND] Initializing Vite Dev Server..." -ForegroundColor Green
# On Windows, npm is often a .cmd file, so we run it via cmd.exe
$FrontendProcess = Start-Process cmd.exe -ArgumentList "/c npm run dev" -WorkingDirectory "frontend" -NoNewWindow -PassThru

Write-Host "`n✅ System is booting!" -ForegroundColor White
Write-Host "--------------------------------------------------"
Write-Host "FRONTEND: http://localhost:5173" -ForegroundColor Green
Write-Host "BACKEND:  http://localhost:8005" -ForegroundColor Yellow
Write-Host "--------------------------------------------------"
Write-Host "Press Ctrl+C to stop both servers.`n"

try {
    while ($true) {
        if ($BackendProcess.HasExited) {
            Write-Host "⚠️ Backend process exited unexpectedly!" -ForegroundColor Red
            break
        }
        if ($FrontendProcess.HasExited) {
            Write-Host "⚠️ Frontend process exited unexpectedly!" -ForegroundColor Red
            break
        }
        Start-Sleep -Seconds 2
    }
}
finally {
    Write-Host "`n🛑 Shutting down servers..." -ForegroundColor Red
    if ($BackendProcess -and !$BackendProcess.HasExited) {
        Stop-Process -Id $BackendProcess.Id -Force
    }
    if ($FrontendProcess -and !$FrontendProcess.HasExited) {
        Stop-Process -Id $FrontendProcess.Id -Force
    }
    Write-Host "Done."
}
