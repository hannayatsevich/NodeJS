const express = require('express');
const path = require('path');
const mysql = require("mysql");

const { logLineAsync } = require('./backutils');
const { newConnectionFactory } = require("./db_utils");
const { sqlConfig } = require("./db_creds/db_config");

const logFilePath = path.resolve(__dirname, 'log', '_server.log');
const port = 6195;

const webserver = express();
let sqlConnectionsPool = mysql.createPool(sqlConfig);

webserver.use(express.urlencoded({ extended: true }));
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
    errorMessage: 'Request error',
};

webserver.get( '/get-databases', async (req, res) => {
    let mysqlconnection = null;
    try {
        mysqlconnection = await newConnectionFactory(sqlConnectionsPool, res, errorResponse2);
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
        logLineAsync(logFilePath, `sql connection error: ${error}`);
        res.send(errorResponse2);
    }
    finally {
        if (mysqlconnection)
            mysqlconnection.release();
    }
});

webserver.post( '/process-custom-query', async (req, res) => {

    if(req.body.textQuery.indexOf('drop') > -1) {
        res.send({...errorResponse1, errorMessage: 'You have no access to drop queries!'});
    }
    else {
        let mysqlconnection = null;
        try {
            mysqlconnection = await newConnectionFactory(sqlConnectionsPool, res, errorResponse2, req.body.database);
            mysqlconnection.query( req.body.textQuery, (error, results, fields) => {
                console.log('results', results)
                if(error) {
                    logLineAsync(logFilePath, `sql query error: ${error}`);
                    res.send({...errorResponse1, errorMessage: error.sqlMessage});
                }
                else {
                    if(req.body.textQuery.indexOf('insert') > -1 || req.body.textQuery.indexOf('create') > -1 || req.body.textQuery.indexOf('delete') > -1 || req.body.textQuery.indexOf('update') > -1) {
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
            logLineAsync(logFilePath, `sql connection error: ${error}`);
            res.send(errorResponse2);
        }
        finally {
            if (mysqlconnection)
                mysqlconnection.release();
        }
    }
});

webserver.listen(port, () => {
    logLineAsync(logFilePath, `listen port ${port}`);
});
