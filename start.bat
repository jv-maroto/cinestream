@echo off
echo ========================================
echo        CineStream - Tu Cine en Casa
echo ========================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker no esta instalado o no esta corriendo.
    echo Por favor, instala Docker Desktop desde: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Verificar si Docker Desktop está corriendo
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop no esta corriendo.
    echo Por favor, inicia Docker Desktop y vuelve a ejecutar este script.
    pause
    exit /b 1
)

echo Docker detectado correctamente.
echo.

REM Verificar GPU NVIDIA
nvidia-smi >nul 2>&1
if errorlevel 1 (
    echo No se detecto GPU NVIDIA. Iniciando sin servicios de IA...
    echo.
    docker-compose -f docker-compose.no-gpu.yml up -d
) else (
    echo GPU NVIDIA detectada. Iniciando con servicios de IA...
    echo.
    docker-compose up -d
)

echo.
echo ========================================
echo   Esperando a que los servicios inicien...
echo ========================================
timeout /t 30 /nobreak >nul

echo.
echo ========================================
echo   CineStream esta listo!
echo ========================================
echo.
echo   Frontend: http://localhost:3001
echo   Backend API: http://localhost:8010
echo   API Docs: http://localhost:8010/docs
echo.
echo   Para ver logs: docker-compose logs -f
echo   Para detener: docker-compose down
echo.

REM Abrir navegador
start http://localhost:3001

pause
