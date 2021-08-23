import React from 'react';
import ModalWindow from './ModalWindow';

import '../../styles/FilesStorageInterface.scss';

class FilesStorageInterface extends React.PureComponent {

    blockClassName = 'FileStorage';

    filesInput = null;
    commentInput = null;

    progressBarRef = null;
    progressBarNumRef = null;

    clientId = 0;
    isWSConnectionSet = false;

    constructor(props){
        super(props);

        this.state = {
            isLoadWindowOpened: false,
            isFileExceed: false,
            isUploadError: false,
            isUploadSuccess: false,
            filesArray: [],
            clientId: 0,
        }
    };

    componentDidMount () {
        this.getFilesData()
            .then( result => this.setState({filesArray: result}));
    };

    getFilesData = async () => {
        let fetchOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
                'auth-token-string': localStorage.getItem('files_storage_auth_token') || '',
            },
        };

        let filesArray = [];

        try {
            let response = await fetch('/get-files', fetchOptions);
            if(response.status === 401) {
                this.props.cbExit();
            }
            else {
                let responseData = await response.json();

                if(responseData.errorCode === 0) {
                    filesArray = responseData.data;
                }
                else {
                    console.warn(`errorCode: ${responseData.errorCode}, errorMessage: ${responseData.errorMessage}`);
                }
            }

        }
        catch (error) {
            console.warn(`fetch failed ${error}`);
        };

        return filesArray;
    };

    checkConnection = async () => {
        const check = async () => {
            if(this.isWSConnectionSet && this.clientId) {
                await this.uploadFile();
            }
            else {
                await this.setWSConnection(this.uploadFile);
            }
        };

        if(this.progressBarRef) {
            this.progressBarRef.classList.remove("active");
            this.progressBarRef.style.width = `0%`;
            this.progressBarNumRef.textContent = "";
        }

        if(this.state.isUploadError || this.state.isUploadSuccess || this.state.isFileExceed) {
            this.setState({
                isFileExceed: false,
                isUploadError: false,
                isUploadSuccess: false,
            }, async () => {
                await check();
            })
        }
        else await check();
    };

    setWSConnection = async (callbackOnGetId) => {
        const url = `ws://${location.hostname}:5698`;
        let connection = new WebSocket(url); // сокет-соединение с сервером
        let self = this;

        connection.onopen = (event) => {
            connection.send('hello from client to server!'); // можно послать строку, Blob или ArrayBuffer
            self.isWSConnectionSet = true;
        };

        connection.onmessage = function (event) {// сработает, когда сервер пришлёт какое-либо сообщение
            // console.log('клиентом получено сообщение от сервера: ', event);

            let wsData = event.data;
            if(event.data.indexOf('id:') === 0) {
                self.clientId = +wsData.split('id:')[1];
                if(callbackOnGetId)
                    callbackOnGetId();
            }
            if(event.data.indexOf('percent:') === 0) {
                if(self.progressBarRef) {
                    let percent = wsData.split('percent:')[1];
                    if(!self.progressBarRef.classList.contains("active") && percent !== '0')
                        self.progressBarRef.classList.add("active");
                    self.progressBarRef.style.width = `${percent}%`;
                    self.progressBarNumRef.textContent = `${percent}%`;
                }
            }
        }

        connection.onerror = error => {
            // console.log('WebSocket error:', error);
        };

        connection.onclose = () => {
            // console.log("соединение с сервером закрыто");
            connection = null;
            self.isWSConnectionSet = false;
            clearInterval(keepAliveTimer);
        };

        // чтобы сервер знал, что этот клиент ещё жив, будем регулярно слать ему сообщение
        let keepAliveTimer = setInterval(() => {
            connection.send('KEEP_ME_ALIVE');
        },5000);
    };

    uploadFile = async  () => {
        // загружать данные будем через форму
        // при таком способе сам файл передаётся в перемешку с полями из формы
        // по идее в целом можно было бы отправлять по кнопке submit, вышло бы то же самое <form action="" method="post" enctype="multipart/form-data">
        // но так как нам нужно связать передачу файла HTTP-запросом и мониторить процесс загрузки через websockets, мы должны связать неким идентификатором эти два процесса
        // поэтому здесь данные для передачи с Content-Type: multipart/form-data нужно оформить в виде FormData
        // передавать при этом в заголовках Content-type не нужно, иначе на сервере ошибку выдает

        let formData = new FormData();
        formData.append("comment", this.commentInput.value || '');
        formData.append("clientId", this.clientId);
        formData.append("filedata", this.filesInput.files[0]);

        if(this.filesInput.files[0]) {
            let fetchOptions = {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    // 'Content-type': 'multipart/form-data',
                    'auth-token-string': localStorage.getItem('files_storage_auth_token') || '',
                },
                body: formData,
            };

            try {
                let response = await fetch('/upload-file', fetchOptions);
                if(response.status === 401) {
                    this.props.cbExit();
                }
                else {
                    let responseData = await response.json();
                    if (responseData.errorCode === 0) {
                        this.setState({
                            isUploadSuccess: true,
                        });
                    } else if (responseData.errorCode === 2) {
                        this.setState({
                            isFileExceed: true,
                        });
                    } else {
                        this.setState({
                            isUploadError: true,
                        });
                    }
                }
            }
            catch (error) {
                console.warn(`fetch failed: ${error}`);
                this.setState({
                    isUploadError: true,
                });
            };
        }
    };

    manageLoadWindow = (value) => {
        this.setState({
            isLoadWindowOpened: value,
        }, () => {
            if(!this.state.isLoadWindowOpened)
                this.setState({
                    isFileExceed: false,
                    isUploadError: false,
                    isUploadSuccess: false,
                });
            this.getFilesData()
                .then( result => this.setState({filesArray: result}));
        });
    };

    uploadFileInputChange = () => {
        if(this.progressBarRef) {
            this.progressBarRef.classList.remove("active");
            this.progressBarRef.style.width = `0%`;
            this.progressBarNumRef.textContent = "";
        }
        this.setState({
            isFileExceed: false,
            isUploadError: false,
            isUploadSuccess: false,
        })
    };

    render(){
        const {
            blockClassName,
            manageLoadWindow,
            checkConnection,
            uploadFileInputChange,
            props:{
                authRoles,
                cbExit,
            },
            state: {
                isLoadWindowOpened,
                isFileExceed,
                isUploadError,
                isUploadSuccess,
                filesArray,
            }
        } = this;

        return (
            <React.Fragment>
                { isLoadWindowOpened &&
                <ModalWindow
                    isOpened={isLoadWindowOpened}
                    cbClose={() => manageLoadWindow(false)}
                >
                    <div>
                        <form className = {`${blockClassName}__form d-flex flex-column `}>
                            { isUploadSuccess && <div className = {`${blockClassName}__message mb-3 text-success`}>File uploaded successfully</div>}
                            { isFileExceed && <div className = {`${blockClassName}__message mb-3 text-danger`}>File exceeds 50MB, please, choose another one</div>}
                            { isUploadError && <div className = {`${blockClassName}__message mb-3 text-danger`}>UploadError, please, try one more time</div>}
                            <label htmlFor='uploadedFile' >File</label>
                            <input type = 'file' name = 'uploadedFile' id = 'uploadedFile' ref = { (el) => this.filesInput = el} onChange={uploadFileInputChange}/>
                            <label className = 'mt-3' htmlFor='comment' >Comment</label>
                            <textarea type = 'text' name = 'comment' id = 'comment' ref = { (el) => this.commentInput = el}  style={{minHeight: '200px'}}  className = 'p-3'/>
                            <div className = {`${blockClassName}__progress-bar-wrapper w-100 mt-3`}>
                                <div
                                    className = {`${blockClassName}__progress-bar bg-success h-100`}
                                    style = {{width: `0%`}}
                                    ref={el => this.progressBarRef = el}
                                />
                            </div>
                            <div className = {`${blockClassName}__progress-bar-num mt-3 text-center`} ref={el => this.progressBarNumRef = el}/>
                            <button
                                type = 'button'
                                onClick = {checkConnection}
                                className = 'btn btn-secondary mt-3'
                            >
                                Upload
                            </button>
                            <button
                                type = 'button'
                                onClick = { () => manageLoadWindow(false) }
                                className = 'btn btn-outline-secondary mt-3'
                            >
                                Close
                            </button>
                        </form>
                    </div>

                </ModalWindow>
                }
                <div className = {`${blockClassName}`}>
                    <div className = {`container`}>
                        <div className = {`${blockClassName}__buttons pt-3 pb-3 border border-dark border-top-0 border-left-0 border-right-0`}>
                            <button className = 'btn btn-secondary' onClick = { cbExit } >
                                Exit
                            </button>
                        </div>
                        {authRoles.indexOf('redactor') > -1 &&
                            <div
                                className={`${blockClassName}__buttons pt-3 pb-3 border border-dark border-top-0 border-left-0 border-right-0`}>
                                <button
                                    className='btn btn-secondary'
                                    onClick={() => manageLoadWindow(true)}
                                >
                                    Add file
                                </button>
                            </div>
                        }
                        <div className = {`${blockClassName}__files pt-3 pb-3`}>
                            <h3 className = 'mb-5'>Files</h3>
                            {filesArray.length
                                ? <div className = {`${blockClassName}__files-list`}>
                                    {filesArray.map( (file, index) => {
                                        if(file)
                                            return (
                                                <div key={index} className = {`${blockClassName}__file-item mb-4 p-3 border border-dark rounded-lg`}>
                                                    <div>File: <a href = {`/download-file/${file.storedFileName}`}>{`${file.originalFileName}`}</a></div>
                                                    {!!file.comment && <div>{`Comment: ${file.comment}`}</div>}
                                                </div>
                                            )
                                    })}
                                </div>
                                : <p>There is no one file uploaded</p>
                            }
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
};

export default FilesStorageInterface;