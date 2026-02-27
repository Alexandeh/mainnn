@echo off
title Instalando YouTube Analytics Dashboard...
color 0A
echo.
echo ================================================
echo   YouTube Analytics Dashboard - INSTALACION
echo   Canal: @AIrtVids
echo ================================================
echo.

:: Verificar Python
echo [1/4] Comprobando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Python no encontrado.
    echo Descargalo desde: https://www.python.org/downloads/
    echo Asegurate de marcar "Add Python to PATH" al instalar.
    pause
    exit /b 1
)
python --version
echo OK - Python encontrado

:: Verificar Node.js
echo.
echo [2/4] Comprobando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js no encontrado.
    echo Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo OK - Node.js encontrado

:: Instalar dependencias del backend
echo.
echo [3/4] Instalando dependencias del backend Python...
echo (Esto puede tardar 1-2 minutos, es normal)
echo.
cd backend

python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR instalando dependencias Python. Revisa tu conexion a internet.
    pause
    exit /b 1
)

:: Crear .env si no existe
if not exist .env (
    copy .env.example .env >nul
    echo.
    echo Se creo el archivo backend\.env
)

cd ..

:: Instalar dependencias del frontend
echo.
echo [4/4] Instalando dependencias del frontend...
echo (Esto puede tardar 1-2 minutos)
echo.
cd frontend
npm install
if errorlevel 1 (
    echo.
    echo ERROR instalando dependencias Node. Revisa tu conexion a internet.
    pause
    exit /b 1
)
cd ..

echo.
echo ================================================
echo   INSTALACION COMPLETADA
echo ================================================
echo.
echo Ahora necesitas configurar tus credenciales de Google.
echo.
echo SIGUIENTE PASO:
echo Abre el archivo "backend\.env" con el Bloc de notas
echo y pon tu GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.
echo.
echo Si no tienes las credenciales aun, abre el archivo
echo "INSTRUCCIONES_GOOGLE.txt" para ver como obtenerlas.
echo.
pause
