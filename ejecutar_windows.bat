@echo off
setlocal
title Iniciando Olli Local
echo ===================================================
echo     Olli - Asistente local para clases
echo ===================================================
echo  Preparando Olli en este equipo...
echo.

:: Ir siempre a la carpeta donde vive este archivo.
cd /d "%~dp0"

:: Node.js y npm solo se instalan una vez en el equipo.
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] No se encontro Node.js.
    echo.
    echo Instala Node.js 20 LTS o 22 LTS desde https://nodejs.org/
    echo Luego vuelve a hacer doble clic en este archivo.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm no esta disponible junto a Node.js.
    echo Reinstala Node.js desde https://nodejs.org/ y vuelve a intentarlo.
    echo.
    pause
    exit /b 1
)

:: La primera vez descarga dependencias. No contiene datos de la usuaria.
if not exist "node_modules\" (
    echo [1/2] Instalando componentes de Olli. Esto puede tardar unos minutos...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] No se pudieron instalar los componentes.
        echo Verifica tu conexion a Internet y vuelve a intentarlo.
        pause
        exit /b 1
    )
)

echo [2/2] Iniciando Olli localmente...
echo.
echo Se abrira http://127.0.0.1:3000 en tu navegador.
echo Mantiene esta ventana abierta mientras uses Olli.
echo Para cerrar Olli, presiona Ctrl+C en esta ventana.
echo.

:: Esperar unos segundos antes de abrir el navegador para que el servidor responda.
start "Olli Browser" /b cmd /c "timeout /t 4 /nobreak ^>nul ^& start http://127.0.0.1:3000"
call npm run dev

endlocal
