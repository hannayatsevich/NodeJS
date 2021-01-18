import React from 'react';
import PropTypes from 'prop-types';

import '../../styles/RequestsForm.scss';

class RequestsForm extends React.Component {

  static propTypes = {
    request:PropTypes.shape({
      requestName: PropTypes.string,
      requestUrl: PropTypes.string,
      requestMethod: PropTypes.string,
    }),
    cbSaveRequest: PropTypes.func.isRequired,
    cbSendRequest: PropTypes.func.isRequired,
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
        body: '',//'' or []
      }
    };

    this.methods = [
      'GET', 'POST',
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
    //if(prevRequest !== curRequest)
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
      console.log(key === blockName)
      if(key === blockName)
        request.requestData[key].push({name: '', value: ''});
      console.log(request.requestData[key])
    }
    this.setState({
      request,
    });
  };

  onBlurInput = (e, blockChosen, index, key) => {
    console.log(e.target)
  };

  onChangeInput = (e, blockChosen, index, key) => {
    console.log(e.target)
    console.log(blockChosen)
    console.log(index)
    console.log(key)

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
    }
    else {
      this.setState({
        request: {...this.state.request, [e.target.name]: e.target.value},
      });
    }
  };

  saveRequest = () => {
    this.props.cbSaveRequest(this.state.request);
  };
  sendRequest = () => {
    this.props.cbSendRequest(this.state.request);
  };

  render(){
    const {
      blockClassName,
      changeBlock,
      addNewKeyValue,
      onBlurInput,
      onChangeInput,
      saveRequest,
      sendRequest,
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

    console.log('RequestsForm', request)
    if(!request) return null;

    return (
      <div className = {`${blockClassName}`}>
        <div className = {`${blockClassName}__general`}>
          <label htmlFor = 'requestName'>Request Name</label>
          <input type = 'text' value = {request.requestName} name = {'requestName'} id = 'requestName' onChange = {onChangeInput}/>
          <br/>
          <label htmlFor = 'requestMethod'>Method</label>
          <select id = 'requestMethod' value = {request.requestMethod} onChange = {onChangeInput}>
            {methods.map( (method, index) =>
              <option key = {index}>{method}</option>
            )}
          </select>
          <br/>
          <label htmlFor = 'requestUrl'>Url</label>
          <input type = 'text' value = {request.requestUrl} name = {'requestUrl'} id = 'requestUrl' onChange = {onChangeInput}/>
        </div>
        <ul className = {`${blockClassName}__blocks-names`}>
          {blocks.map( (block, index) =>
            <li
              key = {index}
              className = {`${blockClassName}__block-name`}
              onClick = {() => changeBlock(block)}
            >
              {block}
            </li>
          )}
        </ul>
        <div className = {`${blockClassName}__block-content`}>
          { (blockChosen === 'params' || blockChosen === 'headers') &&
            <ul>
              {request.requestData[blockChosen].map( (item, index) => {
                return <li key = {index}>
                  <input type = 'text' value = {item.name} onChange = {(e) => onChangeInput(e, blockChosen, index, 'name')}/>
                  <input type = 'text' value = {item.value} onChange = {(e) => onChangeInput(e, blockChosen, index, 'value')}/>
                </li>
              })}
            </ul>
          }
          {blockChosen === 'params' && <p onClick = {() => addNewKeyValue(blockChosen)}>Add param</p>}
          {blockChosen === 'headers' && <p onClick = {() => addNewKeyValue(blockChosen)}>Add header</p>}
        </div>

        <div className = {`${blockClassName}__buttons`}>
          <button className = {`${blockClassName}__save ${request.presavedRequest ? 'disabled' : ''}`}
                  onClick = {request.presavedRequest ? null : saveRequest}>Save request</button>
          <button className = {`${blockClassName}__send`} onClick = {sendRequest}>Send Request</button>
        </div>
      </div>
    )
  }
}

export default RequestsForm;