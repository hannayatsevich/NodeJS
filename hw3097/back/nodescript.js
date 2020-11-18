const express = require('express');
const path = require('path');
const fs = require('fs');

const webserver = express();

const port  = 3010;

let validationInfo = {
  isValid: true,
  queryObject: {},
  errorMessage: '',
};

//работает отлично без доп запроса для стилей, но как тогда вернуть заполненную форму?
//webserver.use(express.static('../front'));

webserver.get('/form', (req, res, next) => {
  let filePath = path.join(__dirname, '../front/index.html');
  fs.readFile(filePath, 'utf8', (err, text) => {
    let newText = text;

    if(!validationInfo.isValid) {
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
      }

    }

    validationInfo = {
      isValid: true,
      queryObject: {},
      errorMessage: '',
    };

    res.send(newText);
  });
});

//!!!иначе не подгружаются стили
webserver.get('/style.css', function(req, res) {
  res.sendFile(path.join(__dirname, '../front/style.css'));
});

webserver.get('/service', (req, res, next) => {
  validationInfo = check(req.query);

  if(validationInfo.isValid) {
    validationInfo = {
      isValid: true,
      queryObject: {},
      errorMessage: '',
    };
    res.send(formDataString(req.query));
  }
  else {
    res.redirect('/form');
  };
});

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
    errorMessage,
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
  console.log(`listening port ${port}`)
});