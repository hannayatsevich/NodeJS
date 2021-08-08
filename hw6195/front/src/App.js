import React from 'react';

import './App.scss';

class App extends React.PureComponent {

  constructor(props){
    super(props);

    this.state = {
      textValue: '',
      textValuesHistory: [],
      databases: [],
      databaseSelected: '',
      errorMessage: '',
      results: null,
    }
  };

  componentDidMount () {
    this.getDatabases()
        .then( data => this.setState({ databases: data,  databaseSelected: data[0]}) );
  };

  getDatabases = async () => {
    let fetchOptions = {
      url: '/get-databases',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      }
    };

    let result = [];

    try {
      let response = await fetch(fetchOptions.url, fetchOptions);
      let responseData = await response.json();
      console.log(responseData)
      if(responseData.errorCode === 0) {
        result = responseData.data;
      }
      else {
        console.warn(`errorCode: ${responseData.errorCode}, errorMessage: ${responseData.errorMessage}`);
      }
    }
    catch (error) {
      console.warn(`fetch error occured: ${error}`);
    }
    return result;
  };

  setValue = (e) => {
    this.setState({
      textValue: e.currentTarget.value,
    })
  };

  setOption = (e) => {
    this.setState({
      databaseSelected: e.currentTarget.value,
    })
  };

  processQuery = async() => {
    const {textValuesHistory, textValue, databaseSelected} = this.state;
    this.setState(({
      textValuesHistory: [`${databaseSelected}: ${textValue}`, ...textValuesHistory]
    }));

    let fetchOptions = {
      url: '/process-custom-query',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        database: databaseSelected,
        textQuery: textValue,
      }),
    };

    try {
      let response = await fetch(fetchOptions.url, fetchOptions);
      let responseData = await response.json();
      console.log(responseData)
      if(responseData.errorCode === 0) {
        let results;
        if(responseData.data.affectedRows !== undefined)
          results = `Query affected ${responseData.data.affectedRows} rows.`;
        else results = responseData.data;
        this.setState(({
          results,
          errorMessage: '',
        }));
      }
      else {
        console.warn(`errorCode: ${responseData.errorCode}, errorMessage: ${responseData.errorMessage}`);
        this.setState({
          results: null,
          errorMessage: responseData.errorMessage,
        })
      }
    }
    catch (error) {
      console.warn(`fetch error occured: ${error}`);
      this.setState({
        results: null,
        errorMessage: 'Error occured, please, try later.',
      })
    }
  };


  render(){
    const {
      processQuery,
      setValue,
      setOption,
      state: {
        textValue,
        textValuesHistory,
        databases,
        databaseSelected,
        errorMessage,
        results,
      }
    } = this;

    let columnNames;
    if(Array.isArray(results) && results.length)
      columnNames = Object.keys(results[0]);

    return (
        <div className={`pt-4 pb-4`}>
          <div className={'container'}>
            <h1 className={`mb-4 `}>SQLExplorer</h1>
            <form className={`mb-4`}>
              <div className={`mb-3`} >
                <label className={`form-label`} htmlFor="textareainputhistory">Queries history:</label>
                <textarea className={`form-control`} id="textareainputhistory" rows="5" defaultValue={textValuesHistory.reduce( (acc, item) => acc + item + '\n', '')} disabled/>
              </div>
              <div className={`mb-3`} >
                <label htmlFor="selectinput">Select database</label>
                <select className={`form-control w-100`} id="selectinput" onChange={setOption} value={databaseSelected}>
                  {databases.map( (item, index) => <option key={index} value={item}>{item}</option>)}
                </select>
              </div>
              <div className={`mb-3`} >
                <label className={`form-label`} htmlFor="textareainput">Enter your query here:</label>
                <textarea className={`form-control`} id="textareainput" rows="5" value={textValue} onChange={setValue}/>
              </div>
              <button className={`btn btn-success`} type="button" onClick={processQuery} disabled={!textValue}>Process</button>
            </form>
            {errorMessage
              ? <div className={`mb-3`} >
                <h2 className={`mb-4`}>Error:</h2>
                <p className={`mb-4 `}>{errorMessage}</p>
              </div>
              : results
                ? <div>
                    <h2 className={`mb-4`}>Results</h2>
                    { typeof results === 'string' && results}
                    { (Array.isArray(results) && !!results.length) &&
                      <table class="table table-hover table-light">
                        <thead class="thead-light">
                          <tr>{columnNames.map( (item,index) => <th key={index}>{item}</th>)}</tr>
                        </thead>
                        <tbody>
                          {results.map( (item, index1) => <tr key={index1}>{columnNames.map( (colitem, index2) => <td key={index2}>{item[colitem]}</td>)}</tr>)}
                        </tbody>
                      </table>
                    }
                  </div>
                 : null
            }
          </div>
        </div>
    )
  }
};

export default App;