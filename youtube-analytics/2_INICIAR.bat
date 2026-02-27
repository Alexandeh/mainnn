@echo off
title YouTube Analytics Dashboard
color 0A
echo.
echo ================================================
echo   YouTube Analytics Dashboard
echo   Canal: @AIrtVids
echo ================================================
echo.

:: Verificar que se haya instalado
if not exist backend\venv (
    echo ERROR: Primero debes ejecutar "1_INSTALAR.bat"
    pause
    exit /b 1
)

if not exist backend\.env (
    echo ERROR: No existe el archivo backend\.env
    echo Ejecuta primero "1_INSTALAR.bat"
    pause
    exit /b 1
)

:: Verificar que tenga credenciales configuradas
findstr /C:"your_client_id_here" backend\.env >nul 2>&1
if not errorlevel 1 (
    echo.
    echo ATENCION: Aun no has configurado tus credenciales de Google.
    echo.
    echo Abre el archivo "backend\.env" con el Bloc de notas y pon:
    echo   GOOGLE_CLIENT_ID=tu_id_aqui
    echo   GOOGLE_CLIENT_SECRET=tu_secret_aqui
    echo.
    echo Lee el archivo INSTRUCCIONES_GOOGLE.txt para saber como obtenerlas.
    echo.
    pause
    exit /b 1
)

echo Iniciando el servidor backend (Python)...
start "Backend - YouTube Analytics" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

echo Esperando que el backend arranque...
timeout /t 3 /nobreak >nul

echo Iniciando el frontend (React)...
start "Frontend - YouTube Analytics" cmd /k "cd frontend && npm run dev"

echo Esperando que el frontend arranque...
timeout /t 4 /nobreak >nul

echo.
echo ================================================
echo   DASHBOARD LISTO
echo ================================================
echo.
echo Abriendo el navegador...
start http://localhost:3000

echo.
echo Se abrieron 2 ventanas negras (terminales).
echo NO las cierres mientras uses el dashboard.
echo.
echo Para parar el dashboard: cierra esas 2 ventanas.
echo.
pause
