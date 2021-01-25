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

  cbAddNewRequest = () => {
    this.cbChooseRequest(null);
  };

  cbSaveRequest = async (requestData) => {
    if(requestData.presavedRequest)
      alert("Can't change presaved request");
    else
      this.setState({
        requests: await this.fetchSaveRequest(requestData, 'ADD'),
      });
  };

  cbDeleteRequest = async (requestData) => {
    if(requestData.presavedRequest)
      alert("Can't delete presaved request");
    else
      this.setState({
        requests: await this.fetchSaveRequest(requestData, 'DELETE'),
        requestChosenName: null,
      });
  };

  fetchSaveRequest = async (requestData, action) => {
    try {
      let fetchOptions = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
        },
        body: JSON.stringify({requestData, action}),
      };

      let response = await fetch('/save-request', fetchOptions);
      let data = await response.json();
      if(data.errorCode === "0") {
        return data.data;
      }
      else {
        console.error(`errorCode: ${data.errorCode}, errorMessage: ${data.errorMessage}`);
        alert(data.errorMessage)
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
      if(data.errorCode === "0") {
        return data.data;
      }
      else {
        console.error(`errorCode: ${data.errorCode}, errorMessage: ${data.errorMessage}`);
        alert(data.errorMessage);
      }
    }
    catch (err) {
      console.error(`fetch failed ${err}`);
    };
    return null;
  };

  render(){
    const {
      blockClassName,
      cbChooseRequest,
      cbAddNewRequest,
      cbSaveRequest,
      cbSendRequest,
      cbDeleteRequest,
      changePresavedRequestsStatus,
      state: {
        requests,
        requestChosenName,
        showPresavedRequests,
        responseData,
      }
    } = this;

    return (
      <div className = {`${blockClassName}`}>
        <div className = {`${blockClassName}__controls`}>
          <div className = {`${blockClassName}__filter`}>
            <input type = 'checkbox' id = 'isPresavedRequests' checked = {showPresavedRequests} onChange = {changePresavedRequestsStatus}/>
            <label htmlFor = 'isPresavedRequests'>Show presaved requests</label>
          </div>
        </div>
        <div className = {`${blockClassName}__requests-data`}>
          <RequestsList
            requests = {showPresavedRequests ? requests : requests.filter(request => !request.presavedRequest)}
            currentRequest = {requestChosenName}
            cbChooseRequest = {cbChooseRequest}
          />
          <div className = {`${blockClassName}__request`}>
            <RequestForm
              request = {requests.find(request => request.requestName === requestChosenName) }
              cbSaveRequest = {cbSaveRequest}
              cbSendRequest = {cbSendRequest}
              cbAddNewRequest = {cbAddNewRequest}
              cbDeleteRequest = {cbDeleteRequest}
            />
            { responseData && <ResponseView responseData = {responseData}/>}
          </div>
        </div>
      </div>
    )
  }
};

export default App;