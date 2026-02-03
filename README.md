# Coffee Life Roasters CRM

Система управления клиентами и заказами для кофейни.

## Быстрый старт (локальная разработка)

### Windows
```powershell
.\start-all.ps1
```

### Linux/Mac
```bash
docker-compose up -d postgres
cd backend && npm install && npm start &
cd frontend && npm install && npm run dev
```

## Деплой на сервере

После обновления кода в Git, на сервере нужно выполнить:

### Windows Server
```powershell
.\deploy.ps1
```

### Linux Server
```bash
chmod +x deploy.sh
./deploy.sh
```

Скрипт деплоя автоматически:
1. Обновит код из Git (`git pull`)
2. Пересоберёт Docker образы (`docker-compose build`)
3. Перезапустит контейнеры (`docker-compose down && docker-compose up -d`)

**Важно:** После каждого обновления кода на сервере обязательно запускайте скрипт деплоя, иначе изменения не применятся!

## Структура проекта

- `backend/` - Node.js/Express API сервер
- `frontend/` - React приложение
- `docker-compose.yml` - Конфигурация Docker Compose

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_DB=coffee_crm
POSTGRES_PORT=5432
BACKEND_PORT=3000
FRONTEND_PORT=80
NODE_ENV=production
```

## Проверка статуса

```bash
docker-compose ps
docker-compose logs -f
```
