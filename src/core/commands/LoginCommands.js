import {createCommand} from '../../utils/command';

import LoginStore from '../stores/LoginStore';
import FriendAccountStore from '../stores/FriendAccountStore';
import GroupFavoriteStore from '../stores/GroupFavoriteStore';
import RecentEmojiStore from '../stores/RecentEmojiStore';
import SessionsStore from '../stores/SessionsStore';
import UserAccountStore from '../stores/UserAccountStore';
import UserKeysStore from '../stores/UserKeysStore';
import UserSettingsStore from '../stores/UserSettingsStore';

import SocketManager from '../socket/SocketManager';


export const loginCreateEccKeyCmd = createCommand(function (data) {
    LoginStore.loginProgress(data);
});

export const loginOnUserNtfCmd = createCommand(function (data) {
    LoginStore.loginProgress(data);
});

//成功登录完成
export const loginOnTokenNtfCmd = createCommand(function (data) {
    LoginStore.loginProgress(data, true);
    updateMobStatCmd(true);
});

export const logoutCmd = createCommand(function(){
    var callback = ()=> {
        LoginStore.clearUserSession({notifyEvent: true});
        clearAllStoreCmd();
    };
    return updateMobStatCmd(false).then(callback, callback);
});

export const updateMobStatCmd = createCommand(function(stat){//false: offline; true: online
    //return SocketManager.rpcRequest('weblogin.updateMobStat', {
    //    uid: LoginStore.getUserInfo().uid,
    //    stat: stat
    //});
});

export const clearAllStoreCmd = createCommand(function(isClearUserSession = false){
    FriendAccountStore.clear();
    GroupFavoriteStore.clear();
    RecentEmojiStore.clear();
    SessionsStore.clear();
    UserAccountStore.clear();
    UserKeysStore.clear();
    UserSettingsStore.clear();
    if(isClearUserSession){
        LoginStore.clearUserSession({notifyEvent: false});
    }
});


export const queryLoginUserInfoCmd = createCommand(function () {
    var loginUid = LoginStore.getUserInfo().uid;
    return SocketManager.rpcRequest('accountproxy.getSimpleBabaAccountList', {
        uid: LoginStore.getUserInfo().uid,
        friendUids: [loginUid]
    }).then(response => {
        var param = response.param;
        if (param.ret === 0) {
            var profiles = param.profiles;
            var userInfo = profiles[0];
            LoginStore.updateProfile(userInfo);
            UserAccountStore.onSaveUserAccountList(profiles,false);
        }
    });
});