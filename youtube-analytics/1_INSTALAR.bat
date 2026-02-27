@echo off
title Instalando YouTube Analytics Dashboard...
color 0A

:: IMPORTANTE: posicionarse en la carpeta donde esta este .bat
cd /d "%~dp0"

echo.
echo ================================================
echo   YouTube Analytics Dashboard - INSTALACION
echo   Canal: @AIrtVids
echo ================================================
echo.
echo Carpeta del proyecto: %~dp0
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
echo (Esto puede tardar 2-3 minutos, es normal)
echo.

cd /d "%~dp0backend"

if not exist venv (
    echo Creando entorno virtual de Python...
    python -m venv venv
    if errorlevel 1 (
        echo.
        echo ERROR creando el entorno virtual.
        echo Intenta ejecutar este archivo como Administrador:
        echo clic derecho en 1_INSTALAR.bat -> Ejecutar como administrador
        pause
        exit /b 1
    )
)

echo Activando entorno virtual...
call "%~dp0backend\venv\Scripts\activate.bat"

echo Instalando librerias Python...
pip install -r "%~dp0backend\requirements.txt"

if errorlevel 1 (
    echo.
    echo ERROR instalando librerias Python. Revisa tu conexion a internet.
    pause
    exit /b 1
)

:: Crear .env si no existe
if not exist "%~dp0backend\.env" (
    copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
    echo Se creo el archivo backend\.env
)

:: Instalar dependencias del frontend
echo.
echo [4/4] Instalando dependencias del frontend...
echo (Esto puede tardar 2-3 minutos)
echo.

cd /d "%~dp0frontend"
npm install

if errorlevel 1 (
    echo.
    echo ERROR instalando dependencias del frontend. Revisa tu conexion a internet.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   INSTALACION COMPLETADA CON EXITO
echo ================================================
echo.
echo Siguiente paso:
echo.
echo 1. Lee el archivo INSTRUCCIONES_GOOGLE.txt para
echo    obtener tus credenciales de Google (10 min).
echo.
echo 2. Abre backend\.env con el Bloc de notas y pon
echo    tu GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.
echo.
echo 3. Haz doble clic en 2_INICIAR.bat para arrancar.
echo.
pause
