const express = require('express');
const path = require('path');
const mysql = require("mysql");

const { logLineAsync } = require('./backutils');

const logFilePath = path.resolve(__dirname, 'log', '_server.log');
const port = 6195;

const sqlConfig={
    // connectionLimit: 2,      // полагаем что БД выдержит 2 соединения, т.е. в пуле будет максимум 2 соединения
    host: 'localhost',   // на каком компьютере расположена база данных
    // user: 'user',    // каким пользователем подключаемся
    // password: 'user',    // каким паролем подключаемся
    user: 'hannayavi',    // каким пользователем подключаемся
    password: 'hannayavi',    // каким паролем подключаемся
};

const webserver = express();

webserver.use(express.urlencoded({ extended: true }));// todo???
webserver.use(express.json());
webserver.use( (req, res, next) => {
    logLineAsync(logFilePath, `${port}:${req.originalUrl} request`);
    next();
});

webserver.use('/sqlexplorer', express.static(path.resolve(__dirname, '..', 'front', 'public', 'index.html')));
webserver.use('/bundle.min.js', express.static(path.resolve(__dirname, '..', 'front', 'public', 'bundle.min.js')));
webserver.use('/bundle.css', express.static(path.resolve(__dirname, '..', 'front', 'public', 'bundle.css')));

let errorResponse1 = {
    errorCode: 1,
};
let errorResponse2 = {
    errorCode: 2,
    errorMessage: 'request error',
};

webserver.get( '/get-databases', async (req, res) => {
    let mysqlconnection = null;
    try {
        mysqlconnection = mysql.createConnection(sqlConfig);
        mysqlconnection.connect();
        mysqlconnection.query( 'show databases', (error, results, fields) => {
            if(error) {
                logLineAsync(logFilePath, `sql query error: ${error}`);
                res.send({...errorResponse1, errorMessage: error.sqlMessage});
            }
            else {
                logLineAsync(logFilePath, `sql query success: ${JSON.stringify(results)}`);
                res.send({
                    errorCode: 0,
                    data: results.map( item => item.Database), // всегда ли так приходят данные?
                })
            }
        })
    }
    catch (error) {
        if(mysqlconnection) mysqlconnection.end();
        logLineAsync(logFilePath, `sql connection error: ${error}`);
        res.send(errorResponse2);
    }
});

webserver.post( '/process-custom-query', async (req, res) => {

    if(req.body.textQuery.indexOf('drop') > -1) {
        res.send({...errorResponse1, errorMessage: 'You have no access to drop queries!'});
    }
    else {
        let mysqlconnection = null;
        try {
            mysqlconnection = mysql.createConnection({...sqlConfig, database: req.body.database});
            mysqlconnection.connect();
            mysqlconnection.query( req.body.textQuery, (error, results, fields) => {
                console.log('results', results)
                if(error) {
                    logLineAsync(logFilePath, `sql query error: ${error}`);
                    res.send({...errorResponse1, errorMessage: error.sqlMessage});
                }
                else {
                    if(req.body.textQuery.indexOf('insert') > -1 || req.body.textQuery.indexOf('create') > -1 || req.body.textQuery.indexOf('delete') > -1) {
                        mysqlconnection.query('select row_count()', (error, results, fields) => {
                            if (error) {
                                logLineAsync(logFilePath, `sql query error: ${error}`);
                                res.send({...errorResponse1, errorMessage: error.sqlMessage});
                            } else {
                                logLineAsync(logFilePath, `sql query success: ${JSON.stringify(results)}`);
                                res.send({
                                    errorCode: 0,
                                    data: results,
                                })
                            }
                        })
                    }
                    else {
                        logLineAsync(logFilePath, `sql query success: ${JSON.stringify(results)}`);
                        res.send({
                            errorCode: 0,
                            data: results,
                        })
                    }
                }
            })
        }
        catch (error) {
            if(mysqlconnection) mysqlconnection.end();
            logLineAsync(logFilePath, `sql connection error: ${error}`);
            res.send(errorResponse2);
        }
    }
});

webserver.listen(port, () => {
    logLineAsync(logFilePath, `listen port ${port}`);
});
