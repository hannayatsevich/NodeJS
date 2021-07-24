import React from 'react';

import './ModalWindow.scss';

class ModalWindow extends React.PureComponent {

  constructor(props){
    super(props)
    this.blockClassName = 'ModalWindow';

    this.state = {
    }
  };

  close = () => {
    if(this.props.cbClose) {
      this.props.cbClose();
    }
  };

  render(){
    const {
      blockClassName,
      close,
      props: {
        isOpened,
        children,
      },
      state: {
      }
    } = this;


    if(!isOpened)
      return null;

    return (
      <div
        className = {`${blockClassName} position-absolute top-0 bottom-0 start-0 end-0 w-100 h-100 bg-light d-flex justify-content-center align-items-center`}
        onClick = {close}
      >
        <div
          className = {`${blockClassName}__content p-4 bg-white border border-1 border-secondary rounded`}
          onClick = { (e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    )
  }
};

export default ModalWindow;