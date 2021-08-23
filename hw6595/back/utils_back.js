const fs = require('fs');
const os = require('os');
const nodemailer = require("nodemailer");

const { nodemailerConfig } = require("./creds/nodemailer_config");

const { removeTags } = require("./utils");

// синхронная версия
function logLineSync(logFilePath, logLine) {
  const logDT = new Date();
  let time = logDT.toLocaleDateString()+" "+logDT.toLocaleTimeString();
  let fullLogLine = time + " " + logLine;

  console.log(fullLogLine); // выводим сообщение в консоль

  const logFd = fs.openSync(logFilePath, 'a+'); // и это же сообщение добавляем в лог-файл
  fs.writeSync(logFd, fullLogLine + os.EOL); // os.EOL - это символ конца строки, он разный для разных ОС
  fs.closeSync(logFd);
}

// асинхронная версия
function logLineAsync(logFilePath, logLine) {

  return new Promise( (resolve, reject) => {

      const logDT = new Date();
      let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
      let fullLogLine = time + " " + logLine;

      console.log(fullLogLine); // выводим сообщение в консоль

      fs.open(logFilePath, 'a+', (err,logFd) => {
          if ( err )
              reject(err);
          else
              fs.write(logFd, fullLogLine + os.EOL, (err) => {
                  if ( err )
                      reject(err);
                  else
                      fs.close(logFd, (err) =>{
                          if ( err )
                              reject(err);
                          else
                              resolve();
                      });
              });
      });
  } );
}

// отправка письма
function sendEmail(recipientEmail, subject, body) {
    return new Promise( (resolve, reject) => {
        let transporter = nodemailer.createTransport(nodemailerConfig);

        let text = body;
        let html = undefined;
        let textWOTags = removeTags(text);
        if ( textWOTags !== text ) { // если теги есть - отправляем две разных версии письма, HTML и текстовую; если тегов нет - только текстовую
            text = textWOTags;
            html = body;
        }

        let message = {
            from: '"Files Storage" <adamsmithnode@yandex.ru>', // с какого ящика идёт отправка (емейл отправителя), может не совпадать с mailer_transportConfig.auth
            to: recipientEmail,
            subject: subject,
            text: text, // текстовая версия письма
            html: html, // HTML-версия письма
        };

        transporter.sendMail(message, (error, info) => {
            if (error) reject(error);
            else resolve(info);
        });
    });
}

module.exports = {
  logLineSync,
  logLineAsync,
  sendEmail,
};