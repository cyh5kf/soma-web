import EventBus from '../../utils/EventBus';
import {ECC} from '../../utils/crypto';
import { UserProfileSchema } from '../schemas/LoginSchemas';
import EnumStorageType from '../enums/EnumStorageType';
import SocketManager, {SOCKET_EVENTS} from '../../core/socket/SocketManager';
import { createImmutableSchemaData, mergeImmutableSchemaData } from '../../utils/schema';
import Pool from './PoolMixin';


const STORAGE_TYPE = EnumStorageType.SESSION;
const STORAGE_KET = "LoginStore$$userInfo";

function mergeImmutableSchemaDataCreateIfNull(schema, immutableSchemaData, mergedData){
    immutableSchemaData = immutableSchemaData ||  createImmutableSchemaData(schema, {});
    return mergeImmutableSchemaData(schema, immutableSchemaData, mergedData);
}

var userInfoJSON = Pool.getJsonObject(STORAGE_KET, STORAGE_TYPE);
var userInfo = createImmutableSchemaData(UserProfileSchema, userInfoJSON || {});
var ecc = null;

function updateEcc() {
    const publicKey = userInfo.loginPublicKey,
        privateKey = userInfo.loginPrivateKey;
    ecc = (publicKey && privateKey) ? new ECC({
        publicKey: publicKey.toJS(),
        privateKey: privateKey.toJS()
    }) : null;
}

updateEcc();

const saveUserProfile = function (userInfo0) {
    var u = userInfo0 ? userInfo0.toJS() : null;
    Pool.setJsonObject(STORAGE_KET, u, STORAGE_TYPE);
};



export const LOGIN_EVENTS = {
    CHANGE: 'change',
    LOGGED_IN: "logged_in",
    LOGGED_OUT:"logged_out"
};


class LoginStore extends EventBus {
    _ecc = null;

    isLoggedIn(){
        return userInfo && !!userInfo.token;
    }

    getUid(){
        return userInfo && userInfo.uid;
    }

    getUserInfo() {
        return userInfo;
    }

    getToken() {
        return userInfo ? userInfo.token : null;
    }

    getEcc() {
        return ecc;
    }

    clearUserInfo(){
        userInfo = null;
        Pool.setJsonObject(STORAGE_KET, null, STORAGE_TYPE);
    }

    updateProfile(profileParts) {
        userInfo = mergeImmutableSchemaDataCreateIfNull(UserProfileSchema, userInfo, profileParts);
        saveUserProfile(userInfo);
        this.emit(LOGIN_EVENTS.CHANGE);
    }

    loginProgress(profileParts,isLoggedIn) {
        userInfo = mergeImmutableSchemaDataCreateIfNull(UserProfileSchema, userInfo, profileParts);
        saveUserProfile(userInfo);
        if(isLoggedIn){
            updateEcc();
            this.emit(LOGIN_EVENTS.LOGGED_IN);
        }
    }

    clearUserSession({notifyEvent = true} = {}) {
        userInfo = createImmutableSchemaData(UserProfileSchema, null);
        saveUserProfile(userInfo);
        if (notifyEvent) {
            this.emit(LOGIN_EVENTS.LOGGED_OUT);
        }
    }

    _handleTokenExpired = () => {
        this.clearUserInfo();
        this.emit(LOGIN_EVENTS.LOGGED_OUT);
    };

    _handleRpcNotify = (response) => {
        if(response.method==='LogoutNtf'){
            var uid = response.param.uid;
            if (uid === userInfo.uid) {
                this.clearUserInfo();
                this.emit(LOGIN_EVENTS.LOGGED_OUT);
            }
        }
    };

    bindWebsocketEvents() {
        SocketManager.on(SOCKET_EVENTS.TOKE_EXPIRED, this._handleTokenExpired);
        SocketManager.on(SOCKET_EVENTS.ON_RPC_NOTIFY, this._handleRpcNotify);
    }

    unbindWebsocketEvents() {
        SocketManager.off(SOCKET_EVENTS.TOKE_EXPIRED, this._handleTokenExpired);
        SocketManager.off(SOCKET_EVENTS.ON_RPC_NOTIFY, this._handleRpcNotify);
    }

}

export default new LoginStore();
