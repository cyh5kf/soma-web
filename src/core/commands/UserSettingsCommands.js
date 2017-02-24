import {createCommand} from '../../utils/command';
import SocketManager from '../socket/SocketManager';
import LoginStore from '../stores/LoginStore';
import UserSettingsStore from '../stores/UserSettingsStore';
import {WebSessionType} from '../protos/protos';

export const queryUserSettingsCmd = createCommand(function() {

    return SocketManager.rpcRequest('accountproxy.getWebUserSettings', {
        uid: LoginStore.getUserInfo().uid
    }).then(response => {
        var param = response.param;
        if (param.ret === 0) {
            var user_settings = param.user_settings || [];
            UserSettingsStore.onSaveUserSettings(user_settings);
            return user_settings;
        }
        return null;
    });

});


export const queryBlockListCmd = createCommand(function(){
    return SocketManager.rpcRequest('friendsproxy.getBlockList', {
        uid: LoginStore.getUserInfo().uid
    }).then(function(d){
        var phones = d.param.phones || [];
        UserSettingsStore.onUpdateUserSettings({blocked_phones: phones});
    });
});


export const updateNameCmd = createCommand(function(newName) {
    if(!newName){
        return Promise.resolve();
    }

    return SocketManager.rpcRequest('accountproxy.updateName', {
        uid: LoginStore.getUserInfo().uid,
        name: newName
    }).then(() =>{
        UserSettingsStore.onUpdateUserSettings({user_name: newName});
        LoginStore.updateProfile({name: newName});
    });

});

export const updateStatusCmd = createCommand(function(newStatus) {
    if(!newStatus){
        return Promise.resolve();
    }

    return SocketManager.rpcRequest('accountproxy.updateWhatsUp', {
        uid: LoginStore.getUserInfo().uid,
        whatsUpType: 1,
        customWhatsUpContent: newStatus
    }).then(() =>{
        UserSettingsStore.onUpdateUserSettings({customWhatsUpContent: newStatus, whatsUpType: 1});
        LoginStore.updateProfile({customWhatsUpContent: newStatus, whatsUpType: 1});
    });

});

export const updateNotificationCmd = createCommand(function(isNotification) {
    return SocketManager.rpcRequest('accountproxy.updateWebNotification', {
        uid: LoginStore.getUserInfo().uid,
        enable: isNotification
    }).then(() =>{
        UserSettingsStore.onUpdateUserSettings({web_notification: isNotification});
    });

});

export const updateSoundCmd = createCommand(function(isSound) {

    return SocketManager.rpcRequest('accountproxy.updateWebSound', {
        uid: LoginStore.getUserInfo().uid,
        enable: isSound
    }).then(() =>{
        UserSettingsStore.onUpdateUserSettings({web_sound: isSound});
    });

});


export const toggleSessionMuteCmd = createCommand(async function ({sessionId, sessionType, mute}) {

    mute = !!mute;

    if (sessionType === WebSessionType.WEB_SESSION_TYPE_P2P) {
        await SocketManager.rpcRequest('accountproxy.updateUserMute', {
            uid: LoginStore.getUserInfo().uid,
            targetUid: sessionId,
            isMute: mute
        });
    } else if (sessionType === WebSessionType.WEB_SESSION_TYPE_GROUP) {
        await SocketManager.rpcRequest('grpproxy.markSilent', {
            uid: LoginStore.getUserInfo().uid,
            gid: sessionId,
            silent: mute
        });
    }
    UserSettingsStore.onUpdateUserSettingsMute({sessionId, sessionType, mute});

}, {
    getCmdKey: ({sessionId}) => sessionId
});



export const updateAvatarCmd = createCommand(function(avatarUrl) {

    return SocketManager.rpcRequest('accountproxy.updateAvatar', {
        uid: LoginStore.getUserInfo().uid,
        avatarUrl: avatarUrl
    }).then(() =>{
        UserSettingsStore.onUpdateUserSettings({avatar: avatarUrl});
        LoginStore.updateProfile({avatar: avatarUrl});
    });

});