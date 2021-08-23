const express = require('express');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const busboy = require('connect-busboy'); // для отслеживания прогресса приёма файла (вариант №2)
const WebSocket = require('ws');
const mysql = require("mysql");
const md5 = require('md5');

const { logLineAsync, sendEmail } = require('./utils_back');
const {
  newConnectionFactory,
  selectQueryFactory,
  selectQueryRowFactory,
  getModifiedRowsCount,
  modifyQueryFactory
} = require("./utils_db");
const {
  getRandomString,
  getSubmitionUrl,
  getEmailBody,
  emailSubject,
} = require("./utils");
const { sqlConfig } = require("./creds/db_config");

const logFilePath = path.resolve(__dirname, 'log', '_server.log');
const uploadedFilesDir = path.resolve(__dirname, 'uploadedFiles');
const uploadedFilesInfoJSON = path.resolve(__dirname, 'uploadedFilesInfoJSON.json');

let nextUserId = 1;

let wsClients = [];
let timer = 0;

const port = 5697;
const portWS = 5698;

const webserver = express();
const socketserver = new WebSocket.Server({ port: portWS }); // создаём сокет-сервер на порту 5632
let sqlConnectionsPool = mysql.createPool(sqlConfig);

let requestError = {
  errorCode: 1,
  errorMessage: 'Request error',
};

let loginError = {
  errorCode: 2,
  errorMessage: `Login doesn't exist`,
};

let pswError = {
  errorCode: 3,
  errorMessage: `Password is not correct`,
};

let loginExistsError = {
  errorCode: 4,
  errorMessage: `This login exists`,
};

let emailExistsError = {
  errorCode: 5,
  errorMessage: `This email exists`,
};

async function checkAuth (req, res, next) {
  if(req.headers['auth-token-string']) {
    let mysqlconnection = null;
    try {
      mysqlconnection = await newConnectionFactory(sqlConnectionsPool);
      // получим данные сессии, если она началась не ранее 4х часов назад
      // console.log('dateCheckStart', new Date(new Date() - 4*60*60*1000));
      let tokenSessionData = await selectQueryRowFactory(mysqlconnection, `select session_date_start, login from sessions where token=? and session_date_start>?`, [req.headers['auth-token-string'], new Date(new Date() - 4*60*60*1000)]);

      if(tokenSessionData) {
        req.session = {};
        req.session.login = tokenSessionData.login;
        next();
      }
      else {
        res.status(401).end();
      }
    }
    catch (error) {
      // сюда попадут и promise reject
      logLineAsync(logFilePath, `sql connection error: ${error}`);
      res.status(401).end();
    }
    finally {
      if (mysqlconnection)
        mysqlconnection.release();
    }
  }
  else {
    res.status(401).end();
  }
};

webserver.use(express.urlencoded({ extended: true }));// todo???
webserver.use(express.json());

webserver.use( (req, res, next) => {
  logLineAsync(logFilePath, `${port}:${req.originalUrl} request`);
  next();
});

webserver.use('/files-storage', express.static(path.resolve(__dirname, '..', 'front', 'public', 'index.html')));
webserver.use('/bundle.min.js', express.static(path.resolve(__dirname, '..', 'front', 'public', 'bundle.min.js')));
webserver.use('/bundle.css', express.static(path.resolve(__dirname, '..', 'front', 'public', 'bundle.css')));


webserver.get('/get-auth-roles', checkAuth, async (req, res, next) => {

  if(req.session.login) {
    let mysqlconnection = null;
    try {
      mysqlconnection = await newConnectionFactory(sqlConnectionsPool);
      // получим роли пользователя
      let userRoles = await selectQueryFactory(mysqlconnection, `select role_code from users_roles where login=?`, [req.session.login]);
      res.send({
        errorCode: 0,
        data: {
          login: req.session.login,
          userRoles: userRoles ? userRoles.map(item => item.role_code) : [],
        }
      })
    }
    catch (error) {
      // сюда попадут и promise reject
      logLineAsync(logFilePath, `sql connection error: ${error}`);
      res.send(requestError);
    }
    finally {
      if (mysqlconnection)
        mysqlconnection.release();
    }
  }
  else {
    res.send(requestError);
  }

});

