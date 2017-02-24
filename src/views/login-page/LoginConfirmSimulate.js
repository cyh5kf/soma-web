import React from 'react';
//import QRCode from 'qrcode.react';
//import Long from 'long';
import PureRenderComponent from '../../components/PureRenderComponent';
import binaryUtils from '../../utils/binaryUtils';
//import {ECC} from '../../utils/crypto';
import SocketManager, {SOCKET_EVENTS} from '../../core/socket/SocketManager';
//import {WebLoginQrCodePB,WebLoginCheckRequest,WebLoginConfirmRequest,UserEccPB} from '../../core/protos/protos';
import './LoginPage.less';



if(__DEV__){


    window.appWebLoginConfirm = function(uid,token,testCount) {

        SocketManager.openAuthWebSocket(uid,token);
        SocketManager.on(SOCKET_EVENTS.ON_OPEN, function(){

            var currentLoginKey = localStorage.getItem("current_login_key");
            var currentLoginPubKeyJSON = localStorage.getItem("current_login_pub_key");

            var currentLoginPubKeyIntArray = JSON.parse(currentLoginPubKeyJSON);
            var currentLoginPubKeyBuffer = binaryUtils.arrayToArrayBuffer(currentLoginPubKeyIntArray);

            SocketManager.rpcRequest("weblogin.webLoginCheck", {
                uid: testCount,
                login_key: currentLoginKey
            }).then(function () {
                console.log('webLoginCheck success');
                //切换ECC公钥
                SocketManager.rpcRequest('accountproxy.updateUserEcc', {
                    uid: testCount,
                    userEccPB: {
                        uid: testCount,
                        version: Date.now().toString(),
                        expired: (Date.now() + 1000*60*60*24 * 365*2).toString(),//两年后
                        pubkeypem: currentLoginPubKeyBuffer
                    }
                }).then(() => {
                    console.log('updateUserEcc success');
                    return SocketManager.rpcRequest("weblogin.webLoginConfirm", {
                        uid: testCount,
                        login_key: currentLoginKey
                    });
                }).then(() => {
                    alert('login success');
                    window.close();
                });
            });

        });

    }
}

export default class LoginConfirmSimulate extends PureRenderComponent {
    appWebLoginConfirm(a,b,c){
        window.appWebLoginConfirm(a,b,c)
    }
    render() {
        return (
            <div className="LoginConfirmSimulate">
                使用Chrome Console 执行:appWebLoginConfirm(uid,token,testAccount);

                <p>
                    <button onClick={this.appWebLoginConfirm.bind(this,'14302002401','70a86bbfea6d46a5b55954b7e1df21a5','8613676468643')}>luanhaipeng登录</button>
                    appWebLoginConfirm('14302002401','70a86bbfea6d4695b55954b7e1df2135','8613676468643')
                </p>

                <p>
                    <button onClick={this.appWebLoginConfirm.bind(this,'12087406085','70a86bbfea6d46c5b55954b7e1df99c6','8613668688989')}>chenyu登录</button>
                    appWebLoginConfirm('12087406085','70a86bbfea6d4695b55954b7e1df1037','8613668688989')
                </p>

                <p>
                    <button onClick={this.appWebLoginConfirm.bind(this,'13162584116','70a86bbfea6d46b5b55954b7e1df10b7','423660234567')}>jiangyunfei登录</button>
                    jiangyunfei:<br/>
                    appWebLoginConfirm('13162584116','70a86bbfea6d4695b55954b7e1df9976','423660234567')
                </p>
            </div>
        );
    }
}

