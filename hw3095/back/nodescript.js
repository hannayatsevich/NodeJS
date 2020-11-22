const express = require('express');
const path = require('path');
const fs = require('fs');

const { logLineSync } = require('./utils');

const webserver = express();

webserver.use(express.urlencoded());
webserver.use(express.json());

const port = 3012;
const logFilePath = path.join(__dirname, '/log/_server.log');

//console.log(logFilePath);


webserver.listen( port , () => {
  logLineSync(logFilePath, `start listening port ${port}`);
});

webserver.get('/vote-page', (req, res) => {
  logLineSync(logFilePath, `/vote-page request`);
  res.sendFile(path.join(__dirname, '../front/index.html'));
});

webserver.get('/script.js', (req, res) => {
  logLineSync(logFilePath, `/script.js request`);
  res.sendFile(path.join(__dirname, '../front/script.js'));
});

webserver.get('/variants', (req, res) => {
  logLineSync(logFilePath, `/variants request`);
  const statisticsFilePath = path.join(__dirname, './data/statistics.json');

  fs.readFile(statisticsFilePath, "utf8", function(error, data) {
    if(error) {
      console.log(error)
      logLineSync(logFilePath, `readFile "${statisticsFilePath}" error `);
      res.setHeader('Content-type', 'application/json');
      res.status(404).send({errorCode: 0, errorMessage: "variants didn't found"});
    }
    else {
      let dataParced = JSON.parse(data);
      let processedData = dataParced.map(elem => ({code: elem.code, text: elem.text, ord: elem.ord}));

      res.setHeader('Content-type', 'application/json');
      res.send(processedData);
      logLineSync(logFilePath, `variants data sent ${JSON.stringify(processedData)}`);
    }
  });
});

webserver.post('/stat', (req, res) => {
  logLineSync(logFilePath, `/stat request`);
  const statisticsFilePath = path.join(__dirname, './data/statistics.json');

  fs.readFile(statisticsFilePath, "utf8", function(error, data) {
    if(error) {
      console.log(error)
      logLineSync(logFilePath, `readFile "${statisticsFilePath}" error `);
      res.setHeader('Content-type', 'application/json');
      res.status(404).send({errorCode: 0, errorMessage: "statistics didn't found"});
    }
    else {
      let dataParced = JSON.parse(data);
      let processedData = dataParced.map(elem => ({code: elem.code, count: elem.count, ord: elem.ord}));

      res.setHeader('Content-type', 'application/json');
      res.send(processedData);
      logLineSync(logFilePath, `statistics data sent ${JSON.stringify(processedData)}`);
    }
  });
});

webserver.post('/vote', (req, res) => {
  logLineSync(logFilePath, `/vote request`);
  const statisticsFilePath = path.join(__dirname, './data/statistics.json');
  console.log(req)
  console.log(req.body)

  fs.readFile(statisticsFilePath, "utf8", function(error, data) {
    if(error) {
      console.log(error)
      logLineSync(logFilePath, `readFile "${statisticsFilePath}" error `);
      res.setHeader('Content-type', 'application/json');
      res.status(404).send({errorCode: 0, errorMessage: "vote wasn't saved"});
    }
    else {
      let dataParced = JSON.parse(data);
      let processedData = dataParced.map(elem => {
        if(elem.code === req.body.colorCode)
          return {...elem, count: elem.count + 1};
        return {...elem};
      });

      fs.writeFile(statisticsFilePath, JSON.stringify(processedData), function(error, data) {
        if(error) {
          console.log(error)
          logLineSync(logFilePath, `writeFile "${statisticsFilePath}" error `);
          res.setHeader('Content-type', 'application/json');
          res.status(404).send({errorCode: 0, errorMessage: "vote wasn't saved"});
        }
        else {
         res.setHeader('Content-type', 'application/json');
         //res.send(processedData);
         res.status(200).end();
         logLineSync(logFilePath, `vote saved ${JSON.stringify(processedData)}`);

        }
      });
    }
  });
});