webserver.post('/log-in', async (req, res, next) =>{

  if(req.body.login && req.body.psw) {
    let mysqlconnection = null;
    try {
      mysqlconnection = await newConnectionFactory(sqlConnectionsPool);
      let userData = await selectQueryRowFactory(mysqlconnection, `select login, psw_hash from users where login=? and is_active=?`, [req.body.login, 1]);
      console.log('userData', userData)
      if(userData) {
        // todo  добавть хэш проверку
        let pswHash = md5(req.body.psw + 'life is beautiful:)');
        if(userData.psw_hash === pswHash) {

          let userRoles = await selectQueryFactory(mysqlconnection, `select role_code from users_roles where login=?`, [userData.login]);
          let token = getRandomString(32);
          let userSessionData = await modifyQueryFactory(mysqlconnection, `insert into sessions(login,token,session_date_start) values(?,?,now())`, [userData.login, token]);
          console.log('userSessionData', userSessionData)
          if(userSessionData.affectedRows === 1)
            res.send({
              errorCode: 0,
              data: {
                token,
                login: req.body.login,
                userRoles: userRoles ? userRoles.map(item => item.role_code) : [],
              }
            });
          else res.send(requestError);
        }
        else {
          res.send(pswError);
        }
      }
      else {
        res.send(loginError);
      }
    }
    catch (error) {
      // сюда попадут и promise reject
      // logLineAsync(logFilePath, `sql connection error: ${JSON.stringify(error)}`);
      logLineAsync(logFilePath, `sql connection error: ${error}`);
      res.send(requestError);
    }
    finally {
      if (mysqlconnection)
        mysqlconnection.release();
    }
  }
  else {
    res.send(requestError);
  }

});

webserver.post('/sign-up', async (req, res, next) => {
  // todo сделать валидацию данных
  if(req.body.login && req.body.psw && req.body.email) {
    let mysqlconnection = null;
    try {
      mysqlconnection = await newConnectionFactory(sqlConnectionsPool);
      let pswHash = md5(req.body.psw + 'life is beautiful:)');
      let userData = await modifyQueryFactory(mysqlconnection, `insert into users(login,psw_hash,email,is_active) values(?,?,?,?)`, [req.body.login, pswHash, req.body.email, 0]);
      if(userData.affectedRows === 1) {
        let emailInfo;
        try {
          emailInfo = await sendEmail(req.body.email, emailSubject, getEmailBody(req.body.login, getSubmitionUrl(req.body.login)))
          //todo положить в базу отправленное письмо
        }
        catch (error) {
          logLineAsync(logFilePath, `mail send to ${req.body.email} error: ${error}`);
        }

        if(emailInfo){
          await modifyQueryFactory(mysqlconnection, `insert into sentemails(recipient_emal,body,subject) values(?,?,?)`, [req.body.email, emailSubject, getEmailBody(req.body.login, getSubmitionUrl(req.body.login))]);
          res.send({
            errorCode: 0,
          });
        }
        else {
          //надо бы как-то отправить еще раз, если не отправилось
          res.send(requestError);
        }
      }
      else {
        res.send(requestError);
      }
    }
    catch (error) {
      // сюда попадут и promise reject
      logLineAsync(logFilePath, `sql connection error: ${error}`);
      if(error.code === 'ER_DUP_ENTRY' && error.sqlMessage.indexOf('login') > -1) {
        res.send(loginExistsError);
      }
      else if(error.code === 'ER_DUP_ENTRY' && error.sqlMessage.indexOf('email') > -1) {
        res.send(emailExistsError);
      }
      else
        res.send(requestError);
    }
    finally {
      if (mysqlconnection)
        mysqlconnection.release();
    }
  }
  else {
    res.send(requestError);
  }

  if(req.headers['auth-token-string']) {
    try {

      if(tokenSessionData){
        let userRoles = await selectQueryFactory(mysqlconnection, `select role_code from users_roles where login=?`, [tokenSessionData.login]);
        res.send({
          errorCode: 0,
          data: userRoles ? userRoles.map( item => item.role_code) : [],
        });
      }
      else {
        res.status(401).end();
      }
    }
    catch (error) {
      // сюда попадут и promise reject
      logLineAsync(logFilePath, `sql connection error: ${JSON.stringify(error)}`);
      res.send(requestError);
    }
    finally {
      if (mysqlconnection)
        mysqlconnection.release();
    }
  }

});

