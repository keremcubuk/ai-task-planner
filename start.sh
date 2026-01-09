#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Starting Backend on Port 3000..."
cd "${SCRIPT_DIR}/backend"

# Load engine environment variables
if [ "${PRISMA_USE_LOCAL_ENGINES}" = "true" ]; then
  source .env.engines
fi

npm install
npx prisma migrate dev --name init
npm run start &
BACKEND_PID=$!

echo "Waiting for backend..."
sleep 5

echo "Starting Frontend on Port 3001..."
cd "${SCRIPT_DIR}/frontend"
npm install
PORT=3001 npm run dev &
FRONTEND_PID=$!

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
