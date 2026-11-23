# DocuFlow AI - Automated System Startup Script (Windows PowerShell)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting DocuFlow AI Multi-Tier Academic Platform" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start MongoDB (if not running)
$mongoCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $mongoCheck) {
    Write-Host "[1/4] Starting MongoDB Daemon..." -ForegroundColor Yellow
    $mongoExe = "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe"
    $dbPath = "$PSScriptRoot\..\storage\mongodb_data"
    Start-Process -FilePath $mongoExe -ArgumentList "--dbpath `"$dbPath`" --port 27017 --bind_ip 127.0.0.1 --setParameter diagnosticDataCollectionEnabled=false" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[1/4] MongoDB is already running on port 27017." -ForegroundColor Green
}

# 2. Start Python AI Microservice
Write-Host "[2/4] Starting Python FastAPI AI Verification Service on Port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\ai-service'; python app/main.py"

# 3. Start Node.js Express Backend
Write-Host "[3/4] Starting Node.js Express Backend API on Port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\backend'; node src/server.js"

# 4. Start Vite React Frontend
Write-Host "[4/4] Starting React Vite Frontend Application on Port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\frontend'; npm run dev"

Write-Host "----------------------------------------------------------" -ForegroundColor Cyan
Write-Host "DocuFlow AI is ready!" -ForegroundColor Green
Write-Host "  Frontend:  http://127.0.0.1:3000" -ForegroundColor White
Write-Host "  Backend:   http://127.0.0.1:5000/api" -ForegroundColor White
Write-Host "  AI Engine: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor Cyan
