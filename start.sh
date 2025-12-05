#!/bin/bash
echo "Starting Backend on Port 3000..."
cd backend
npm install
npx prisma migrate dev --name init
npm run start &
BACKEND_PID=$!

echo "Waiting for backend..."
sleep 5

echo "Starting Frontend on Port 3001..."
cd ../frontend
npm install
PORT=3001 npm run dev &
FRONTEND_PID=$!

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
