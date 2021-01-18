import React from 'react';
import RequestsList from './RequestsList';
import RequestForm from './RequestForm';
import ResponseView from './ResponseView';

import '../../styles/App.scss';

class App extends React.PureComponent {

  constructor(props){
    super(props)
    this.blockClassName = 'PostmanWindow';

    this.state = {
      requests: [],//массив сохраненных запросов
      requestChosenName: null,//имя выбранного запроса
      showPresavedRequests: true,
      responseData: null,
    }
  };

  async componentDidMount() {
    this.setState({
      requests: await this.fetchGetSavedRequests(),
    });
  };

  fetchGetSavedRequests = async () => {
    try {
      let fetchOptions = {
        method: 'get',
        headers: {
          'Accept': 'application/json',
        }
      };

      let response = await fetch('/get-saved-requests', fetchOptions);
      let data = await response.json();
      if(data.errorCode === "0")
        return data.data;
      else {
        console.error(`errorCode: ${data.errorCode}, errorMessage: ${data.errorMessage}`);
      }
    }
    catch (err) {
      console.error(`fetch failed ${err}`);
    };
    return [];
  };

  changePresavedRequestsStatus = (e) => {
    let isChosenRequestPresaved = this.state.requests.some(request => request.presavedRequest && request.requestName === this.state.requestChosenName);
    this.setState({
      showPresavedRequests: e.target.checked,
      requestChosenName: (e.target.checked && isChosenRequestPresaved) ? this.state.requestChosenName : null,
    });
  };

  cbChooseRequest = (name) => {
    if(this.state.requestChosenName !== name)
      this.setState({
        requestChosenName: name,
        responseData: null,
      });
  };

  cbSaveRequest = async (requestData) => {
    console.log(requestData)
    this.setState({
      requests: await this.fetchSavedRequest(requestData),
    });
  };

  fetchSavedRequest = async (requestData) => {
    try {
      let fetchOptions = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
        },
        body: JSON.stringify(requestData),
      };

      let response = await fetch('/save-request', fetchOptions);
      let data = await response.json();
      console.log(data)
      if(data.errorCode === "0") {
        return data.data;
      }
      else {
        console.error(`errorCode: ${data.errorCode}, errorMessage: ${data.errorMessage}`);
        alert(`errorCode: ${data.errorCode}, errorMessage: ${data.errorMessage}`)
      }
    }
    catch (err) {
      console.error(`fetch failed ${err}`);
      alert(`fetch failed ${err}`)
    };
    return [];
  };

  cbSendRequest = async (requestData) => {
    this.setState({
      responseData: await this.fetchSendRequest(requestData),
    });
  };

  fetchSendRequest = async (requestData) => {
    console.log('requestData', requestData)
    try {
      let fetchOptions = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
        },
        body: JSON.stringify(requestData),
      };

      let response = await fetch('/send-request', fetchOptions);
      let data = await response.json();
      console.log(data)
      if(data.errorCode === "0") {
        console.log('data.data', data.data)
        return data.data;
      }
      else {
        console.error(`errorCode: ${data.errorCode}, errorMessage: ${data.errorMessage}`);
      }
    }
    catch (err) {
      console.error(`fetch failed ${err}`);
    };
    return [];
  };

  render(){
    const {
      blockClassName,
      cbChooseRequest,
      cbSaveRequest,
      cbSendRequest,
      changePresavedRequestsStatus,
      state: {
        requests,
        requestChosenName,
        showPresavedRequests,
        responseData,
      }
    } = this;
    console.log('render');
    console.log('responseData', responseData);
    console.log('App', requests);
    console.log('App', requestChosenName);
    return (
      <div className = {`${blockClassName}`}>
        <div className = {`${blockClassName}__controls`}>
          <button className = {`${blockClassName}__btn-add-request`} onClick = {() => cbChooseRequest(null)}>Add new request</button>
          <div>
            <input type = 'checkbox' id = 'isPresavedRequests' checked = {showPresavedRequests} onChange = {changePresavedRequestsStatus}/>
            <label htmlFor = 'isPresavedRequests'>Show presaved requests</label>
          </div>
        </div>
        <div className = {`${blockClassName}__requests`}>
          <RequestsList
            requests = {showPresavedRequests ? requests : requests.filter(request => !request.presavedRequest)}
            cbChooseRequest = {cbChooseRequest}
          />
          <RequestForm
            request = {requests.find(request => request.requestName === requestChosenName) }
            cbSaveRequest = {cbSaveRequest}
            cbSendRequest = {cbSendRequest}
          />
        </div>
        <div className = {`${blockClassName}__response`}>
          { responseData && <ResponseView responseData = {responseData}/>}
        </div>
      </div>
    )
  }
}

export default App;