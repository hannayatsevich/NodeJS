const express = require('express');
const path = require('path');
const fs = require('fs');

const { logLineSync } = require('./utils');

const port = 3012;
const logFilePath = path.resolve(__dirname, 'log', '_server.log');
const variantsFilePath = path.resolve(__dirname, 'data', 'variants.json');
const dynamicStatisticsFilePath = path.resolve(__dirname, 'data', 'dynamic-statistics.json');

const webserver = express();

webserver.use( (req, res, next) => {
  logLineSync(logFilePath, `${req.originalUrl} request`);
  next();
});
webserver.use(express.urlencoded());
webserver.use(express.json());

webserver.use('/vote-page', express.static(path.resolve(__dirname, '..', 'front', 'index.html')));
webserver.use('/script.js', express.static(path.resolve(__dirname, '..', 'front', 'script.js')));
webserver.use('/style.css', express.static(path.resolve(__dirname, '..', 'front', 'style.css')));


webserver.get('/variants', (req, res) => {

  fs.readFile(variantsFilePath, "utf8", function(error, data) {
    if(error) {
      res.setHeader('Content-type', 'application/json');
      res.status(404).send({errorCode: 0, errorMessage: "variants didn't found"});
      logLineSync(logFilePath, `readFile "${variantsFilePath}" error `);
    }
    else {
      let dataParced = JSON.parse(data);
      let processedData = dataParced.sort( (a,b) => a.ord - b.ord).map(elem => ({
        code: elem.code,
        text: elem.text,
      }));

      res.setHeader('Content-type', 'application/json');
      res.send(processedData);
      logLineSync(logFilePath, `variants data sent ${JSON.stringify(processedData)}`);
    }
  });
});

webserver.get('/stat', (req, res) => {
  const statisticsFilePath = path.resolve(__dirname, 'data', 'statistics.json');

  fs.readFile(statisticsFilePath, "utf8", function(error, data) {
    if(error) {
      console.log(error)
      logLineSync(logFilePath, `readFile "${statisticsFilePath}" error `);
      res.setHeader('Content-type', 'application/json');
      res.setHeader("Cache-Control","public, max-age=0");
      res.status(404).send({errorCode: 0, errorMessage: "statistics didn't found"});
    }
    else {
      let dataParced = JSON.parse(data);
      let processedData = dataParced.sort( (a,b) => a.ord - b.ord).map(elem => ({
        code: elem.code,
        count: elem.count,
      }));

      const clientAccept = req.headers.accept;
      if (clientAccept === "application/json") {
        console.log('here')
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control","public, max-age=0");
        res.send(processedData);
        logLineSync(logFilePath, `statistics data sent in application/json ${JSON.stringify(processedData)}`);
      }
      else if (clientAccept === "application/xml") {

        console.log('here2')
        res.setHeader("Content-Type", "application/xml");
        res.setHeader("Cache-Control","public, max-age=0");
        let xmlString = '<busket>';
        processedData.forEach( item => xmlString += `<code>${item.code}</code><count>${item.count}</count>`);
        xmlString += '</busket>';
        res.send(xmlString);
        logLineSync(logFilePath, `statistics data sent in application/xml ${xmlString}`);
      }
      else if (clientAccept === "text/html") {

        console.log('here3')
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Cache-Control","public, max-age=0");
        let htmlString = '<ul>';
        processedData.forEach( item => htmlString += `<li>${item.code}: ${item.count}</li>`);
        htmlString += '</ul>';

        res.send(htmlString);
        logLineSync(logFilePath, `statistics data sent in application/xml ${htmlString}`);
      }
      else {
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Cache-Control","public, max-age=0");
        let dataString = '';
        processedData.forEach( item => htmlString += `${item.code}: ${item.count}`);

        res.send(dataString);
        logLineSync(logFilePath, `statistics data sent in application/xml ${dataString}`);
      }
    }
  });
});

webserver.post('/vote', (req, res) => {
  const statisticsFilePath = path.resolve(__dirname, 'data', 'statistics.json');

  fs.readFile(statisticsFilePath, "utf8", function(error, data) {
    if(error) {
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
          logLineSync(logFilePath, `writeFile "${statisticsFilePath}" error `);
          res.setHeader('Content-type', 'application/json');
          res.status(404).send({errorCode: 0, errorMessage: "vote wasn't saved"});
        }
        else {
         res.setHeader('Content-type', 'application/json');
         res.status(200).end();
         logLineSync(logFilePath, `vote saved ${JSON.stringify(processedData)}`);
        }
      });
    }
  });
});

webserver.listen( port , () => {
  logLineSync(logFilePath, `start listening port ${port}`);
});