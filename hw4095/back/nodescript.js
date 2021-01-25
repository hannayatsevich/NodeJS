const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const { logLineAsync, validateURL, validateBody } = require('./utils');
const logFilePath = path.resolve(__dirname, 'log', '_server.log');
const initSavedRequestsPath = path.resolve(__dirname, 'data', 'initSavedRequests.json');
const savedRequestsPath = path.resolve(__dirname, 'data', 'savedRequests.json');

const webserver = express();

const port  = 3014;

webserver.use(express.urlencoded({ extended: true }));
webserver.use(express.json());

webserver.use( (req, res, next) => {
  logLineAsync(logFilePath, `${req.originalUrl} request`);
  next();
});

webserver.use('/postman', express.static(path.resolve(__dirname, '..', 'front', 'public', 'index.html')));
webserver.use('/bundle.min.js', express.static(path.resolve(__dirname, '..', 'front', 'public', 'bundle.min.js')));
webserver.use('/bundle.css', express.static(path.resolve(__dirname, '..', 'front', 'public', 'bundle.css')));

webserver.get('/get-saved-requests', (req, res) => {

  if( fs.existsSync(savedRequestsPath)) {
    fs.readFile(savedRequestsPath, 'utf8', (err, data) => {
      if(err) {
        res.status(200).send({
          errorCode: "1",
          errorMessage: "Can not get saved requests",
        });
        logLineAsync(logFilePath, `failed read file ${savedRequestsPath}`);
      }
      else {
        resTemplate = {
          errorCode: "0",
          errorMessage: "",
        }
        if(data)
          res.send({
            ...resTemplate,
            data: JSON.parse(data),
          });
        else res.send({
          ...resTemplate,
          data: []
        });
      }
    });
  }
  else {
    fs.readFile(initSavedRequestsPath, 'utf8', (err, data) => {
      if(err) {
        res.status(200).send({
          errorCode: "1",
          errorMessage: "Can not get saved requests"
        });
        logLineAsync(logFilePath, `failed read file ${initSavedRequestsPath}`);
      }
      else {
        fs.writeFile(savedRequestsPath, data, (err) => {
          if (err)
            logLineAsync(logFilePath, `failed write file ${savedRequestsPath}`);
          else
            logLineAsync(logFilePath, `init requests added to file ${savedRequestsPath}`);
        });

        res.send({
          errorCode: "0",
          errorMessage: "",
          data: JSON.parse(data),
        });
      }
    });
  }

});

const validateRequestData = (request) => {
  let validation = {
    isValid: false,
    message: '',
  }
  let validationsArray = []
  validationsArray.push(validateURL(request.requestUrl));
  if(request.requestMethod.toLowerCase() === 'post' || request.requestMethod.toLowerCase() === 'put')
    validationsArray.push(validateBody(request.requestMethod, request.requestData.body, request.requestData.headers));

  if(validationsArray.every(item => item.isValid)) {
    validation.isValid = true;
  }
  else {
    validation.message = validationsArray.reduce( (acc, item) => item.message + '\n', '');
  }

  return validation;
};

