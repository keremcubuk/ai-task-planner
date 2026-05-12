#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check and start Ollama
echo "Checking Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "Ollama is not running. Starting Ollama..."
  if command -v ollama &> /dev/null; then
    ollama serve &
    OLLAMA_PID=$!
    echo "Waiting for Ollama to be ready..."
    for i in {1..30}; do
      if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "Ollama is ready!"
        break
      fi
      sleep 1
    done
  else
    echo "WARNING: Ollama command not found. Please install Ollama: https://ollama.com/download"
    echo "AI summary features will not work without Ollama."
  fi
else
  echo "Ollama is already running."
fi

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
trap "kill $BACKEND_PID $FRONTEND_PID${OLLAMA_PID:+ $OLLAMA_PID}" EXIT

wait
