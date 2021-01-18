import React from 'react';
import PropTypes from 'prop-types';

import '../../styles/ResponseView.scss';

class ResponseView extends React.PureComponent {

  static propTypes = {
    responseData: PropTypes.arrayOf(PropTypes.shape({
      status: PropTypes.string,
      headers: PropTypes.shape,
      body: PropTypes.any,
    })),
  };

  constructor(props) {
    super(props);
    this.blockClassName = 'ResponseView';

  };


  render(){
    const {
      blockClassName,
      props:{
        responseData
      }
    } = this;
    return (
      <div className = {`${blockClassName}`}>
        <h3 className = {`${blockClassName}__block-name`}>Status:
          <span className = {`${blockClassName}__status ${
            (responseData.status >= 200 && responseData.status <= 299)
              ? 'green'
              : (responseData.status >= 300 && responseData.status <= 399)
                ? 'blue'
                : (responseData.status >= 400 && responseData.status <= 499)
                  ? 'red'
                  : (responseData.status >= 500 && responseData.status <= 599)
                    ? 'yellow' : ''}`}>
            {responseData.status}
          </span>
        </h3>
        {
          responseData.headers.length &&
          <React.Fragment>
            <h3>Headers:</h3>
            <ul className = {`${blockClassName}__headers-list`}>
            {responseData.headers.map( (header, index) =>
              <li
                key = {index}
                className = {`${blockClassName}__headers-list-item`}
              >
                <span  className = {`${blockClassName}__header-name`}>{`${header.name}: `}</span>
                <span>{`${header.value}`}</span>
              </li>
            )}
          </ul>
          </React.Fragment>

        }
        <textarea>{responseData.body}</textarea>
      </div>
    )
  }
}

export default ResponseView;