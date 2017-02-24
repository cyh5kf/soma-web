import blobUtil from 'blob-util';
import noop from 'lodash/noop';
import ReconnectingWebSocket from 'reconnectingwebsocket';
import EventBus from '../../utils/EventBus';
import warning from '../../utils/warning';
import {encodeProto, decodeProto, WebRpcMessage, WebRpcMessageType} from '../protos/protos';

const _logSocketFrames = () => localStorage.getItem('dev$$logSocketFrames') === 'true';
const _logSocketPing = () => localStorage.getItem('dev$$logSocketPing') === 'true';
window._dev = window._dev || {};
window._dev._toggleSocketFrameLogger = (logPing) => {
    localStorage.setItem('dev$$logSocketFrames', (!_logSocketFrames()).toString());
    localStorage.setItem('dev$$logSocketPing', (_logSocketFrames() && !!logPing).toString());
    console.log(_logSocketFrames() ? '启用socket记录' : '停止socket记录');
};
function tryLogSocket(socketFrame) {
    if (_logSocketFrames() && (_logSocketPing() || (socketFrame.method !== 'ping' && socketFrame.method !== 'pong'))) {
        console.debug('socket:', socketFrame);
    }
}

export const SOCKET_EVENTS = {
    ON_OPEN: 'onOpen',
    ON_CLOSE: 'onClose',
    ON_CONNECTED_CHANGE: 'onConnectedChange',
    ON_RPC_NOTIFY: 'onRpcNotify',
    TOKE_EXPIRED: 'tokenExpired'
};

const _ON_RPC_RESPONSE = '_onRpcResponse';
const wsProtocol = __DEV__ ? 'ws' : 'ws'; // 'wss'; TODO: use wss on production instead 

let nextRpcRequestId = Date.now() % (Math.pow(2, 31));


function sortNotifyBySrvTime(notifyArray){
    return notifyArray.sort(function(a,b){
        var a_srvTime = a['srv_time'] || 0;
        var b_srvTime = b['srv_time'] || 0;
        return parseInt(a_srvTime) - parseInt(b_srvTime);
    });
}

class SocketManager extends EventBus {
    maxListeners = 0

    constructor() {
        super(...arguments);

        this._resetState();
    }

    setupSocketProtoCoders(socketProtoCoders) {
        this._socketProtoCoders = socketProtoCoders;
    }

    // 通过socket向服务器发送rpc请求
    // 当socket未连接时, 会等待socket连接成功后再发送请求
    // 所有请求需要在 socketProtoCoders 注册编码/解码器
    rpcRequest(method, data = null) {
        return Promise.resolve().then(() => new Promise((resolve, reject) => {
            let isFinished = false;
            const doFinish = (fnResovler, data) => {
                if (!isFinished) {
                    fnResovler(data);
                    isFinished = true;
                }
            };

            // 20秒后超时
            setTimeout(() => doFinish(reject, {message: `rpcRequest timeout: ${method}`}), 20000);

            const fnExec = async () => {
                const coder = this._socketProtoCoders[method];
                let bytes = null;
                if (isFinished) {
                    return;
                }
                if (data) {
                    const encodeRequest = coder && coder.encodeRequest;
                    if (!encodeRequest) {
                        doFinish(reject, {message: `rpcRequest: 指定方法名未定义 encodeRequest 方法: ${method}`});
                        return;
                    }
                    bytes = await encodeRequest(data);
                }

                const requestId = nextRpcRequestId++,
                    webRpcRequest = {
                        type: WebRpcMessageType.WEB_RPC_MESSAGE_TYPE_REQUEST,
                        method: method,
                        seq: requestId,
                        param: bytes
                    };

                const responseHandler = async webRpcResponse => {
                    if ((webRpcResponse.seq === requestId && webRpcResponse.type === WebRpcMessageType.WEB_RPC_MESSAGE_TYPE_RESPONSE) || isFinished) {
                        this.off(_ON_RPC_RESPONSE, responseHandler);
                        if (isFinished) {
                            return;
                        }
                        let errorCode = webRpcResponse.error;
                        if (webRpcResponse.param != null) {
                            const decodeResponse = coder && coder.decodeResponse;
                            if (!decodeResponse) {
                                doFinish(reject, {message: `rpcRequest: 指定方法名未定义 decodeResponse 方法: ${method}`});
                                return;
                            }
                            webRpcResponse.param = await decodeResponse(webRpcResponse.param);
                            const innerRet = webRpcResponse.param.ret;
                            if (errorCode === 0 && innerRet != null) {
                                errorCode = innerRet;
                            }
                        }

                        tryLogSocket(webRpcResponse);

                        if (errorCode === 0) {
                            resolve(webRpcResponse);
                        } else {
                            reject({
                                errorCode: errorCode,
                                response: webRpcResponse
                            });
                        }
                    }
                };
                this.on(_ON_RPC_RESPONSE, responseHandler);
                this.sendMessage(encodeProto(WebRpcMessage, webRpcRequest));

                tryLogSocket({...webRpcRequest, param: data});
            };

            if (this.isConnected()) {
                fnExec();
            } else {
                this.once(SOCKET_EVENTS.ON_OPEN, fnExec);
            }
        }));
    }

