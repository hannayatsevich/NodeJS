
function getRandomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < len; i++) {
        randomString += charSet[Math.floor(Math.random() * charSet.length)];
    }
    return randomString;
}

function getSubmitionUrl(login) {
    return `http://188.166.41.101:5697/submit-registration?login=${login}`
}

const emailSubject = 'Подтверждение регистрации';

function getEmailBody(login, url) {
    return `
        <h3>Hello, ${login}</h3>
        <p>To confirm subscription, please, follow <a href=${url}>link</a></p>
    `
}

let dividerRES = "[ \n\r]";
let tagNameRES = "[a-zA-Z0-9]+";
let attrNameRES = "[a-zA-Z]+";
let attrValueRES = "(?:\".+?\"|'.+?'|[^ >]+)";
let attrRES = "("+attrNameRES+")(?:"+dividerRES+"*="+dividerRES+"*("+attrValueRES+"))?";
let openingTagRES = "<("+tagNameRES+")((?:"+dividerRES+"+"+attrRES+")*)"+dividerRES+"*/?>"; // включает и самозакрытый вариант
let closingTagRES = "</("+tagNameRES+")"+dividerRES+"*>";

let openingTagRE = new RegExp(openingTagRES,"g");
let closingTagRE = new RegExp(closingTagRES,"g");

// удаляет из строки все теги
function removeTags(str, replaceStr= "") {
    if ( typeof(str) == "string" && str.indexOf("<") != -1 ) {
        str = str.replace(openingTagRE,replaceStr);
        str = str.replace(closingTagRE,replaceStr);
    }
    return str;
}

module.exports = {
    getRandomString,
    getSubmitionUrl,
    getEmailBody,
    emailSubject,
    removeTags,
}