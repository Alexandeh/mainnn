#!/bin/bash
# Script para iniciar el dashboard completo

set -e

echo "=== YouTube Analytics Dashboard - @AIrtVids ==="
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 no encontrado. Instala Python 3.10+"
    exit 1
fi

# Verificar Node
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no encontrado. Instala Node.js 18+"
    exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Setup backend
echo "[1/4] Configurando backend Python..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "IMPORTANTE: Se creó backend/.env desde el ejemplo."
    echo "Edita backend/.env con tus credenciales de Google antes de continuar."
    echo ""
    echo "  GOOGLE_CLIENT_ID=..."
    echo "  GOOGLE_CLIENT_SECRET=..."
    echo ""
    echo "Sigue las instrucciones en http://localhost:3000 (pestaña Configuración)"
    echo ""
fi

# Setup frontend
echo "[2/4] Instalando dependencias del frontend..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install --silent
fi

# Iniciar backend en background
echo "[3/4] Iniciando backend FastAPI en puerto 8000..."
cd "$BACKEND_DIR"
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 2

# Iniciar frontend
echo "[4/4] Iniciando frontend React en puerto 3000..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== Dashboard listo ==="
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo "Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM
wait
