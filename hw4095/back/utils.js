const fs = require('fs');
const os = require('os');

// синхронная версия
function logLineSync(logFilePath, logLine) {
  const logDT = new Date();
  let time = logDT.toLocaleDateString()+" "+logDT.toLocaleTimeString();
  let fullLogLine = time + " " + logLine;

  console.log(fullLogLine); // выводим сообщение в консоль

  const logFd = fs.openSync(logFilePath, 'a+'); // и это же сообщение добавляем в лог-файл
  fs.writeSync(logFd, fullLogLine + os.EOL); // os.EOL - это символ конца строки, он разный для разных ОС
  fs.closeSync(logFd);
};

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
};

function validateURL (url) {
    let isUrlValid = /^https?:\/\/[^\.]+\..+$/.test(url);
    return {
        isValid: isUrlValid,
        message: isUrlValid ? '' : 'Url is not valid, should be in form http://smth.smth or https://smth.smth'
    }
};

function validateBody (method, body, headers) {
    let reqBody = body.split('\n').join('').split('\r').join('');
    let isBodyValid = !!( (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') && reqBody && headers.some( item => item.name.toLowerCase() === 'content-type') );
    return {
        isValid: isBodyValid,
        message: isBodyValid ? '' : "Content-type and/or body doesn't set for POST request",
    }
};

module.exports = {
  logLineSync,
  logLineAsync,
  validateURL,
  validateBody,
};