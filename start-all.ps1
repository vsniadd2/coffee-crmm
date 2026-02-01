# Coffee Life Roasters CRM - Полный запуск
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Coffee Life Roasters CRM - Запуск" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Проверка Docker
Write-Host "[1/5] Проверка Docker..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Docker не запущен или недоступен" -ForegroundColor Red
        Write-Host "   Убедитесь что Docker Desktop запущен" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "✅ Docker работает" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Docker не найден" -ForegroundColor Red
}

# Запуск PostgreSQL
Write-Host ""
Write-Host "[2/5] Запуск PostgreSQL..." -ForegroundColor Yellow
docker-compose up postgres -d
Start-Sleep -Seconds 3
Write-Host "✅ PostgreSQL запущен" -ForegroundColor Green

# Проверка зависимостей backend
Write-Host ""
Write-Host "[3/5] Проверка зависимостей backend..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
$nodeModulesPath = Join-Path $backendPath "node_modules"

if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "   Установка зависимостей..." -ForegroundColor Yellow
    Set-Location $backendPath
    npm install
    Set-Location $PSScriptRoot
    Write-Host "✅ Зависимости установлены" -ForegroundColor Green
} else {
    Write-Host "✅ Зависимости уже установлены" -ForegroundColor Green
}

# Запуск Backend
Write-Host ""
Write-Host "[4/5] Запуск Backend сервера..." -ForegroundColor Yellow
Write-Host "   Backend будет запущен в отдельном окне" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start"

Start-Sleep -Seconds 2
Write-Host "✅ Backend запущен на http://localhost:3001" -ForegroundColor Green

# Проверка зависимостей frontend
Write-Host ""
Write-Host "[5/6] Проверка зависимостей frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
$frontendNodeModulesPath = Join-Path $frontendPath "node_modules"

if (-not (Test-Path $frontendNodeModulesPath)) {
    Write-Host "   Установка зависимостей..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm install
    Set-Location $PSScriptRoot
    Write-Host "✅ Зависимости установлены" -ForegroundColor Green
} else {
    Write-Host "✅ Зависимости уже установлены" -ForegroundColor Green
}

# Запуск Frontend
Write-Host ""
Write-Host "[6/6] Запуск Frontend..." -ForegroundColor Yellow
Write-Host "   Frontend будет запущен в отдельном окне" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Start-Sleep -Seconds 2
Write-Host "✅ Frontend запущен на http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Система запущена!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Информация:" -ForegroundColor Yellow
Write-Host "   Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Данные для входа:" -ForegroundColor Yellow
Write-Host "   Логин: test" -ForegroundColor White
Write-Host "   Пароль: test" -ForegroundColor White
Write-Host ""
Write-Host "⏹️  Для остановки:" -ForegroundColor Yellow
Write-Host "   Закройте окна Backend и Frontend (Ctrl+C)" -ForegroundColor White
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "Нажмите любую клавишу для выхода..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
