'use strict'

window.addEventListener('load', getInitPageInfo);

async function getInitPageInfo () {

  let app = document.querySelector('.app');

  let wrapper = document.createElement('div');
  wrapper.className = 'wrapper';

  try {
    let statisticsRequestOptions = {
      headers: {
        "Accept": "application/json",
      },
    };
    const statisticsResponse = await fetch('/stat', statisticsRequestOptions);
    const statisticsData = await statisticsResponse.json();

    const variantsResponse = await fetch('/variants');
    const variantsData = await variantsResponse.json();

    if(Array.isArray(statisticsData) && statisticsData.length) {

      let statWrapper = document.createElement('div');

      let statHeader = document.createElement('h2');
      statHeader.textContent = 'Colors statistics:'
      let statList = document.createElement('ul');

      statisticsData.forEach( item => {
        let li = document.createElement('li');
        li.textContent = `${item.code}: ${item.count}`;
        statList.append(li);
      });

      statWrapper.append(statHeader, statList);
      wrapper.append(statWrapper);
    }
    else {
      console.warn('statistics is empty')
    };

    if(Array.isArray(variantsData) && variantsData.length) {

      let voteWrapper = document.createElement('div');

      let voteQuestion = document.createElement('h2');
      voteQuestion.textContent = 'Choose your favourite color:';

      let form = document.createElement('form');

      variantsData.forEach( item => {
        let input = document.createElement('input');
        input.type = 'radio';
        input.name = 'colorCode';
        input.value = item.code;
        input.id = item.code;
        let label = document.createElement('label');
        label.htmlFor = item.code;
        label.textContent = item.text;
        let br = document.createElement('br');
        form.append(input, label, br);
      });

      let submitBtn = document.createElement('input');
      submitBtn.type = 'button';
      submitBtn.value = 'Send answer';
      submitBtn.onclick = () => sendVote();

      form.append(submitBtn);
      voteWrapper.append(voteQuestion, form);
      wrapper.append(voteWrapper);
    }
    else {
      let errorMessage = document.createElement('h2');
      errorMessage.textContent = 'Voting is unavaliable at the moment.'
      wrapper.append(errorMessage);
    };

    if(Array.isArray(statisticsData) && statisticsData.length)
      wrapper.append(composeButtonsBlock());
    app.append(wrapper);
  }
  catch (error) {
    console.error(`Error message: ${error.message}`);
  };
};

async function sendVote() {
  let radioChecked = document.querySelector('input[type="radio"]:checked');

  if (radioChecked) {
    try {
      let voteRequestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [radioChecked.name]: radioChecked.value }),
      };
      const voteResponse = await fetch("/vote", voteRequestOptions);

      let app = document.querySelector(".app");
      let oldWrapper = document.querySelector(".wrapper");
      app.removeChild(oldWrapper);

      if (voteResponse.status === 200) {
        let statisticsRequestOptions = {
          headers: {
            "Accept": "application/json",
          },
        };
        const statisticsResponse = await fetch("/stat", statisticsRequestOptions);
        const statisticsData = await statisticsResponse.json();

        let wrapper = document.createElement("div");
        wrapper.className = "wrapper";

        if (Array.isArray(statisticsData) && statisticsData.length) {
          let statWrapper = document.createElement("div");

          let statHeader = document.createElement("h2");
          statHeader.textContent = "Colors statistics:";
          let statList = document.createElement("ul");

          statisticsData.forEach((item) => {
              let li = document.createElement("li");
              li.textContent = `${item.code}: ${item.count}`;
              statList.append(li);
            });

          statWrapper.append(statHeader, statList);
          wrapper.append(statWrapper);
        }
        else {
          let errorMessage = document.createElement("h2");
          errorMessage.textContent = "Voting is unavaliable at the moment.";
          wrapper.append(errorMessage);
        };

        if (Array.isArray(statisticsData) && statisticsData.length)
          wrapper.append(composeButtonsBlock());
        app.append(wrapper);
      }
      else {
        alert("Vote hasn't been accepted. Please, fill the form again.");
        getInitPageInfo();
      };
    }
    catch (error) {
      console.error(`Error message: ${error.message}`);
    }
  }
  else alert('Please, choose one variant!')
};

function composeStatBlock(statisticsData) {
  let statWrapper = document.createElement('div');

  let statHeader = document.createElement('h2');
  statHeader.textContent = 'Colors statistics:'
  let statList = document.createElement('ul');

  statisticsData.forEach( item => {
    let li = document.createElement('li');
    li.textContent = `${item.code}: ${item.count}`;
    statList.append(li);
  });

  statWrapper.append(statHeader, statList);
  return statWrapper;
};

function composeButtonsBlock() {
  let buttonsWrapper = document.createElement('div');
  buttonsWrapper.className = 'buttonsWrapper';

  let jsonBtn = document.createElement('button');
  jsonBtn.textContent = 'Show statistics in json';
  jsonBtn.onclick = () => loadJson();

  let XMLBtn = document.createElement('button');
  XMLBtn.textContent = 'Show statistics in XML';
  XMLBtn.onclick = () => loadXML();

  let HTMLBtn = document.createElement('button');
  HTMLBtn.textContent = 'Show statistics in HTML';
  HTMLBtn.onclick = () => loadHTML();

  let br = document.createElement('br');

  let textArea = document.createElement('textarea');
  textArea.id = 'dataContainer';

  buttonsWrapper.append(jsonBtn, XMLBtn, HTMLBtn, br, textArea);

  return buttonsWrapper;
};

async function loadJson() {
  let downloadStatRequestOptions = {
    headers: {
      "Accept": "application/json",
    },
  };
  const downloadStatResponse = await fetch("/stat", downloadStatRequestOptions);
  let data = await downloadStatResponse.json();

  let textArea = document.getElementById('dataContainer');
  textArea.value = JSON.stringify(data);
};

async function loadXML() {
  let downloadStatRequestOptions = {
    headers: {
      "Accept": "application/xml",
    },
  };
  const downloadStatResponse = await fetch("/stat", downloadStatRequestOptions);
  let data = await downloadStatResponse.text();

  let textArea = document.getElementById('dataContainer');
  textArea.value = data;
};

async function loadHTML() {
  let downloadStatRequestOptions = {
    headers: {
      "Accept": "text/html",
    },
  };
  const downloadStatResponse = await fetch("/stat", downloadStatRequestOptions);
  let data = await downloadStatResponse.text();

  let textArea = document.getElementById('dataContainer');
  textArea.value = data;
};