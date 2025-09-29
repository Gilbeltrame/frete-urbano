@echo off
echo Iniciando Backend ANTT...
cd /d "C:\Users\Gilbe\Documents\Github\frete-urbano\backend"

echo Verificando se Node.js está instalado...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js não encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

echo Verificando dependências...
if not exist "node_modules" (
    echo Instalando dependências...
    npm install
)

echo Iniciando servidor na porta 3000...
echo.
echo =====================================
echo   API ANTT rodando em:
echo   http://localhost:3000
echo =====================================
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.

node server.mjs