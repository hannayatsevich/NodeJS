import React from 'react';
import PropTypes from 'prop-types';

import '../../styles/RequestForm.scss';

class RequestsForm extends React.Component {

  static propTypes = {
    request:PropTypes.shape({
      requestName: PropTypes.string,
      requestUrl: PropTypes.string,
      requestMethod: PropTypes.string,
    }),
    addNewRequest: PropTypes.func.isRequired,
    cbSaveRequest: PropTypes.func.isRequired,
    cbSendRequest: PropTypes.func.isRequired,
    cbDeleteRequest: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.blockClassName = 'RequestsForm';
    this.requestTemplate = {
      requestName: 'NewRequest',
      requestMethod: 'GET',
      requestUrl: '',
      requestData: {
        params: [],
        headers: [],
        body: '',
      }
    };

    this.methods = [
      'GET', 'POST', 'PUT', 'DELETE',
    ];

    this.blocks = [
      'params', 'headers', 'body'
    ];

    this.headers = [
      'Content-Type', 'Accept',
    ];

    this.state = {
      request: props.request ? JSON.parse(JSON.stringify(props.request)) : JSON.parse(JSON.stringify(this.requestTemplate)),
      blockChosen: 'params',
    }
  };

  componentDidUpdate(prevProps, prevState) {
    let prevRequest = prevProps.request ? JSON.parse(JSON.stringify(prevProps.request)) : null;
    let curRequest = this.props.request ? JSON.parse(JSON.stringify(this.props.request)) : null;
    if(prevProps.request !== this.props.request)
      this.setState({
        request: this.props.request ? JSON.parse(JSON.stringify(this.props.request)) : JSON.parse(JSON.stringify(this.requestTemplate)),
      });
  }

  changeBlock = (blockName) => {
    this.setState({
      blockChosen: blockName,
    });
  };

  addNewKeyValue = (blockName) => {
    let request = this.state.request;
    for(let key in request.requestData) {
      if(key === blockName)
        request.requestData[key].push({name: '', value: ''});
    }
    this.setState({
      request,
    });
  };

  onBlurInput = (e, blockChosen, index, key) => {
    console.log(e.target)
  };

  onChangeInput = (e, blockChosen, index, key) => {

    if(blockChosen) {
      if(blockChosen === 'params') {
        let newRequestParams = [];
        if(this.state.request.requestData.params[index]) {
          newRequestParams = this.state.request.requestData.params.map( (param, idx) => {
            if (idx === index) {
              if (key === 'name')
                return {name: e.target.value, value: param.value};
                else return {name: param.name, value: e.target.value};
            }
            else return param;
          });
        }
        else {
          newRequestParams = [...this.state.request.requestData.params, {name: key === 'name' ? e.target.value : '', value: key === 'value' ? e.target.value : ''}]
        };
        this.setState({
          request: {...this.state.request, requestData: {...this.state.request.requestData, params: newRequestParams} }
        });
      }
      else if(blockChosen === 'headers') {
        let newRequestHeaders = [];
        if(this.state.request.requestData.headers[index]) {
          newRequestHeaders = this.state.request.requestData.headers.map( (header, idx) => {
            if (idx === index) {
              if (key === 'name')
                return {name: e.target.value, value: header.value};
                else return {name: header.name, value: e.target.value};
            }
            else return header;
          });
        }
        else {
          newRequestHeaders = [...this.state.request.requestData.headers, {name: key === 'name' ? e.target.value : '', value: key === 'value' ? e.target.value : ''}]
        };
        this.setState({
          request: {...this.state.request, requestData: {...this.state.request.requestData, headers: newRequestHeaders} }
        });
      }
      else if(blockChosen === 'body') {
        let newRequestBody = e.target.value;

        this.setState({
          request: {...this.state.request, requestData: {...this.state.request.requestData, body: newRequestBody} }
        });
      }
      else if (blockChosen === 'method') {
        this.setState({
          request: {...this.state.request, requestMethod: e.target.value},
        });
      }
      else if (blockChosen === 'url') {
        this.setState({
          request: {...this.state.request, requestUrl: e.target.value},
        });
      }
    }
    else {
      this.setState({
        request: {...this.state.request, [e.target.name]: e.target.value},
      });
    }
  };

