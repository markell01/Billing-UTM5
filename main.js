const path = require('path');
const express = require('express');
const fs = require('fs');
const fileUplouder = require('express-fileupload');
const crypto = require('crypto');
const xml2js = require('xml2js');
const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: '10.2.1.43',
  port: 3306,
  user: 'root',
  password: '1qa0ok',
  database: 'UTM5intercom'
});

const app = express();

// Очередь для платежей
let paymentQueue = [];

app.use(express.static('public'));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use(fileUplouder());

app.get('', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Функция для обработки платежей из очереди
async function processPayments() {
  let failedPayments = [];
  
  while (paymentQueue.length > 0) {
    const payment = paymentQueue.shift(); // Извлекаем первый платеж из очереди
    
    try {
      const output = await processPayment(payment);
      console.log(`Платеж ${payment.uid} обработан успешно: ${output}`);
    } catch (err) {
      console.error(`Ошибка при обработке платежа ${payment.uid}:`, err);
      failedPayments.push(payment);
    }
  }
  
  return failedPayments;
}

// Функция для обработки одного платежа
function processPayment(payment) {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const ls = spawn('/netup/utm5/bin/utm5_payment_tool', [
      '-h', '10.2.1.43',
      '-l', payment.login,
      '-p', payment.pass,
      '-a', payment.uid,
      '-b', payment.sum,
      '-c', '810',
      '-m', payment.method,
      '-L', payment.comment,
      '-k',
      '-e', 'EXT123456',
      '-t', '$(date +%s)',
      '-i'
    ]);

    let output = '';

    ls.stdout.on('data', (data) => {
      output += data.toString();
    });

    ls.stderr.on('data', (data) => {
      console.error(`Ошибка: ${data.toString()}`);
    });

    ls.on('close', (code) => {
      if (code !== 0) {
        return reject(`Процесс завершился с кодом ${code}`);
      }
      resolve(output);
    });
  });
}

app.post('/upload', async (req, res) => {
  const login = req.body.loginName.toString();
  const pass = req.body.passName.toString();
  
  try {
    const request = await pool.query(`SELECT id FROM system_accounts WHERE login = ? AND password = ?`, [login, pass]);
    
    if (request.length <= 0) {
      console.log('ERROR LOGIN');
      return res.send('Неверный логин!');
    }
    
    const sumenter = req.body.enterSum.toString();
    const comment = req.body.comments.toString();
    const paymentMethod = req.body.method.toString();

    if (!req.files) {
      return res.send('Файл не найден!');
    }

    const xmlFile = req.files.file;
    const string = new TextDecoder().decode(xmlFile.data);
    const new_result = string.split('#');
    const send_data = new_result.join('');

    if (send_data.length <= 0) {
      return res.send('Файл пуст!');
    }

    xml2js.parseString(send_data, (err, result) => {
      if (err) {
        console.error('Ошибка парсинга!', err);
        return res.send('Ошибка парсинга!');
      }

      // Добавляем платежи в очередь
      result['UTM_export']['row'].forEach(element => {
        const uids = element["col_uid"][0];
        paymentQueue.push({
          uid: uids,
          sum: sumenter,
          comment: comment,
          method: paymentMethod,
          login: login,
          pass: pass
        });
      });

      // Запускаем обработку платежей
      processPayments().then(failedPayments => {
        if (failedPayments.length > 0) {
          // Формируем строку с неуспешными платежами
          const failedPaymentsString = failedPayments.map(payment => `Платеж ${payment.uid}`).join(', ');
          res.send(`Не удалось обработать следующие платежи: ${failedPaymentsString}`);
        } else {
          res.send('Все платежи успешно обработаны.');
        }
      });
    });
  } catch (err) {
    console.error('Ошибка базы данных!', err);
    res.send('Ошибка базы данных!');
  }
});

app.listen(3000, () => {
  console.log("Сервер запущен на порту 3000");
});