    openUnauthWebSocket() {
        this._openWebSocket(`${wsProtocol}://beta.soma.im/webaccess/connect`);
        this._authInfo = null;
    }

    openAuthWebSocket(uid, token) {
        console.log('openAuthWebSocket',uid,token);
        this._openWebSocket(`${wsProtocol}://beta.soma.im/webaccess/authConnect?uid=${uid}&token=${token}`);
        this._authInfo = {uid, token};
    }

    isConnected() {
        return !!this._ws && this._ws.readyState === ReconnectingWebSocket.OPEN;
    }

    _openWebSocket(url) {
        if (this._isInited) {
            this.closeWebSocket();
        }

        this._ws = new ReconnectingWebSocket(url, null, {
            timeoutInterval: 5000
            // debug: true // 有需要时在本地开发环境开启
        });
        this._ws.onmessage = this._onMessage;
        this._ws.onopen = this._onOpen;
        this._ws.onclose = this._onClose;
        this._ws.onconnecting = this._onConnecting;
        this._isInited = true;
    }

    closeWebSocket() {
        this._resetState();
    }

    sendMessage(msg) {
        this._ws.send(msg);
    }

    _resetState() {
        if (this._interval) {
            clearInterval(this._interval);
        }
        if (this._ws) {
            this._ws.close();
        }
        this._ws = null;
        this._reconnecttimes = -1;
        this._interval = null;
        this._isInited = false;
        this._authInfo = null;
    }

    async _syncOfflineEvents() {
        const response = await this.rpcRequest('webnotifyproxy.syncWebNotify', {
            uid: this._authInfo.uid
        });
        var sortedNotify = sortNotifyBySrvTime(response.param.notify || []);
        sortedNotify.forEach(webNtf => {
            this.emit(SOCKET_EVENTS.ON_RPC_NOTIFY, {
                type: WebRpcMessageType.WEB_RPC_MESSAGE_TYPE_NOTIFY,
                method: 'MsgNtf',
                error: 0,
                param: webNtf
            });
        });
    }

    _ackWebNotify(rpcMsg) {
        return this.rpcRequest('webnotifyproxy.ackWebNotify', {
            uid: this._authInfo.uid,
            notify_uuid: rpcMsg.param.notify_uuid
        });
    }

    _startPing() {
        this._interval = setInterval(() => {
            this.rpcRequest('ping').catch(noop);
        }, 10000);
    }

    _onOpen = () => {
        this._startPing();

        this._reconnecttimes++;
        //每次断线重连,需要同步消息
        if (this._reconnecttimes > 0) {
            console.warn('Socket 已断线重连.');
            if (this._authInfo) {
                this._syncOfflineEvents();
            }
        }
        tryLogSocket('onOpen');
        this.emit(SOCKET_EVENTS.ON_OPEN);
        this.emit(SOCKET_EVENTS.ON_CONNECTED_CHANGE);
    }

    // "reconnectingwebsocket" 自定义事件, 用来获取socket关闭事件错误码
    _onConnecting = (event) => {
        const code = event.code;
        if (code != null) {
            if (code === 4403) {
                this.closeWebSocket();
                this.emit(SOCKET_EVENTS.TOKE_EXPIRED);
                console.warn('token 失效! 需要重新登录');
            } else {
                warning(`SocketManager: 异常的socket关闭code: ${code}`);
            }
        }
    }

    _onClose = () => {
        tryLogSocket('onClose');
        clearInterval(this._interval);
        this.emit(SOCKET_EVENTS.ON_CLOSE);
        this.emit(SOCKET_EVENTS.ON_CONNECTED_CHANGE);
    }

    _onMessage = async (event) => {
        const eventData = event.data;
        if (eventData instanceof Blob) {
            const arrayBuffer = await blobUtil.blobToArrayBuffer(eventData);
            const webRpcMsg = decodeProto(WebRpcMessage, arrayBuffer);
            if (webRpcMsg.type === WebRpcMessageType.WEB_RPC_MESSAGE_TYPE_NOTIFY) {
                if (webRpcMsg.param) {
                    const coder = this._socketProtoCoders[webRpcMsg.method],
                        decodeResponse = coder && coder.decodeResponse;
                    if (!decodeResponse) {
                        warning(`SocketManager notify: 指定方法名未定义 decodeResponse 方法: ${webRpcMsg.method}`);
                        return;
                    }
                    webRpcMsg.param = await decodeResponse(webRpcMsg.param);
                }
                tryLogSocket(webRpcMsg);
                this.emit(SOCKET_EVENTS.ON_RPC_NOTIFY, webRpcMsg);
                if (webRpcMsg.method === 'MsgNtf') {
                    this._ackWebNotify(webRpcMsg);
                }
            } else if (webRpcMsg.type === WebRpcMessageType.WEB_RPC_MESSAGE_TYPE_RESPONSE) {
                this.emit(_ON_RPC_RESPONSE, webRpcMsg);
            } else {
                warning(`SocketManager: 接收到错误类型的 WebRpcMessage: type = ${webRpcMsg.type}`);
            }
        }
    }
}

export default new SocketManager();