  addNewRequest = () => {
    this.props.cbAddNewRequest();
  };

  saveRequest = () => {
    this.props.cbSaveRequest(this.state.request);
  };

  sendRequest = () => {
    this.props.cbSendRequest(this.state.request);
  };

  deleteRequest = () => {
    let answer = confirm('Are you sure you want to delete current request?');
    if(answer)
      this.props.cbDeleteRequest(this.state.request);
  };

  render(){
    const {
      blockClassName,
      changeBlock,
      addNewKeyValue,
      onBlurInput,
      onChangeInput,
      addNewRequest,
      saveRequest,
      sendRequest,
      deleteRequest,
      methods,
      blocks,
      headers,
      props:{
      },
      state: {
        blockChosen,
        request,
      }
    } = this;

    if(!request) return null;

    return (
      <div className = {`${blockClassName}`}>
        <div className = {`${blockClassName}__general`}>
          <div className = {`${blockClassName}__input-block`}>
            <label htmlFor = 'requestName'>Request Name</label>
            <input autocomplete="off" type = 'text' value = {request.requestName} name = {'requestName'} id = 'requestName' onChange = {onChangeInput}/>
          </div>
          <div className = {`${blockClassName}__input-block`}>
            <label htmlFor = 'requestUrl'>Url</label>
            <input autocomplete="off" type = 'text' value = {request.requestUrl} name = {'requestUrl'} id = 'requestUrl' onChange = {(e) => onChangeInput(e, 'url')}/>
          </div>
          <div className = {`${blockClassName}__input-block`}>
            <label htmlFor = 'requestMethod'>Method</label>
            <select id = 'requestMethod' value = {request.requestMethod} onChange = {(e) => onChangeInput(e, 'method')}>
              {methods.map( (method, index) =>
                <option key = {index}>{method}</option>
              )}
            </select>
          </div>
        </div>
        <ul className = {`${blockClassName}__blocks-names`}>
          {blocks.map( (block, index) =>
            <li
              key = {index}
              className = {`${blockClassName}__block-name ${blockChosen === block ? 'active' : ''}`}
              onClick = {() => changeBlock(block)}
            >
              {block}
            </li>
          )}
        </ul>
        <div className = {`${blockClassName}__block-content`}>
          { (blockChosen === 'params' || blockChosen === 'headers') &&
            <ul className = {`${blockClassName}__block-content-list`}>
              {request.requestData[blockChosen].map( (item, index) => {
                return <li key = {index} className = {`${blockClassName}__block-content-list-item`}>
                  <input type = 'text' value = {item.name} onChange = {(e) => onChangeInput(e, blockChosen, index, 'name')}/>
                  <input type = 'text' value = {item.value} onChange = {(e) => onChangeInput(e, blockChosen, index, 'value')}/>
                </li>
              })}
            </ul>
          }
          {blockChosen === 'params' && <p className = {`${blockClassName}__block-content-btn`} onClick = {() => addNewKeyValue(blockChosen)}>Add param</p>}
          {blockChosen === 'headers' && <p className = {`${blockClassName}__block-content-btn`} onClick = {() => addNewKeyValue(blockChosen)}>Add header</p>}
          {blockChosen === 'body' && <textarea value = {request.requestData[blockChosen]} onChange = {(e) => onChangeInput(e, blockChosen)}></textarea>}
        </div>

        <div className = {`${blockClassName}__buttons`}>
          <button className = {`${blockClassName}__button add`} onClick = {addNewRequest}>Add new request</button>
          <button className = {`${blockClassName}__button save ${request.presavedRequest ? 'disabled' : ''}`}
                  onClick = {request.presavedRequest ? null : saveRequest}>Save request</button>
          <button className = {`${blockClassName}__button send`} onClick = {sendRequest}>Send request</button>
          <button className = {`${blockClassName}__button delete ${request.presavedRequest ? 'disabled' : ''}`} onClick = {deleteRequest}>Delete request</button>
        </div>
      </div>
    )
  }
};

export default RequestsForm;