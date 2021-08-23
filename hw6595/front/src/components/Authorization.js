import React, {Component} from 'react';
import PropTypes from 'prop-types';

class Authorization extends Component {
    static propTypes = {
        cbChangeAuthStatus: PropTypes.func,
    };

    blockClassName = 'Authorization';

    constructor(props) {
        super(props);
        this.state = {
            formFieldsValues: {
                email: '',
                login: '',
                psw: '',
            },
        };
    }

    setInputValue = (e) => {
        this.setState({
            formFieldsValues: {
                ...this.state.formFieldsValues,
                [e.target.name]: e.target.value,
            },
        })
    };

    onBtnClick = () => {
        const {
            props: { cbAuthorise },
            state: { formFieldsValues}
        } = this;
        if(cbAuthorise) cbAuthorise(formFieldsValues);
    }

    render() {

        const {
            blockClassName,
            setInputValue,
            onBtnClick,
            props: {
                isLogIn,
                formMessage,
                cbChangeAuthForm,
            },
            state: {
                formFieldsValues,
            }
        } = this;

        return (
            <div className = {`${blockClassName} position-absolute top-0 bottom-0 start-0 end-0 w-100 h-100 bg-light d-flex justify-content-center align-items-center`}>
                <div className = {`p-4 bg-white border border-1 border-secondary rounded`} >
                    <h2 className={`mb-4 `}>{isLogIn? 'Log in' : 'Sign up'}</h2>
                    { !!formMessage && <p className={`mb-2 `}>{formMessage}</p>}
                    <form className={`mb-4`}>
                        { !isLogIn &&
                            <div className={`mb-3`} >
                                <label className={`form-label`} htmlFor="email">email</label>
                                <input className={`form-control`} id="email" name = 'email' onChange={setInputValue} value={formFieldsValues.email}/>
                            </div>
                        }
                        <div className={`mb-3`} >
                            <label className={`form-label`} htmlFor="login">login</label>
                            <input className={`form-control`} id="login" name = 'login' onChange={setInputValue} value={formFieldsValues.login}/>
                        </div>
                        <div className={`mb-3`} >
                            <label className={`form-label`} htmlFor="psw">Password</label>
                            <input className={`form-control`} id="psw" name = 'psw' onChange={setInputValue} value={formFieldsValues.psw}/>
                        </div>
                        <button className={`btn btn-success`} type="button" onClick={onBtnClick} disabled={ isLogIn ? !formFieldsValues.login || !formFieldsValues.psw : !formFieldsValues.login || !formFieldsValues.psw || !formFieldsValues.email }>{isLogIn? 'Log in' : 'Sign up'}</button>
                    </form>
                    <button type="button" className={`btn btn-link`} onClick={cbChangeAuthForm}>{isLogIn? 'Sign up' : 'Log in'}</button>
                </div>
            </div>
        );
    }
}

export default Authorization;