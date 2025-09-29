@echo off
echo Iniciando Frontend...
cd /d "C:\Users\Gilbe\Documents\Github\frete-urbano\frontend"

echo Verificando dependências...
if not exist "node_modules" (
    echo Instalando dependências...
    npm install
)

echo Iniciando servidor de desenvolvimento...
echo.
echo =====================================
echo   Frontend rodando em:
echo   http://localhost:5173
echo =====================================
echo.
echo IMPORTANTE: Certifique-se de que o backend está rodando em http://localhost:3000
echo Para iniciar o backend, execute: start-backend.bat
echo.

npm run dev