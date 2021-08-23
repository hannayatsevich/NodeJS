import React from 'react';
import FilesStorageInterface from "./FilesStorageInterface";
import Authorization from "./Authorization";

class App extends React.PureComponent {

  pageTitle = 'Files Storage';
  constructor(props){
    super(props);

    this.state = {
      isAuthDataChecked: false,
      isAuthorized: false,
      authRolesArray: [],

      isLogIn: true,
      formMessage: '',
      login: '',
    }
  };

  componentDidMount () {
    this.getAuthRolesData()
        .then( stateStatus => this.setState({...stateStatus}));
  };

  changeAuthForm = () => {
    this.setState({
      isLogIn: !this.state.isLogIn,
    })
  }

  getAuthRolesData = async (isLogIn = true) => {
    let fetchOptions = {
      url: '/get-auth-roles',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'auth-token-string': localStorage.getItem('files_storage_auth_token') || '',
      },
    };

    let stateStatus = {};

    try {
      let response = await fetch(fetchOptions.url, fetchOptions);

      if(response.status === 401) {
        stateStatus = {
          isAuthDataChecked: true,
          isAuthorized: false,
          authRolesArray: [],
          login: '',
        }
      }
      else {
        let responseData = await response.json();
        if(responseData.errorCode === 0) {
          stateStatus = {
            isAuthDataChecked: true,
            isAuthorized: true,
            authRolesArray: responseData.data.userRoles,
            login: responseData.data.login,
          }
          this.setTitle(responseData.data.login);
        }
        else {
          console.warn(`errorCode: ${responseData.errorCode}, errorMessage: ${responseData.errorMessage}`);
          stateStatus = {
            isAuthDataChecked: true,
            isAuthorized: false,
            authRolesArray: [],
            login: '',
          }
        }
      }
    }
    catch (error) {
      console.warn(`fetch failed ${JSON.stringify(error)}`);
    }

    return stateStatus;
  };

  authorise = async (credentials) => {
    const {isLogIn} = this.state;

    let fetchOptions = {
      url: isLogIn ? '/log-in' : '/sign-up',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(credentials),
    };

    let stateStatus = {};

    try {
      let response = await fetch(fetchOptions.url, fetchOptions);
      let responseData = await response.json();
      if(responseData.errorCode === 0 && isLogIn) {
        localStorage.setItem('files_storage_auth_token', responseData.data.token),
        stateStatus = {
          isAuthDataChecked: true, //
          isAuthorized: true,
          login: responseData.data.login,
          authRolesArray: responseData.data.userRoles,
          formMessage: '',
        }
        this.setTitle(responseData.data.login)
      }
      else if(responseData.errorCode === 0) {
            stateStatus = {
              isAuthDataChecked: true, //
              isAuthorized: false,
              formMessage: 'You were send the confirmation letter, please, check your email box',
            }
        this.setTitle(responseData.data.login)
      }
      else {
          stateStatus = {
            isAuthDataChecked: true, //
            isAuthorized: false,
            login: '',
            authRolesArray: [],
            formMessage: responseData.errorMessage
          }
      }
    }
    catch (error) {
      console.warn(`fetch failed ${JSON.stringify(error)}`);
    };

    //return stateStatus;
    this.setState(stateStatus)
  }

  setTitle = (login) => {
    if(login)
      document.title = this.pageTitle + ' - ' + login;
    else document.title = this.pageTitle;
  }

  exit = () => {
    localStorage.removeItem('files_storage_auth_token');
    this.setTitle();
    this.setState({
      isAuthorized: false,
      authRolesArray: [],
      isLogIn: true,
    })
  }

  render(){
    const {
      changeAuthForm,
      authorise,
      exit,
      state: {
        isAuthDataChecked,
        isAuthorized,
        authRolesArray,

        isLogIn,
        formMessage,
      }
    } = this;

    if(!isAuthDataChecked)
      return <div>Checking...</div>
    else if( !isAuthorized)
      return <Authorization
        isLogIn={isLogIn}
        cbAuthorise={authorise}
        cbChangeAuthForm={changeAuthForm}
        formMessage={formMessage}
      />
    else if(authRolesArray.length)
      return <FilesStorageInterface
          authRoles={authRolesArray}
          cbExit={exit}
      />
    else return<div>You have no access to data</div>
  }
};

export default App;