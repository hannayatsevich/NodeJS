const express = require('express');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const busboy = require('connect-busboy'); // для отслеживания прогресса приёма файла (вариант №2)
const WebSocket = require('ws');

const { logLineAsync } = require('./utils');


const logFilePath = path.resolve(__dirname, 'log', '_server.log');
const uploadedFilesDir = path.resolve(__dirname, 'uploadedFiles');
// const uploadedTempFilesDir = path.resolve(__dirname, 'uploadedTempFiles');
const uploadedFilesInfoJSON = path.resolve(__dirname, 'uploadedFilesInfoJSON.json');

let nextUserId = 1;

let wsClients = [];
let timer = 0;

const port = 5695;
const portWS = 5696;

const webserver = express();
const socketserver = new WebSocket.Server({ port: portWS }); // создаём сокет-сервер на порту 5632


webserver.use(express.urlencoded({ extended: true }));// todo???
webserver.use(express.json());

webserver.use( (req, res, next) => {
  logLineAsync(logFilePath, `${port}:${req.originalUrl} request`);
  next();
});

webserver.use('/files-storage', express.static(path.resolve(__dirname, '..', 'front', 'public', 'index.html')));
webserver.use('/bundle.min.js', express.static(path.resolve(__dirname, '..', 'front', 'public', 'bundle.min.js')));
webserver.use('/bundle.css', express.static(path.resolve(__dirname, '..', 'front', 'public', 'bundle.css')));

webserver.use('/download-file/:filename', async (req, res, next) => {
  // будем часть "сырого" УРЛа (req.originalUrl) использовать как имя файла в файловой системе
  // в УРЛе пробелы, русские буквы и другие символы url-кодируются (из " " получается "%20", из "п" - "%D0%BF")
  // а в именах файлов в файловой системе такое кодирование не применяется
  // в браузере декодирование из УРЛ-формата в обычную строку делается вызовом urldecode
  // под Node.js - вызовом querystring.unescape
  // в req.params (данные из частей УРЛа), req.query (get-данные), req.body (post-данные) это декодирование уже сделано
  // const removePartNum = '/download-file/'.length;
  // const originalUrlDecoded = querystring.unescape(req.originalUrl);
  // const fileName = originalUrlDecoded.substring(removePartNum);

  const fileName = req.params.filename;
  const filePath = path.resolve(uploadedFilesDir, fileName);
  let fileInfo;
  // найдем инфо о файле в json с информацией обо всех файлах
  try {
    logLineAsync(logFilePath, `Start reading file ${uploadedFilesInfoJSON}`);
    let filesData = await fsPromises.readFile(uploadedFilesInfoJSON, 'utf8');
    logLineAsync(logFilePath, `End reading file ${uploadedFilesInfoJSON}`);
    if (filesData) {
      let filesInfo = JSON.parse(filesData);
      fileInfo = filesInfo.find(file => file.storedFileName === fileName);
    }
  }
  catch (error) {
    if(error.code === 'ENOENT') {
      logLineAsync(logFilePath, `File ${uploadedFilesInfoJSON} doesn't exist`);
    }
    else {
      logLineAsync(logFilePath, `Error occured reading ${uploadedFilesDir}`);
      logLineAsync(logFilePath, JSON.stringify(error));
    }
  }
  // если файл существует, отправим его для скачивания с названием, с которым он был загружен
  if( fileName && fs.existsSync(filePath) ) {
    logLineAsync(logFilePath, `${filePath} sending file`);
    res.setHeader("Content-Disposition","attachment");
    res.download(filePath, fileInfo ? fileInfo.originalFileName : fileName);
  }
  // если файл не существует  - завершим
  else {
    res.end();
  };
});

webserver.get('/get-files', async (req, res) => {
  let filesInfo = []

  try {
    logLineAsync(logFilePath, `Start reading file ${uploadedFilesInfoJSON}`);
    let filesData = await fsPromises.readFile(uploadedFilesInfoJSON, 'utf8');
    logLineAsync(logFilePath, `End reading file ${uploadedFilesInfoJSON}`);
    if (filesData) {
        filesInfo = JSON.parse(filesData);
    }
    res.status(200).send({
      errorCode: 0,
      errorMessage: '',
      data: filesInfo,
    });
  }
  catch (error) {
    if(error.code === 'ENOENT') {
      logLineAsync(logFilePath, `File ${uploadedFilesInfoJSON} doesn't exist`);
      res.status(200).send({
        errorCode: 0,
        errorMessage: '',
        data: filesInfo,
      });
    }
    else {
      logLineAsync(logFilePath, `Error occured reading ${uploadedFilesDir}`);
      logLineAsync(logFilePath, JSON.stringify(error));
      res.status(500).send({
        errorCode: 1,
        errorMessage: 'Server error reading files directory',
      });
    }
  }
});

// fileSize: 52428800 = 50mb
// fileSize: 104857600 = 100mb
let maxFileSize = 52428800;

function getRandomFileName(targetPath) {
  return Math.random().toString(36).substring(2, 15);
}

