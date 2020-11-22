'use strict'

window.addEventListener('load', getInitPageInfo);

async function getInitPageInfo () {

  let app = document.querySelector('.app');

  let wrapper = document.createElement('div');
  wrapper.className = 'wrapper';

  try {
    let statisticsRequestOptions = {
      method: "POST",
    };
    const statisticsResponse = await fetch('/stat', statisticsRequestOptions);
    const statisticsData = await statisticsResponse.json();

    const variantsResponse = await fetch('/variants');
    const variantsData = await variantsResponse.json();

    if(Array.isArray(statisticsData) && statisticsData.length) {

      let statHeader = document.createElement('h2');
      statHeader.textContent = 'Colors statistics:'
      let statList = document.createElement('ul');

      statisticsData.sort( (a, b) => a.ord - b.ord).forEach( item => {
        let li = document.createElement('li');
        li.textContent = `${item.code}: ${item.count}`;
        statList.append(li);
      });

      wrapper.append(statHeader, statList)
    }
    else {
      console.warn('statistics is empty')
    };

    if(Array.isArray(variantsData) && variantsData.length) {

      let voteQuestion = document.createElement('h2');
      voteQuestion.textContent = 'Choose your favourite color:';

      let form = document.createElement('form');

      variantsData.sort( (a, b) => a.ord - b.ord).forEach( item => {
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
      submitBtn.value = 'send';
      submitBtn.onclick = () => sendVote();

      form.append(submitBtn);

      wrapper.append(voteQuestion, form)
    }
    else {
      let errorMessage = document.createElement('h2');
      errorMessage.textContent = 'Voting is unavaliable at the moment.'
      wrapper.append(errorMessage);
    };

    app.append(wrapper);
  }
  catch (error) {
    console.error(`Error message: ${error.message}`);
  }
};

async function sendVote() {
  let radioChecked = document.querySelector('input[type="radio"]:checked');

  try{
    let voteRequestOptions = {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({[radioChecked.name]: radioChecked.value})
    };
    const voteResponse = await fetch('/vote', voteRequestOptions);

    let app = document.querySelector('.app');
    let oldWrapper = document.querySelector('.wrapper');
    app.removeChild(oldWrapper);

    if(voteResponse.status === 200) {

      let statisticsRequestOptions = {
        method: "POST",
      };
      const statisticsResponse = await fetch('/stat', statisticsRequestOptions);
      const statisticsData = await statisticsResponse.json();

      let wrapper = document.createElement('div');
      wrapper.className = 'wrapper';

      if(Array.isArray(statisticsData) && statisticsData.length) {

        let statHeader = document.createElement('h2');
        statHeader.textContent = 'Colors statistics:'
        let statList = document.createElement('ul');

        statisticsData.sort( (a, b) => a.ord - b.ord).forEach( item => {
          let li = document.createElement('li');
          li.textContent = `${item.code}: ${item.count}`;
          statList.append(li);
        });

        wrapper.append(statHeader, statList);
      }
      else {
        let errorMessage = document.createElement('h2');
        errorMessage.textContent = 'Voting is unavaliable at the moment.'
        wrapper.append(errorMessage);
      };

      app.append(wrapper);
    }
    else {
      alert("Vote hasn't been accepted. Please, fill the form again.");
      getInitPageInfo();
    }
  }
  catch (error) {
    console.error(`Error message: ${error.message}`);
  }
};