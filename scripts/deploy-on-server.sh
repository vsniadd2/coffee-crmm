#!/bin/bash
# Обновление приложения на сервере после git push
# Запускать на сервере из корня проекта: bash scripts/deploy-on-server.sh
#
# БД НЕ удаляется: данные PostgreSQL хранятся в именованном томе postgres_data.
# Миграции применяются автоматически при старте backend (новые .sql из migrations/).
# Не используйте «docker compose down -v» — флаг -v удалит тома и данные БД.

set -e
echo "→ 1. Обновление кода из Git..."
git pull origin main 2>/dev/null || git pull

echo "→ 2. Пересборка и перезапуск контейнеров..."
echo "   (БД сохраняется, миграции применятся при старте backend)"
docker compose up -d --build

echo "→ 3. Готово. Статус:"
docker compose ps

echo ""
echo "Миграции БД применяются при каждом старте backend. Проверить логи: docker compose logs backend"