// see ex 3550 (+multer, +progress-stream)
webserver.post('/upload-file', busboy({limits: {fileSize: maxFileSize}}), async (req, res) => {
  try {
    const totalRequestLength = +req.headers["content-length"]; // общая длина запроса

    if(totalRequestLength > maxFileSize) {
      res.status(200).send({
        errorCode: 2,
        errorMessage: 'Max file length exсeeded'
      });
    }
    else {
      let totalDownloaded = 0; // сколько байт уже получено

      let reqFields = {}; // информация обо всех полях запроса, кроме файлов
      let reqFiles = {}; // информация обо всех файлах

      req.pipe(req.busboy); // перенаправляем поток приёма ответа в busboy

      req.busboy.on('field', (fieldname, value, fieldnameTruncated, valueTruncated, transferEncoding, mimeType) => { // это событие возникает, когда в запросе обнаруживается "простое" поле, не файл
        reqFields[fieldname] = value;
      });

      req.busboy.on('file', (fieldname, file, filename, transferEncoding, mimetype) => {  // это событие возникает, когда в запросе обнаруживается файл
        let clientWSConnection;
        let fileNameParts = filename.split('.');
        fileNameParts[0] = getRandomFileName();
        const storedFileName = fileNameParts.join('.');
        const storedPathName = path.resolve(uploadedFilesDir, storedFileName);

        if(!fs.existsSync(uploadedFilesDir)) {
          fs.mkdirSync(uploadedFilesDir, (err) => {
            if (err) throw err;
          });
        }

        reqFiles[fieldname] = {
          originalFileName: filename,
          storedFileName: storedFileName,
          uploadDate: (new Date()).getTime(),
          comment: (reqFields.comment || reqFields.comment === '') ? reqFields.comment : null, //может еще не прийти на этот момент
        };

        logLineAsync(logFilePath, `Uploading of ${filename} started`);

        const fstream = fs.createWriteStream(storedPathName);
        file.pipe(fstream);

        file.on('data', (data) => {
          totalDownloaded += data.length;
          // todo может ли id еще не дойти?
          clientWSConnection = wsClients.find( item => item.id == reqFields.clientId);
          if(clientWSConnection) {
            clientWSConnection.connection.send(`percent:${Math.floor(totalDownloaded / totalRequestLength * 100)}`)
          }
          if(reqFiles[fieldname].comment === null)
            reqFiles[fieldname].comment = (reqFields.comment || reqFields.comment === '') ? reqFields.comment : null;
          logLineAsync(logFilePath, `Loaded ${totalDownloaded} of ${totalRequestLength}`);
        });

        file.on('end', () => {
          clientWSConnection = wsClients.find( item => item.id == reqFields.clientId);
          if(clientWSConnection) {
            clientWSConnection.connection.send(`percent:100`)
          }
          logLineAsync(logFilePath, `File truncated ${file.truncated}`);
          logLineAsync(logFilePath, `File ${fieldname} received`);
        });
      });

      req.busboy.on('finish', async () => {
        await saveFileInfo(uploadedFilesInfoJSON, reqFiles.filedata);
        logLineAsync(logFilePath, `File saved, origin filename:  ${reqFiles.filedata.originalFileName}, store filename: ${reqFiles.filedata.storedFileName}`);
        res.status(200).send({
          errorCode: 0,
        });
      });
    }
  }
  catch (error) {
    logLineAsync(logFilePath, `/upload-file error ${error}`);
    res.send({
      errorCode: 1,
    })
  }
});

const saveFileInfo = async (path, fileInfo) => {
  let filesInfo = [];

  fs.readFile(path, 'utf8',(error, data) => {
    if(error) {
      if(error.code === 'ENOENT') {
        logLineAsync(logFilePath, `File ${path} doesn't exist`);
      }
      else {
        logLineAsync(logFilePath, `Error occured reading file ${path}, error: ${JSON.stringify(error)}`);
      }
    }

    if (data) {
        filesInfo = JSON.parse(data);
    }

    filesInfo.push(fileInfo);
    fs.writeFile(path, JSON.stringify(filesInfo), (error, data) => {
      if(error) {
        logLineAsync(logFilePath, `Error occured writing file ${path}, error: ${JSON.stringify(error)}`);
      }
    });
  });
};

webserver.listen(port, () => {
  logLineAsync(logFilePath, `listen port ${port}`);
});

socketserver.on('connection', connection => { // connection - это сокет-соединение сервера с клиентом
  logLineAsync(logFilePath, `listen portWS ${portWS}`);

  let userId = nextUserId;
  nextUserId++;
  connection.send(`id:${userId}`); // это сообщение будет отослано сервером каждому присоединившемуся клиенту

  connection.on('message', message => {
    logLineAsync(logFilePath, `сервером получено сообщение от клиента: ${message}`);// это сработает, когда клиент пришлёт какое-либо сообщение
    if ( message==="KEEP_ME_ALIVE" ) {
      wsClients.forEach( client => {
        if ( client.connection === connection )
          client.lastkeepalive = Date.now();
      } );
    }
  });

  wsClients.push( {connection: connection, lastkeepalive: Date.now(), id: userId} );
});

setInterval(()=>{
  timer++;
  wsClients.forEach( client => {
    if ( (Date.now()-client.lastkeepalive) > 12000 ) {
      client.connection.terminate(); // если клиент уже давно не отчитывался что жив - закрываем соединение
      client.connection=null;
      logLineAsync(logFilePath, `${portWS} один из клиентов отключился, закрываем соединение с ним`);
    }
  } );

  wsClients = wsClients.filter( client => client.connection ); // оставляем в clients только живые соединения
},3000);

logLineAsync(logFilePath, `socket server running on port ${portWS}`);