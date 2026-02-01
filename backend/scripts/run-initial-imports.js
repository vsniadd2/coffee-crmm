/**
 * Запуск всех скриптов импорта при первом запуске.
 * Этот скрипт вызывается автоматически из database.js при инициализации БД,
 * если таблица clients пустая (первый запуск).
 */

const path = require('path');
const { pool } = require('../database');

async function runImportScript(scriptPath, scriptName) {
  try {
    console.log(`📥 Запуск импорта: ${scriptName}...`);
    
    // Запускаем скрипт через child_process, чтобы избежать проблем с process.exit
    const { spawn } = require('child_process');
    const projectRoot = path.join(__dirname, '..', '..');
    const nodeProcess = spawn('node', [scriptPath], {
      stdio: 'pipe',
      cwd: projectRoot,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' }
    });

    // Логируем вывод скрипта
    nodeProcess.stdout.on('data', (data) => {
      console.log(`[${scriptName}] ${data.toString().trim()}`);
    });

    nodeProcess.stderr.on('data', (data) => {
      console.error(`[${scriptName}] ${data.toString().trim()}`);
    });

    return new Promise((resolve) => {
      nodeProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Импорт ${scriptName} завершен успешно`);
        } else {
          console.log(`⚠️ Импорт ${scriptName} завершился с кодом ${code} (это может быть нормально, если файлы отсутствуют)`);
        }
        // Всегда резолвим, не прерываем процесс сервера
        resolve();
      });

      nodeProcess.on('error', (error) => {
        console.error(`❌ Ошибка при запуске ${scriptName}:`, error.message);
        // Не прерываем процесс
        resolve();
      });
    });
  } catch (error) {
    console.error(`❌ Ошибка импорта ${scriptName}:`, error.message);
    // Не прерываем процесс, просто логируем
  }
}

async function runInitialImports() {
  try {
    // Проверяем, есть ли уже клиенты в БД
    const result = await pool.query('SELECT COUNT(*) as count FROM clients');
    const clientCount = parseInt(result.rows[0].count);

    if (clientCount > 0) {
      console.log('ℹ️ В БД уже есть клиенты, пропускаем импорт начальных данных');
      return;
    }

    console.log('🔄 Первый запуск: начинаем импорт начальных данных...');

    const scriptsDir = __dirname;
    const projectRoot = path.join(__dirname, '..', '..');

    // Пути к скриптам
    const goldScript = path.join(scriptsDir, 'import-gold-from-excel.js');
    const silverScript = path.join(scriptsDir, 'import-silver-from-excel.js');
    const csvScript = path.join(scriptsDir, 'import-csv-from-excel.js');

    // Запускаем импорты последовательно
    await runImportScript(csvScript, 'CSV клиенты');
    await runImportScript(silverScript, 'Silver клиенты');
    await runImportScript(goldScript, 'Gold клиенты');

    console.log('✅ Импорт начальных данных завершен');
  } catch (error) {
    console.error('❌ Ошибка при импорте начальных данных:', error.message);
    // Не прерываем запуск сервера, просто логируем ошибку
  }
}

module.exports = { runInitialImports };

