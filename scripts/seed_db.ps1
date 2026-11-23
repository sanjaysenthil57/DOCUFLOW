# DocuFlow AI - Database Seeder Script (Windows PowerShell)

Write-Host "Seeding DocuFlow AI MongoDB Database (25 Logical Collections)..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\..\backend"
node src/scripts/seed.js
Write-Host "Database seeding completed!" -ForegroundColor Green
