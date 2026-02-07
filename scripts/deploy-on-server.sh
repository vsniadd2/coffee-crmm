#!/bin/bash
# Обновление приложения на сервере после git push
# Запускать на сервере из корня проекта: bash scripts/deploy-on-server.sh
#
# БД не зависит от UID: данные хранятся в каталоге из POSTGRES_DATA_PATH
# (по умолчанию на сервере — /var/lib/coffee-crm/postgres_data).
# Один раз создайте каталог и права (см. ниже). После смены пользователя/UID
# пересобирать контейнер БД не нужно — данные в том же каталоге.
# Миграции применяются автоматически при старте backend.

set -e
echo "→ 1. Обновление кода из Git..."
git pull origin main 2>/dev/null || git pull

echo "→ 2. Пересборка и перезапуск контейнеров (образ postgres не пересобирается)..."
echo "   (БД сохраняется, миграции применятся при старте backend)"
docker compose up -d --build

echo "→ 3. Готово. Статус:"
docker compose ps

echo ""
echo "Миграции БД применяются при каждом старте backend. Проверить логи: docker compose logs backend"
echo ""
echo "Первый запуск на сервере: задайте путь данных БД (не зависит от UID):"
echo "  echo 'POSTGRES_DATA_PATH=/var/lib/coffee-crm/postgres_data' >> .env"
echo "  sudo mkdir -p /var/lib/coffee-crm/postgres_data && sudo chown 999:999 /var/lib/coffee-crm/postgres_data"