webserver.get('/submit-registration', async (req, res, next) => {
  if(req.query.login) {
    let mysqlconnection = null;
    try {
      mysqlconnection = await newConnectionFactory(sqlConnectionsPool);
      //сделаем пользователя активным
      let userData = await modifyQueryFactory(mysqlconnection, `update users set is_active=? where login=? and is_active=0;`, [1, req.query.login]);
      if(userData.affectedRows === 1) {
        // добавим пользователю (любому) роль редактора
        await modifyQueryFactory(mysqlconnection, `insert into users_roles(login,role_code) values(?,?)`, [req.query.login, 'redactor']);
        res.redirect('http://188.166.41.101:6195/files-storage');
      }
      else {
        // если пользователя нет или пользователь уже активен
        res.send('<p>Page is not valid, please, try to log in <a href="http://188.166.41.101:6195/files-storage">here</a></p>');
      }
    }
    catch (error) {
      // сюда попадут и promise reject
      logLineAsync(logFilePath, `sql connection error: ${error}`);
      res.send(requestError);
    }
    finally {
      if (mysqlconnection)
        mysqlconnection.release();
    }
  }
  else {
    req.status(404).end();
  }
})

webserver.get('/download-file/:filename', async (req, res, next) => {
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
  let isFileExists = false;

  //проверим существует ли файл
  try {
    await fsPromises.access(filePath);
    logLineAsync(logFilePath, `File ${filePath} exists`);
    isFileExists = true;
  }
  catch (error) {
    logLineAsync(logFilePath, `File ${filePath} doesn't exist`);
  }

  // если файл существует, отправим его для скачивания с названием, с которым он был загружен
  if( fileName && isFileExists ) {
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

    logLineAsync(logFilePath, `${filePath} sending file`);
    res.setHeader("Content-Disposition","attachment");
    res.download(filePath, fileInfo ? fileInfo.originalFileName : fileName);
  }
  // если файл не существует  - завершим
  else {
    res.end();
  };
});

webserver.get('/get-files', checkAuth, async (req, res) => {
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
webserver.post('/upload-file', checkAuth, busboy({limits: {fileSize: maxFileSize}}), async (req, res) => {
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

      req.busboy.on('file', async (fieldname, file, filename, transferEncoding, mimetype) => {  // это событие возникает, когда в запросе обнаруживается файл
        let clientWSConnection;
        let fileNameParts = filename.split('.');
        fileNameParts[0] = getRandomFileName();
        const storedFileName = fileNameParts.join('.');
        const storedPathName = path.resolve(uploadedFilesDir, storedFileName);

        let isDirExists = false;
        //проверим существует ли файл
        try {
          await fsPromises.access(uploadedFilesDir);
          logLineAsync(logFilePath, `Directory ${isDirExists} exists`);
          isDirExists = true;
        }
        catch (error) {
          logLineAsync(logFilePath, `Directory ${isDirExists} doesn't exist`);
        }

        if(!isDirExists) {
          try {
            await fsPromises.mkdir(uploadedFilesDir, { recursive: true });
          }
          catch (error) {
            logLineAsync(logFilePath, `Error occured creating ${uploadedFilesDir}:${error}`);
          }
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