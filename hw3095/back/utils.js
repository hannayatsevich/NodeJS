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

module.exports = {
  logLineSync,
};