#!/bin/bash
# DocuFlow AI - Unix/Linux Startup Script

echo "=========================================================="
echo "  Starting DocuFlow AI Academic Platform"
echo "=========================================================="

# Start MongoDB if not running
if ! nc -z 127.0.0.1 27017; then
  echo "[1/4] Starting MongoDB..."
  mongod --dbpath "$(pwd)/../storage/mongodb_data" --bind_ip 127.0.0.1 --fork --logpath /tmp/mongod.log
fi

# Start Python AI Service
echo "[2/4] Starting FastAPI AI Service..."
(cd ../ai-service && python3 app/main.py) &

# Start Backend
echo "[3/4] Starting Node.js Backend..."
(cd ../backend && node src/server.js) &

# Start Frontend
echo "[4/4] Starting Vite Frontend..."
(cd ../frontend && npm run dev) &

echo "DocuFlow AI services launched!"
