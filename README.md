# Инструкция по установке 
При разработке использовалась платформа Node.js версии 20.16.0, а также такие пакеты как: **path, express, fs, express-fileupload, crypto, xml2js, mariadb, child_process.**
Для внесения платежей в биллинговую систему UTM5 использовался модуль utm5_payment_tool, находящийся по пути **/netup/utm5/bin/utm5_payment_tool**.

Для установки программного обеспечения, необходимо скачать **Node.js**(чтобы проверить установку, откройте терминал и введите команду **node -v**. Вы должны увидеть версию Node.js), установить соответствующие пакеты описанные выше через **менеджер пакетов Npm**.

**!!!В файле main.js в 10,11,12,13,14 строчках надо прописать данные host, port, user, password, database вместо звездочек, для подключение к базе данных!!!** 

## Как запустить ПО в фоновом режиме
1. Установите менеджер процессов pm2
  1. На сервере введите комманду sudo npm install --global pm2
  2. Проверте установку pm2: pm2 --version
2. Зайдите в папку с ПО  и введите команду pm2 start main.js
3. Чтобы увидеть список процессов введите команду pm2 list
4. Чтобы завершить работу ПО введите команду pm2 delete <номер Id процесса>

# Инструкция по внесению платежей
1. Прежде чем внести платеж, необходимо ввести свои данные от utm5, если данные будут не верны, платежи не пройдут.
2. Загрузите файл на сайт и выберете метод платежа.
3. При необходимости укажите комментарий к платежу.
4. Нажмите кнопку **Отправить**, если все платежи пройдут, то высветится соответствующее сообщение. Если один/несколько платежей не пройдут, то высветится номер платежа. 
