

// возвращает соединение с БД, взятое из пула соединений
function newConnectionFactory(sqlConnectionsPool) {
    return new Promise( (resolve, reject) => {
        sqlConnectionsPool.getConnection( (error, connection) => {
            if (error) reject(error);
            else  resolve(connection);
        })
    });
}

// выполняет SQL-запрос на чтение, возвращает массив прочитанных строк
function selectQueryFactory(connection, queryText, queryValues) {
    return new Promise((resolve, reject) => {
        connection.query(queryText, queryValues, (error, rows, fields) => {
            if (error) reject(error);
            else resolve(rows);
        });
    });
}

// выполняет SQL-запрос на чтение, возвращает одну прочитанную строку
function selectQueryRowFactory(connection, queryText, queryValues) {
    return new Promise( (resolve, reject) => {
        selectQueryFactory(connection, queryText, queryValues)
            .then( rows => {
                if ( rows.length !== 1 )
                    reject("selectQueryRowFactory: single row needed, got " + rows.length + " rows, query: " + queryText);
                else resolve(rows[0])
            })
            .catch( error => reject(error) );
    })
}

// выполняет SQL-запрос на модификацию
function modifyQueryFactory(connection, queryText, queryValues) {
    return new Promise((resolve, reject) => {
        connection.query(queryText, queryValues, (error, result) => {
            if ( error ) reject(error);
            else resolve(result);
        });
    });
}

// возвращает количество изменённых последним запросом строк
function getModifiedRowsCount(connection) {
    return new Promise( (resolve, reject) => {
        selectQueryFactory(connection,"select row_count() as row_count")
            .then( rows => resolve(rows[0].row_count))
            .catch( error => reject(error) )
        ;
    } );
}


module.exports = {
    newConnectionFactory,
    selectQueryFactory,
    selectQueryRowFactory,
    modifyQueryFactory,
    getModifiedRowsCount,
}