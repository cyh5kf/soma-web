// import immutable from 'immutable';
import EventBus from '../../utils/EventBus';
import {createImmutableSchemaData, mergeImmutableSchemaData} from '../../utils/schema';
import {UserSettingsSchema} from '../schemas/UserSettingsSchemas';
import {ESessionType} from '../protos/protos';
import {isSessionMuted} from '../../core/core-utils/SessionUtils';
import SocketManager, {SOCKET_EVENTS} from '../socket/SocketManager';
import protos from '../protos/protos';
import LoginStore from './LoginStore';

export const USER_SETTINGS_EVENTS = {
    USER_SETTINGS_STORE_CHANGE:'USER_SETTINGS_STORE_CHANGE'
};


/**
 * 用户设置信息
 */
class UserSettingsStore extends EventBus {

    constructor() {
        super(...arguments);
        this.clear();
        SocketManager.on(SOCKET_EVENTS.ON_RPC_NOTIFY, this._handleRpcNotify);
    }

    clear(){
        this._userSettingsStore = createImmutableSchemaData(UserSettingsSchema,{web_notification : true, web_sound : true});
    }

    onSaveUserSettings(userSettings){
        if (!userSettings) {
            return;
        }

        this._userSettingsStore = createImmutableSchemaData(UserSettingsSchema,userSettings);
        this.emit(USER_SETTINGS_EVENTS.USER_SETTINGS_STORE_CHANGE);
    }

    onUpdateUserSettings(changes){
        const oldUserSettingStore = this._userSettingsStore;
        this._userSettingsStore = mergeImmutableSchemaData(UserSettingsSchema, oldUserSettingStore, changes);
        this.emit(USER_SETTINGS_EVENTS.USER_SETTINGS_STORE_CHANGE);
    }

    //Mute某个会话
    onUpdateUserSettingsMute({sessionId, sessionType, mute}){
        var session_muted = this._userSettingsStore.session_muted;
        session_muted = session_muted.filterNot(function (sessionMute) {
            return sessionMute.session_id === sessionId && sessionMute.session_type === sessionType;
        });

        session_muted = session_muted.toJS();

        var newSessionMute = {
            session_type: sessionType,
            session_id: sessionId,
            mute_flag: mute
        };
        session_muted.push(newSessionMute);

        this.onUpdateUserSettings({session_muted:session_muted});
    }

    getUserSettings() {

        var userSettingsStore =  this._userSettingsStore;

        if(userSettingsStore.web_notification !==false){
            userSettingsStore = mergeImmutableSchemaData(UserSettingsSchema, userSettingsStore, {
                web_notification : true
            });
        }

        if(userSettingsStore.web_sound !==false){
            userSettingsStore = mergeImmutableSchemaData(UserSettingsSchema, userSettingsStore, {
                web_sound : true
            });
        }

        return userSettingsStore;
    }

    //是否显示已读回执
    isHaveReadPrivacy(){
        var userSettings =  this._userSettingsStore;
        return userSettings && userSettings.have_read_privacy !== false;
    }

    //判断一个会话是否被标记为Mute
    isSessionMute(sessionId, sessionType){
        return isSessionMuted(this._userSettingsStore, {sessionId, sessionType});
    }

    //用户设置监听推送
    _handleRpcNotify = async rpcMsg => {
        if (rpcMsg.method === 'MsgNtf') {
            const msgNtf = rpcMsg.param.data;
            const sessiontype = msgNtf.sessiontype;
            const SelfNotifyType = protos.SelfNotifyType;
            if (sessiontype === ESessionType.ESessionType_SELF_NOTIFY) {
                const selfNtf = msgNtf.data;
                const contactNtf = selfNtf.request_data;
                const oldUserSettingStore = this._userSettingsStore;
                switch (selfNtf.notify_type) {
                    case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_NAME:
                        var user_name = {user_name: contactNtf.name};
                        this._userSettingsStore = mergeImmutableSchemaData(UserSettingsSchema, oldUserSettingStore, user_name);
                        LoginStore.updateProfile({name:contactNtf.name});
                        break;
                    case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_AVATAR:
                        var avatar = {avatar: contactNtf.avatarUrl};
                        this._userSettingsStore = mergeImmutableSchemaData(UserSettingsSchema, oldUserSettingStore, avatar);
                        LoginStore.updateProfile(avatar);
                        break;
                    case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_WHATSUP:
                        var {whatsUpType, sysWhatsUpNum, customWhatsUpContent} = contactNtf;
                        var userWhatsUp = {whatsUpType: whatsUpType, sysWhatsUpNum: sysWhatsUpNum, customWhatsUpContent: customWhatsUpContent};
                        this._userSettingsStore = mergeImmutableSchemaData(UserSettingsSchema, oldUserSettingStore, userWhatsUp);
                        break;
                    case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_MUTE:
                        var isMute = contactNtf.isMute;
                        var targetUid = contactNtf.targetUid;
                        var newSessionMute = {
                            sessionType: 1,
                            sessionId: targetUid,
                            mute: isMute
                        };
                        this.onUpdateUserSettingsMute(newSessionMute);
                        break;
                    case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_GROUP_MUTE:
                        var silent = contactNtf.silent;
                        var gid = contactNtf.gid;
                        var newSessionMute = {
                            sessionType: 2,
                            sessionId: gid,
                            mute: silent
                        }
                        this.onUpdateUserSettingsMute(newSessionMute);
                        break;
                    case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_HAVE_READ_PRIVACY:
                        var have_read_privacy = {have_read_privacy: contactNtf.enable};
                        this._userSettingsStore = mergeImmutableSchemaData(UserSettingsSchema, oldUserSettingStore, have_read_privacy);
                        break;
                }
                this.emit(USER_SETTINGS_EVENTS.USER_SETTINGS_STORE_CHANGE);


            }
        }
    }

}

export default new UserSettingsStore();
