import React from 'react';
import BodyClassName from 'react-body-classname';
import QRCode from 'qrcode.react';
import {hideStyle} from '../../utils/JSXRenderUtils';
import PureRenderComponent from '../../components/PureRenderComponent';
import {ECC} from '../../utils/crypto';
import SocketManager, {SOCKET_EVENTS} from '../../core/socket/SocketManager';
import {loginCreateEccKeyCmd,loginOnUserNtfCmd,loginOnTokenNtfCmd,clearAllStoreCmd} from '../../core/commands/LoginCommands';
import {WebLoginQrCodePB} from '../../core/protos/protos';
import exposeLocale from '../../components/exposeLocale';
import './LoginPage.less';


var qrCodeTimeIntervalHandler = null;


@exposeLocale()
export default class LoginPage extends PureRenderComponent {

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            qrCodeString:null,
            isQrCodeExpired:false //二维码是否过期
        };
    }


    startQrCodeTimeInterval =()=>{
        if(qrCodeTimeIntervalHandler){
            clearTimeout(qrCodeTimeIntervalHandler);
        }

        qrCodeTimeIntervalHandler = setTimeout(()=>{
            this.setState({isQrCodeExpired:true});
        },3 * 60 * 1000); //3 分钟
    };


    _handleRpcNotify = response => {

        if (response.method === 'loginKey') {
            const toBuffer = intArray => new Uint8Array(intArray).buffer;
            const loginKey = response.param;

            const ecc = new ECC();
            const pub_key = ecc.getPublicKey();
            const pri_key = ecc.getPrivateKey();

            const webLoginQrCodePB = new WebLoginQrCodePB({
                login_key: loginKey,
                pub_key: toBuffer(pub_key),
                pri_key: toBuffer(pri_key)
            });

            if (__DEV__) {
                //用户模拟客户端APP登录,只在开发时有效
                localStorage.setItem("current_login_key", loginKey);
                localStorage.setItem("current_login_pub_key", JSON.stringify(pub_key));
                //window.open("/LoginConfirmSimulate", '_loginSimulate', 'height=500,width=1000,scrollbars=no,location=no');
            }

            this.setState({
                qrCodeString: webLoginQrCodePB.encode64()
            });

            this.startQrCodeTimeInterval();

            loginCreateEccKeyCmd({loginPublicKey: pub_key,loginPrivateKey:pri_key});
        }


        if(response.method==='LoginUserNtf'){
            const userInfo = response.param;
            const uid = userInfo.uid.toString();
            const avatar = userInfo.avatar;
            const lang  = userInfo.lang;
            loginOnUserNtfCmd({uid: uid, avatar: avatar, loginLang: lang});
        }

        if(response.method==='LoginTokenNtf'){

            //如果之前登陆过,清除掉之前的JS缓存数据
            clearAllStoreCmd(false);

            const loginTokenInfo = response.param;
            const uid = loginTokenInfo.uid.toString();
            const token = loginTokenInfo.token;
            loginOnTokenNtfCmd({uid:uid,token:token,loginVersion:loginTokenInfo.version});
            this.context.router.push('/');
        }

    };


    componentDidMount() {
        SocketManager.on(SOCKET_EVENTS.ON_RPC_NOTIFY, this._handleRpcNotify);
        SocketManager.openUnauthWebSocket();
    }


    componentWillUnmount(){

        SocketManager.off(SOCKET_EVENTS.ON_RPC_NOTIFY, this._handleRpcNotify);

        if(qrCodeTimeIntervalHandler){
            clearTimeout(qrCodeTimeIntervalHandler);
            qrCodeTimeIntervalHandler = null;
        }
    }


    _refreshQrCode=()=>{
        SocketManager.openUnauthWebSocket();
        this.setState({ qrCodeString: null,isQrCodeExpired:false});
    };

    //判断除chrome以外的浏览器
    isNotChrome() {
        var userAgent = navigator.userAgent;
        if (userAgent.indexOf("Chrome") === -1){
            return true;
        }

    }


    render() {

        var {qrCodeString,isQrCodeExpired,locale} = this.state;
        let isNotChrome = this.isNotChrome();

        return (
            <BodyClassName className="in-login-page">
                <div className="LoginPage">
                    <div className="bg">
                        <div className="header">
                            <div className="logo">
                                <div className="icon-soma" />
                                <div className="title">SOMA</div>
                            </div>
                        </div>
                        <div className="blank"></div>
                    </div>

                    <div className="content">
                        <div className="qrcode-wrapper" >
                            {
                                qrCodeString?
                                    <div className="qrcode-display" >
                                        <QRCode value={qrCodeString} size={240} />
                                        <div className="qrcode-refresh" style={hideStyle(!isQrCodeExpired)} onClick={this._refreshQrCode}>
                                            <div className="ball">
                                                <div className="refresh-icon"></div>
                                                <div className="refresh-text">{locale['baba_web_code_refresh']}</div>
                                            </div>
                                        </div>
                                    </div>:
                                    <div className="qrcode-loading">
                                        <div className="qrcode-loading-img"></div>
                                    </div>
                            }
                        </div>
                        <div className="tips1">{locale['baba_web_sign_in']}</div>
                        <div className="tips2">{locale['baba_web_code_scan_tip']}</div>
                        {isNotChrome && <div className="compatibility-notes">For a greater experience, we recommend using the Google Chrome browser to access SOMA Web.</div>}
                    </div>
                </div>
            </BodyClassName>
        );
    }
}
