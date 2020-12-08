const express = require('express');
const path = require('path');
const fs = require('fs');

const { logLineAsync } = require('./utils');
const logFilePath = path.resolve(__dirname, 'log', '_server.log');

const webserver = express();

const port  = 3013;

webserver.use(express.urlencoded({ extended: true }));

webserver.use( (req, res, next) => {
  logLineAsync(logFilePath, `${req.originalUrl} request`);
  next();
});

webserver.use('/style.css', express.static(path.resolve(__dirname, '..', 'front', 'style.css')));
webserver.use('/form', express.static(path.resolve(__dirname, '..', 'front', 'index.html')));

webserver.post('/service', (req, res, next) => {
  let validationInfo = check(req.body);

  if(validationInfo.isValid) {
    let queryString = getStringFromQuery(req.body);
    res.redirect(`/result?${queryString}`);
    logLineAsync(logFilePath, `form is valid, redirected to /result?${queryString}`);
  }
  else {
    let filePath = path.resolve(__dirname, '..', 'front', 'index.html');
    fs.readFile(filePath, 'utf8', (err, text) => {
      if(err)
        logLineAsync(logFilePath, `failed read file ${filePath}`);
      else {
        let newText = text;
        newText = text.split('</h1>').join(`</h1><h3 class="error">Please, fill the form carefully</h3>${validationInfo.errorMessage}`);
        let savedPageData = validationInfo.queryObject;
        for (let key in savedPageData) {
          switch(key) {
            case 'psw':
              break;
            case 'sex':
              newText = newText.split(templateString(savedPageData[key], null, true).split).join(templateString(savedPageData[key], null, true).join);
              break;
            case 'interests':
              if(Array.isArray(savedPageData[key])) {
                savedPageData[key].forEach( item => {
                  newText = newText.split(templateString(item, null, true).split).join(templateString(item, null, true).join);
                });
              }
              else
                newText = newText.split(templateString(savedPageData[key], null, true).split).join(templateString(savedPageData[key], null, true).join);
              break;
            default: newText = newText.split(templateString(key, savedPageData[key]).split).join(templateString(key, savedPageData[key]).join);
          }
        };

        res.send(newText);

        logLineAsync(logFilePath, `text sent: ${newText}`);
      }
    });
    logLineAsync(logFilePath, `form is not valid, send form back`);
  };
});

webserver.get('/result', (req, res, next) => {
  res.send(formDataString(req.query));
  logLineAsync(logFilePath, `sent data: ${formDataString(req.query)}`);
});

const getStringFromQuery = (query) => {
  let stringQuery = '';
  for( let key in query) {
    if(query[key] && key !== 'psw')
      stringQuery += `${key}=${query[key]}&`;
  }
  return stringQuery.slice(0, stringQuery.length - 2);
};

const templateString = (key, value, checked = false) => {
  return {
    split: `id="${key}"`,
    join: checked ? `id="${key}" checked ` : `id="${key}" value="${value}" `,
  }
};

const check = (queryObject) => {
  let isValid = false;
  let errorMessage = '<ul>';

  //let needValidation = Object.keys(queryObject).length;
  let needValidation = 3;

  for( let key in queryObject) {
    switch(key) {
      case 'firstname':
        if(queryObject[key].length < 5)
          errorMessage += '<li class="error">minimum first name length should be 5 </li>';
        else needValidation--;
        break;
      case 'secondname':
        if(queryObject[key].length < 5)
          errorMessage += '<li class="error">minimum second name length should be 5 </li>';
        else needValidation--;
        break;
      case 'age':
        if(Number(queryObject[key]) < 18)
          errorMessage += '<li class="error">minimum age should be 18 </li>';
        else needValidation--;
        break;
      default: ;
    }
  };
  errorMessage += '<li class="warn">please, choose photo one more time</li></ul>';

  if(!needValidation) isValid = true;

  return {
    isValid,
    errorMessage: isValid ? '' : errorMessage,
    queryObject,
  };
};

const formDataString = (data) => {
// {
//     firstname: 'Hanna',+
//     secondname: 'Adams',+
//     age: '12',+
//     email: 'user1@co.uk',+
//     tel: '+333 33 33',+
//     sex: 'female',+
//     interests: 'ballet' / ['ballet', 'books'],+
//     color: '#5cb950',+
//     birthdate: '2000-05-18',+
//     birthdatetime: '2000-05-18T05:12',+
//     birthmonth: '2020-05',+
//     birthweek: '2000-W20',+
//     photo: '137946.jpg',
//     range: '24',
//     psw: '123'
// }
  let dataString = '<h3>Profile data:</h3></ul>';

  if(data.firstname) dataString += `<li>First name: ${data.firstname}</li>`;
  if(data.secondname) dataString += `<li>Second name: ${data.secondname}</li>`;
  if(data.age) dataString += `<li>Age: ${data.age}</li>`;
  if(data.email) dataString += `<li>Email: ${data.email}</li>`;
  if(data.tel) dataString += `<li>Phone number: ${data.tel}</li>`;

  if(data.sex) dataString += `<li>Sex: ${data.sex}</li>`;
  if(data.interests) {
    if(Array.isArray(data.interests))
      dataString += `<li>Interests: ${data.interests.reduce( (acc, value, index) => `${index ? acc + ', ' : acc}${value}`, '')}</li>`
    else dataString += `<li>Interests:: ${data.interests}</li>`;
  }
  if(data.color) dataString += `<li>Favourite color: ${data.color}</li>`;//colorName?
  if( data.birthdate || data.birthdatetimet) {
    let date = data.birthdatetime ? data.birthdatetime : data.birthdate;
    let dateParts = date.split('-');
    dataString += `<li>Birth date: year ${dateParts[0]} month ${Number(dateParts[1])}${data.birthweek ? ' week ' +  data.birthweek.slice(data.birthweek.indexOf('W') + 1): ''} day ${dateParts[2].length === 2 ? Number(dateParts[2]) : Number(dateParts[2].slice(0, 2))}${dateParts[2].length === 2 ? '' : ' time ' +dateParts[2].slice(4)}</li>`;
  };
  dataString += '</ul>'
  return dataString;
};

webserver.listen(port, () => {
  logLineAsync(logFilePath, `listening port ${port}`);
});