webserver.post('/send-request', async (req, res) => {
  //console.log('req', req.body)

  let request = req.body;
  let responseData = {};

  if(request) {
    let isRequestValid = validateRequestData(request);
    if(isRequestValid.isValid) {
      let url = request.requestUrl;

      let fetchOptions = {
        method: request.requestMethod,
        headers: {},
      };

      request.requestData.headers.forEach( item => {
        if(item.name)
          fetchOptions.headers[item.name] = item.value;
      });

      if(request.requestMethod.toLowerCase() === 'get' && request.requestData.params.length) {
        url += '?';
        request.requestData.params.forEach( (item, index) => {
          if(index)
            url += '&';
          url += `${item.name}=${item.value}`;
        });
      }

      if( (request.requestMethod.toLowerCase() === 'post' || request.requestMethod.toLowerCase() === 'put') && request.requestData.body) {
        //application/x-www-form-urlencoded
        //let searchParams = new URLSearchParams();
        //let searchParams = `login=${encodeUriComponent('xxx')}`
        //multipart/form-data
        //let formData = new FormData()

        let contentType;

        //проверка на наличие content-type в валидации выше
        request.requestData.headers.forEach( item => {
          if(item.name.toLowerCase() === 'content-type')
            contentType = item.value;
        });

        let reqBody = request.requestData.body.split('\n').join('').split('\r').join('');

        fetchOptions.body = reqBody;
      }

      let fetchSucsess = false;
      let responseData = {
        headers: [],
        contentType: null,
        body: null,
      }

      try {
        let response = await fetch(url, fetchOptions);
        responseData.status = response.status;
        responseData.contentType = response.headers.get('content-type');
        for (let [key, value] of response.headers) {
          responseData.headers.push({name: key, value: value});
        }

        let data = await response.text();
        responseData.body = data;
        fetchSucsess = true;
        logLineAsync(logFilePath, `fetch ${url} sucsess, response data: ${JSON.stringify(responseData)}`);
      }
      catch (err) {
        logLineAsync(logFilePath, `fetch ${url} error, error: ${err.message}`);
      };

      if(fetchSucsess) {
        logLineAsync(logFilePath, `Fetch request succeed`);
        res.status(200).send({
          errorCode: "0",
          errorMessage: "",
          data: responseData,
        });
      }
      else {
        logLineAsync(logFilePath, `Fetch request failed`);
        res.status(200).send({
          errorCode: "3",
          errorMessage: "Fetch request failed",
          data: responseData,
        });
      }

    }
    else {
      logLineAsync(logFilePath, `Request data is not valid:\n${isRequestValid.message}`);
      res.status(200).send({
        errorCode: "2",
        errorMessage: `Request data is not valid:\n${isRequestValid.message}`,
        data: responseData,
      });
    }
  }
  else {
    logLineAsync(logFilePath, `Request data is empty`);
    res.status(200).send({
      errorCode: "1",
      errorMessage: "Request data is empty",
      data: responseData,
    });
  }


});

webserver.post('/save-request', (req, res) => {
  let requestData = req.body.requestData;
  let action = req.body.action;
  if(requestData.presavedRequest) {
    res.status(200).send({
      errorCode: "1",
      errorMessage: "Can not save request",
    });
    logLineAsync(logFilePath, `can not save presaved request ${savedRequestsPath}`);
  }
  else
    fs.readFile(savedRequestsPath, 'utf8', (err, data) => {
      if(err) {
        res.status(200).send({
          errorCode: "1",
          errorMessage: "Can not save request",
        });
        logLineAsync(logFilePath, `failed read file ${savedRequestsPath}`);
      }
      else {
        let newData = JSON.parse(data);

        if(action === 'ADD') {
          let requestIndex = newData.findIndex(item => item.requestName === requestData.requestName);

          if(requestIndex > -1) {
            newData[requestIndex] = {...requestData}
          }
          else {
            newData.push(requestData);
          }
        }
        if(action === 'DELETE') {
          newData = newData.filter(item => item.requestName !== requestData.requestName);
        }

        fs.writeFile(savedRequestsPath, JSON.stringify(newData), (err) => {
          if (err) {
            res.status(200).send({
              errorCode: "1",
              errorMessage: "Can not save request",
            });
            logLineAsync(logFilePath, `failed write file ${savedRequestsPath}`);
          }
          else {
            res.status(200).send({
              errorCode: "0",
              errorMessage: "",
              data: newData,
            });
            logLineAsync(logFilePath, `init requests added to file ${savedRequestsPath}`);
          }
        });
      }
    });

});

validatehData = (request) => {

};

webserver.listen(port, () => {
  logLineAsync(logFilePath, `listen port ${port}`);
})