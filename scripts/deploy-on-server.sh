#!/bin/bash
# Обновление приложения на сервере после git push
# Запускать на сервере из корня проекта: bash scripts/deploy-on-server.sh
#
# БД НЕ удаляется: данные PostgreSQL хранятся в именованном томе postgres_data.
# Мы только пересобираем образы backend/frontend и перезапускаем контейнеры.
# Не запускайте «docker compose down -v» — флаг -v удаляет тома и данные БД.

set -e
echo "→ git pull..."
git pull

echo "→ Пересборка и перезапуск контейнеров (том postgres_data не трогаем, БД сохраняется)..."
docker compose up -d --build

echo "→ Готово. Проверка контейнеров:"
docker compose ps
