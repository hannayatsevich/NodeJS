import React from 'react';
import PropTypes from 'prop-types';

import '../../styles/RequestsList.scss';

class RequestsList extends React.PureComponent {

  static propTypes = {
    requests: PropTypes.arrayOf(PropTypes.shape({
      requestName: PropTypes.string,
      requestUrl: PropTypes.string,
      requestMethod: PropTypes.string,
    })),
    currentRequest: PropTypes.string,
    cbChooseRequest: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.blockClassName = 'SavedRequestsList';

  };

  chooseRequest = (url) => {
    if(this.props.cbChooseRequest)
      this.props.cbChooseRequest(url);
  };

  render(){
    const {
      blockClassName,
      chooseRequest,
      props:{
        requests,
        currentRequest,
      }
    } = this;
    return (
      <div className = {`${blockClassName}`}>
        <ul className = {`${blockClassName}__list`}>
          { (!!requests && !!requests.length) && requests.map( (request, index) =>
            <li
              key = {index}
              className = {`${blockClassName}__list-item ${request.requestMethod.toLowerCase()} ${currentRequest === request.requestName ? 'active' : ''}`}
              onClick = {() => chooseRequest(request.requestName)}
            >
              <p>{request.requestName}</p>
              <p>{request.requestUrl}</p>
              <p>{request.requestMethod}</p>
            </li>
          )}
        </ul>
      </div>
    )
  }
}

export default RequestsList;