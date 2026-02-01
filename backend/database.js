const { Pool } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'coffee_crm',
};

const pool = new Pool(dbConfig);

// Устанавливаем часовой пояс для всех подключений
pool.on('connect', async (client) => {
  await client.query('SET timezone = \'Europe/Moscow\'');
});

// Инициализация базы данных
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // Создание таблицы пользователей (админов)
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы клиентов
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        client_id VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'standart',
        total_spent DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы транзакций (client_id может быть NULL для анонимных заказов)
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        amount DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(5, 2) DEFAULT 0,
        final_amount DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Миграция: разрешаем NULL для client_id (анонимные заказы)
    try {
      await client.query(`
        ALTER TABLE transactions 
        ALTER COLUMN client_id DROP NOT NULL
      `);
      console.log('✅ Миграция transactions: client_id допускает NULL');
    } catch (error) {
      if (!error.message.includes('column "client_id" is already nullable') && !error.message.includes('does not exist')) {
        console.log('ℹ️ Миграция client_id:', error.message);
      }
    }

    // Миграция: тип операции (продажа / возврат / замена)
    try {
      await client.query(`
        ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS operation_type VARCHAR(20) DEFAULT 'sale'
      `);
      console.log('✅ Миграция transactions: operation_type добавлен');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('ℹ️ Миграция operation_type:', error.message);
      }
    }

    // Миграция: ссылка на возвращённый заказ (для заказа-замены)
    try {
      await client.query(`
        ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS replacement_of_transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL
      `);
      console.log('✅ Миграция transactions: replacement_of_transaction_id добавлен');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('ℹ️ Миграция replacement_of_transaction_id:', error.message);
      }
    }

    // Создание таблицы товаров в транзакциях
    await client.query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
        product_id VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы категорий товаров
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50) NOT NULL,
        icon VARCHAR(255),
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы подкатегорий товаров
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_subcategories (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES product_categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы товаров
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        subcategory_id INTEGER REFERENCES product_subcategories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        image_data TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Миграция: переименовываем image_url в image_data и изменяем тип на TEXT
    try {
      // Проверяем, существует ли старая колонка image_url
      const oldColumnInfo = await client.query(`
        SELECT column_name, data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'image_url'
      `);
      
      // Проверяем, существует ли новая колонка image_data
      const newColumnInfo = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'image_data'
      `);
      
      if (oldColumnInfo.rows.length > 0 && newColumnInfo.rows.length === 0) {
        // Старая колонка существует, новой нет - переименовываем
        const currentType = oldColumnInfo.rows[0].data_type;
        const maxLength = oldColumnInfo.rows[0].character_maximum_length;
        
        // Сначала изменяем тип на TEXT, если нужно
        if (currentType === 'character varying' && maxLength !== null) {
          await client.query(`
            ALTER TABLE products 
            ALTER COLUMN image_url TYPE TEXT USING image_url::TEXT
          `);
        }
        
        // Затем переименовываем колонку
        await client.query(`
          ALTER TABLE products 
          RENAME COLUMN image_url TO image_data
        `);
        console.log('✅ Миграция: переименовано image_url → image_data');
      } else if (oldColumnInfo.rows.length > 0 && newColumnInfo.rows.length > 0) {
        // Обе колонки существуют - копируем данные и удаляем старую
        await client.query(`
          UPDATE products 
          SET image_data = image_url 
          WHERE image_data IS NULL AND image_url IS NOT NULL
        `);
        await client.query(`
          ALTER TABLE products 
          DROP COLUMN image_url
        `);
        console.log('✅ Миграция: данные скопированы из image_url в image_data, старая колонка удалена');
      } else if (newColumnInfo.rows.length > 0) {
        console.log('ℹ️ Миграция не требуется: колонка image_data уже существует');
      }
    } catch (error) {
      // Игнорируем ошибку, если таблица еще не создана или колонка не существует
      if (!error.message.includes('does not exist') && !error.message.includes('column') && !error.message.includes('relation')) {
        console.error('⚠️ Ошибка при миграции image_url → image_data:', error.message);
      }
    }

    // Создание таблицы тикетов на удаление истории покупок
    await client.query(`
      CREATE TABLE IF NOT EXISTS deletion_tickets (
        id SERIAL PRIMARY KEY,
        status VARCHAR(50) DEFAULT 'pending',
        scheduled_deletion_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cancelled_at TIMESTAMP,
        executed_at TIMESTAMP
      )
    `);

    // Создание индексов для оптимизации поиска
    // Индекс для поиска клиентов по имени/фамилии/отчеству
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_first_name ON clients(first_name);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_last_name ON clients(last_name);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_middle_name ON clients(middle_name);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_client_id ON clients(client_id);
    `);
    // Составной индекс для поиска по имени и фамилии
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_name_search ON clients(first_name, last_name);
    `);
    // Индекс для сортировки по дате создания
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
    `);
    // Индекс для статуса клиента
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
    `);
    
    // Индексы для транзакций
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
    `);
    // Составной индекс для JOIN запросов
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_client_created ON transactions(client_id, created_at DESC);
    `);
    
    // Индекс для товаров в транзакциях
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
    `);

    // Индекс для поиска товаров по названию
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    `);

    // Индексы для тикетов на удаление
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_deletion_tickets_status ON deletion_tickets(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_deletion_tickets_scheduled_at ON deletion_tickets(scheduled_deletion_at);
    `);

    // Миграция: колонка role в admins (user / admin)
    try {
      await client.query(`
        ALTER TABLE admins
        ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'
      `);
      console.log('✅ Миграция admins: колонка role');
    } catch (e) {
      if (!e.message?.includes('already exists')) console.log('ℹ️ Миграция role:', e.message);
    }

    // Миграция: client_id может быть NULL (ID не задан — в интерфейсе показываем прочерк)
    try {
      await client.query(`
        ALTER TABLE clients
        ALTER COLUMN client_id DROP NOT NULL
      `);
      console.log('✅ Миграция clients: client_id допускает NULL');
    } catch (e) {
      if (!e.message?.includes('does not exist') && !e.message?.includes('already nullable')) {
        console.log('ℹ️ Миграция client_id:', e.message);
      }
    }

    // В БД хранится только то, что добавлено вручную или скриптами. При перезапуске
    // выполняются только CREATE TABLE и ALTER TABLE (миграции), без INSERT/UPDATE/DELETE.

    console.log('✅ База данных успешно инициализирована');
    
    // Проверяем, нужно ли запустить импорт начальных данных (только при первом запуске)
    try {
      const countResult = await client.query('SELECT COUNT(*) as count FROM clients');
      const clientCount = parseInt(countResult.rows[0].count);
      
      if (clientCount === 0) {
        console.log('🔄 Первый запуск: запуск импорта начальных данных...');
        // Запускаем импорт асинхронно, не блокируя запуск сервера
        const { runInitialImports } = require('./scripts/run-initial-imports');
        runInitialImports().catch(err => {
          console.error('❌ Ошибка при импорте начальных данных:', err.message);
        });
      }
    } catch (importCheckError) {
      // Игнорируем ошибки проверки - не критично
      console.log('ℹ️ Не удалось проверить необходимость импорта:', importCheckError.message);
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };
