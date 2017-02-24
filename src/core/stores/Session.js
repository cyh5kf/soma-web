import immutable from 'immutable';
import {createImmutableSchemaData, mergeImmutableSchemaData} from '../../utils/schema';
import warning from '../../utils/warning';
import {isSessionMuted} from '../core-utils/SessionUtils';
import {notifyNewMessage} from '../core-utils/notify';
import isWindowFocus from '../core-utils/isWindowFocus';
import EnumMsgType from '../enums/EnumMsgType';
import {isListContains} from '../../utils/functions';
import {SessionSchema} from '../schemas/SessionsSchemas';
import {MessageSchema, MessageListSchema} from '../schemas/MessageSchemas';
import UserAccountStore from '../stores/UserAccountStore';
import UserSettingsStore from '../stores/UserSettingsStore';
import LoginStore from './LoginStore';
import {ensureUserAccountsCmd} from '../commands/UsersCommands';

// 单个会话的事件也会由 SessionsStore 触发, 并且事件会统一加上 {sessionId} 数据
export const SINGLE_SESSION_EVENTS = {
    SESSION_INFO_CHANGE: 'sessionInfoChange',
    MESSAGES_CHANGE: 'messagesChange',
    ON_NEW_MESSAGE_COME: 'onNewMessageCome'
};

export default class Session {
    constructor(sessionsStore, sessionInfoOpts) {
        /**@type SessionsStore*/
        this._sessionsStore = sessionsStore;
        this.sessionInfo = createImmutableSchemaData(SessionSchema, {
            unreadMsgCount: 0,
            notInGroup: false,
            isDetailPulled: false,
            ...sessionInfoOpts
        });
        this.messages = createImmutableSchemaData(MessageListSchema, []);
        this._rebuildMessageIdxMap();
    }

    _rebuildMessageIdxMap() {
        const msgIdxMap = this._messagesIdxMap = {};
        if (this.messages) {
            this.messages.forEach((msg, idx) => {
                msgIdxMap[msg.msgId] = idx;
            });
        }
    }

    getMsgIdx(msgId) {
        const idx = this._messagesIdxMap[msgId];
        return idx == null ? -1 : idx;
    }
    getMsg(msgId) {
        const idx = this.getMsgIdx(msgId);
        return idx === -1 ? null : this.messages.get(idx);
    }


    /////////////////
    // 各类数据更新操作
    // 更新并验证&转换schema
    updateSessionInfo(changes) {
        if (changes.members) {
            changes.memberCount = changes.members.length;
            const memberUidMap = changes.members.reduce((result, member) => {
                result[member.uid] = true;
                return result;
            }, {});
            changes.managerUids = (changes.managerUids || this.sessionInfo.managerUids.toJS()).filter(managerUid => memberUidMap[managerUid]);
        }
        const oldSessionInfo = this.sessionInfo;
        this.sessionInfo = mergeImmutableSchemaData(SessionSchema, oldSessionInfo, changes);

        this._sessionsStore.onSessionDataChange(this.sessionInfo.sessionId, SINGLE_SESSION_EVENTS.SESSION_INFO_CHANGE);
    }
    async onMembersJoin(joinedMemberUids) {
        const {memberCount, members} = this.sessionInfo;
        if (members) {
            const memberUidMap = members.reduce((result, member) => {
                result[member.uid] = true;
                return result;
            }, {});
            joinedMemberUids = joinedMemberUids.filter(uid => !memberUidMap[uid]);
            await ensureUserAccountsCmd(joinedMemberUids);
            const totalMembers = members.concat(UserAccountStore.getUserAccountList(joinedMemberUids)).toJS();
            const myUid = LoginStore.getUserInfo().uid;
            const isContainsMe = isListContains(totalMembers, {uid: myUid});
            this.updateSessionInfo({
                members: totalMembers,
                notInGroup: !isContainsMe
            });
        } else {
            this.updateSessionInfo({
                memberCount: memberCount + joinedMemberUids.length
            });
        }

    }
    onMemberLeave(leaveMemberUid) {
        const {memberCount, members} = this.sessionInfo;
        if (members) {
            this.updateSessionInfo({
                members: members.filter(member => member.uid !== leaveMemberUid).toJS()
            });
        } else {
            this.updateSessionInfo({
                memberCount: memberCount - 1
            })
        }
    }
    _setMessages(messages, {notifyEvent = true, rebuildIdxMap = true} = {}) {
        this.messages = messages;
        rebuildIdxMap && this._rebuildMessageIdxMap();
        if (notifyEvent) {
            this._sessionsStore.onSessionDataChange(this.sessionInfo.sessionId, SINGLE_SESSION_EVENTS.MESSAGES_CHANGE);
        }
    }
    onPushMessages(immutableMessages) {
        const getMsgSize = () => this.messages ? this.messages.size : 0,
            oldMsgSize = getMsgSize();
        if (!this.messages) {
            this._setMessages(immutableMessages);
        } else {
            immutableMessages.forEach(msg => {
                const idx = this.getMsgIdx(msg.msgId);
                if (idx === -1) {
                    const myUid = LoginStore.getUserInfo().uid;
                    this._setMessages(this.messages.push(msg), {notifyEvent: false});
                    // 窗口未激活时, 通知新消息
                    if (!isWindowFocus() && msg.msgType !== EnumMsgType.SystemMsg && msg.fromUid !== myUid) {
                        var userSettings = UserSettingsStore.getUserSettings();
                        if (!isSessionMuted(userSettings, this.sessionInfo)) {
                            var web_notification = userSettings['web_notification'];
                            var web_sound = userSettings['web_sound'];
                            notifyNewMessage(this.sessionInfo, msg,web_notification,web_sound);
                        }
                    }
                    // 对于非当前会话的新消息, 新增未读数
                    if (msg.fromUid !== myUid && msg.msgType !== EnumMsgType.SystemMsg && this._sessionsStore.getSelectedSessionId() !== this.sessionInfo.sessionId) {
                        this.updateSessionInfo({
                            unreadMsgCount: this.sessionInfo.unreadMsgCount + 1
                        });
                    }
                } else {
                    this._setMessages(this.messages.set(idx, msg), {notifyEvent: false, rebuildIdxMap: true});
                }
            });

            this._sessionsStore.onSessionDataChange(this.sessionInfo.sessionId, SINGLE_SESSION_EVENTS.MESSAGES_CHANGE);
        }

        if (getMsgSize() > oldMsgSize) {
            this._sessionsStore.onSessionDataChange(this.sessionInfo.sessionId, SINGLE_SESSION_EVENTS.ON_NEW_MESSAGE_COME);
        }

        // 更新会话最后一条消息
        const lastMsg = this.messages.last();
        if (lastMsg) {
            this.updateSessionInfo({
                lastMessage: lastMsg.toJS()
            });
        }
    }
    onEditMessages(messagesChanges) {
        const editedMsgs = messagesChanges.reduce((result, chg) => {
            if (__DEV__ && !chg.msgId) { warning(`Session.onEditMessage: 未指定 msgId: ${JSON.stringify(chg)}`); }
            const msgIdx = this.getMsgIdx(chg.msgId);
            if (msgIdx !== -1) {
                result.push(
                    mergeImmutableSchemaData(MessageSchema, this.messages.get(msgIdx), chg)
                );
            } else if (__DEV__) { warning(`Session.onEditMessage: 指定的 msgId 在消息列表中不存在: ${JSON.stringify(chg)}`); }
            return result;
        }, []);
        if (editedMsgs.length) {
            this.onPushMessages(immutable.List(editedMsgs));
        }
    }
}
