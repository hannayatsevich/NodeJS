const { logLineAsync } = require('./backutils');
const path = require('path');
const logFilePath = path.resolve(__dirname, 'log', '_server.log');

// возвращает соединение, взятое из пула соединений, добавляет нужную БД в конфиг при необходимости
function newConnectionFactory(sqlConnectionsPool, res, errorResponse, dbName) {
    if(dbName)
        sqlConnectionsPool.config.connectionConfig.database = dbName;
    else
        delete sqlConnectionsPool.config.connectionConfig.database

    return new Promise( (resolve, reject) => {
        sqlConnectionsPool.getConnection( (error, connection) => {
            if ( error ) {
                logLineAsync(logFilePath, `sql connection error: ${error}`);
                res.send(errorResponse);
            }
            else {
                resolve(connection);
            }
        })
    })
}

module.exports = {
    newConnectionFactory
}