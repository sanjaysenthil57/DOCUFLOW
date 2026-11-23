$dbPath = "C:\Users\user\OneDrive\Documents\MINI P\DocuFlow-AI\storage\mongodb_data"
$mongodExe = "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe"
$logPath = "C:\Users\user\OneDrive\Documents\MINI P\DocuFlow-AI\storage\mongod_test.log"

Write-Host "Starting MongoDB process inside session..."
$mongoProc = Start-Process -FilePath $mongodExe -ArgumentList "--dbpath `"$dbPath`" --port 27017 --bind_ip 127.0.0.1 --logpath `"$logPath`" --setParameter diagnosticDataCollectionEnabled=false" -PassThru

# Give mongod 3.5 seconds to complete startup
Start-Sleep -Milliseconds 3500

Write-Host "MongoDB started. Running Auth Test Suite..."

try {
    node "DocuFlow-AI/backend/src/scripts/test_auth_suite.js"
    $exitCode = $LASTEXITCODE
} finally {
    Write-Host "Stopping MongoDB test instance..."
    Stop-Process -Id $mongoProc.Id -Force -ErrorAction SilentlyContinue
}

exit $exitCode
