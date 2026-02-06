# Миграции БД

## Автоматическое применение

**Миграции выполняются при каждом старте backend** — ничего запускать вручную не нужно.

При деплое (`docker compose up -d --build`) backend перезапускается и:
1. Применяет встроенные изменения (CREATE TABLE IF NOT EXISTS, ALTER TABLE ADD COLUMN IF NOT EXISTS)
2. Выполняет новые `.sql` файлы из папки `migrations/`
3. Данные не удаляются — только добавляются таблицы и колонки

## Добавление новой миграции

1. Создай файл `NNN_описание.sql` (например `002_add_points.sql`)
2. Имена сортируются по алфавиту — каждая миграция выполняется один раз
3. Используй только **безопасные** команды:
   - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — добавить колонку
   - `CREATE TABLE IF NOT EXISTS` — создать таблицу
   - `CREATE INDEX IF NOT EXISTS` — создать индекс
   - **Избегай** `DROP`, `TRUNCATE`, `DELETE` без условия

## Пример

```sql
-- 002_add_new_column.sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
```

## Отслеживание

Применённые миграции записываются в таблицу `schema_migrations`.
Повторно не выполняются.
