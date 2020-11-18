const express = require('express');
const fs = require('fs');

const webserver = express();

webserver.set('view engine', 'pug');
webserver.set('views', '../front/views');

const port  = 3011;

let initValues = {
  firstname: '',
  secondname: '',
  age: '',
  email: '',
  tel: '',
  female: false,
  male: false,
  ballet: false,
  books: false,
  movies: false,
  color: '',
  birthdate: '',
  birthdatetime: '',
  birthmonth: '',
  birthweek: '',
  photo: '',
  range: '',
  psw: '',
}

let validationInfo = {
  isValid: true,
  queryObject: {...initValues},
  errorMessage: '',
};

//работает отлично без доп запроса для стилей, но как тогда вернуть заполненную форму?
//webserver.use(express.static('../front'));

webserver.get('/form', (req, res, next) => {
    let indexFilePath = '../front/views/index.pug';
    let errorFilePath = '../front/views/error.pug';
    let pageData = validationInfo.queryObject;
    if(validationInfo.isValid === false) {
      let text = `h3(class="error") Please, fill the form carefully \n${validationInfo.errorMessage}`
      //console.log(text);
      validationInfo = {
        isValid: true,
        queryObject: {...initValues},
        errorMessage: '',
      };
      fs.writeFile(errorFilePath, text, (err) => {
        if (err) throw err;
        //console.log('The file has been saved!');
        res.render('index', pageData);
        fs.writeFile(errorFilePath, '', (err) => {
          if (err) throw err;
        })
      })
    }
    else {
      validationInfo = {
        isValid: true,
        queryObject: {...initValues},
        errorMessage: '',
      };
      fs.writeFile(errorFilePath, '', (err) => {
        if (err) throw err;
        //console.log('The file has been saved!');
        res.render('index', pageData);
      })
    }
});

const templateString = (key, value, checked = false) => {
  return {
    split: `id="${key}"`,
    join: checked ? `id="${key}" checked ` : `id="${key}" value="${value}" `,
  }
};

webserver.get('/service', (req, res, next) => {
  //console.log(req.query);
  validationInfo = check(req.query);

  if(validationInfo.isValid) {
    validationInfo = {
      isValid: true,
      queryObject: {...initValues},
      errorMessage: '',
    };
    let errorFilePath = '../front/views/error.pug';
    fs.writeFile(errorFilePath, '', (err) => {
      if (err) throw err;
      //console.log('The file has been saved!');
      res.send(formDataString(req.query));
    })
  }
  else {
    res.redirect('/form');
  }
});

const check = (queryObject) => {
  let isValid = false;
  let errorMessage = 'ul \n';

  //let needValidation = Object.keys(queryObject).length;
  let needValidation = 3;

  for( let key in queryObject) {
    switch(key) {
      case 'firstname':
        if(queryObject[key].length < 5)
          errorMessage += '  li(class="error") minimum first name length should be 5 \n';
        else needValidation--;
        break;
      case 'secondname':
        if(queryObject[key].length < 5)
          errorMessage += '  li(class="error") minimum second name length should be 5 \n';
        else needValidation--;
        break;
      case 'age':
        if(Number(queryObject[key]) < 18)
          errorMessage += '  li(class="error") minimum age should be 18 \n';
        else needValidation--;
        break;
      default: ;
    }
  };
  errorMessage += '  li(class="warn") please, choose photo one more time';

  if(!needValidation) isValid = true;

  let transformedOeryObject = {
    ...queryObject,
    male: queryObject['sex'] === 'male',
    female: queryObject['sex'] === 'female',
    books: queryObject['interests'] ? ( (queryObject['interests'] === 'books' || queryObject['interests'].indexOf('books') > -1 ) ? true : false ) : false,
    movies: queryObject['interests'] ? ( (queryObject['interests'] === 'movies' || queryObject['interests'].indexOf('movies') > -1 ) ? true : false ) : false,
    ballet: queryObject['interests'] ? ( (queryObject['interests'] === 'ballet' || queryObject['interests'].indexOf('ballet') > -1 ) ? true : false ) : false,
  }

  return {
    isValid,
    errorMessage,
    queryObject: transformedOeryObject,
  };
};

const formDataString = (data) => {
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
  console.log(`listen port ${port}`)
});