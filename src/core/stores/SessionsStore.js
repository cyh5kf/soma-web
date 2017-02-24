import immutable from 'immutable';
import assign from 'lodash/assign';
import isArrayBuffer from 'lodash/isArrayBuffer';
import uniqueId from 'lodash/uniqueId';
import isEmpty from 'lodash/isEmpty';
import EventBus from '../../utils/EventBus';
import warning from '../../utils/warning';
import FileUtils from '../../utils/FileUtils';
import {toImageDataUrl} from '../../utils/toDataUrl';
import StringUtils from '../../utils/StringUtils';
import {getLocale} from '../../components/exposeLocale';
import Session, {SINGLE_SESSION_EVENTS} from './Session';
import {createImmutableSchemaData} from '../../utils/schema';
import {getUserDisplayName,gettNameFromContactJson} from '../core-utils/UserUtils';
import EnumMsgStatus from '../enums/EnumMsgStatus';
import EnumMsgType, {msgTypeFromEChatType} from '../enums/EnumMsgType';
import {MessageListSchema} from '../schemas/MessageSchemas';
import SocketManager, {SOCKET_EVENTS} from '../socket/SocketManager';
import LoginStore from './LoginStore';
import UserAccountStore, {USER_ACCOUNT_EVENTS} from './UserAccountStore';
import UserSettingsStore from './UserSettingsStore';
import {ensureUserAccountsCmd} from '../commands/UsersCommands';
import {WebSessionType, ESessionType, EChatSubItemType, EGroupMsgType, SelfNotifyType} from '../protos/protos';
import {msgsAckCmd, msgAckDelCmd,decryptEmojiTextCmd} from '../commands/MessagesCommands';
import {clearSessionUnreadCntCmd} from '../commands/SessionsCommands'
import {parseEmojiTextImmediately} from '../../utils/EmojifyUtils';
import SessionMsgStatus from './SessionMsgStatus';

export const SESSIONS_EVENTS = {
    SEL_SESSION_CHANGE: 'selSessionChange',
    SESSION_LIST_CHANGE: 'sessionListChange'
};

export {SINGLE_SESSION_EVENTS};

function buildMsgDataStatus(sessionId,msgId,fromUid) {

    var cachedStatus = SessionMsgStatus.getMsgStatus(sessionId, msgId);
    if (typeof cachedStatus === 'number') {
        SessionMsgStatus.deleteMsgStatus(sessionId, msgId);//用掉了就删掉.
        return cachedStatus;
    }

    return fromUid === LoginStore.getUserInfo().uid ? EnumMsgStatus.MySent : EnumMsgStatus.OtherReceive;

}

class SessionsStore extends EventBus {
    constructor() {
        super(...arguments);
        this.clear();

        UserAccountStore.on(USER_ACCOUNT_EVENTS.USER_ACCOUNT_STORE_CHANGE, this._handleUserAccountStoreChange);
        SocketManager.on(SOCKET_EVENTS.ON_RPC_NOTIFY, this._handleRpcNotify);
    }

    clear() {
        this._sessions = [];
        this._selectedSessionId = null;
        this._rebuildSessionMap();
    }

    _rebuildSessionMap() {
        this._sessionsMap = this._sessions.reduce((result, session) => {
            result[session.sessionInfo.sessionId] = session;
            return result;
        }, {});
    }


    /**@param {Array.<Object | Session>}sessionInfos*/
    onSessionsJoin(sessionInfos) {
        const newSessions = [];
        sessionInfos.forEach(sessionInfo => {
            if (__DEV__ && this.getSession(sessionInfo.sessionId)) {
                warning('SessionsStore.onSessionsJoin: 会话已存在, 请检查代码!');
            } else {
                newSessions.push(sessionInfo instanceof Session ? sessionInfo : new Session(this, sessionInfo));
            }
        });
        this._sessions = newSessions.concat(this._sessions);
        this._rebuildSessionMap();
        this.emit(SESSIONS_EVENTS.SESSION_LIST_CHANGE);
    }

    onSessionLeave(sessionId) {
        this._sessions = this._sessions.filter(session => session.sessionInfo.sessionId !== sessionId);
        this._rebuildSessionMap();
        if (this._selectedSessionId === sessionId) {
            this.setSelectedSessionId(null);
        }
        this.emit(SESSIONS_EVENTS.SESSION_LIST_CHANGE);
    }

    setDefaultSelectedSession() {
        const sessionInfos =this.getSessionInfos();
        this.setSelectedSessionId(sessionInfos.size ? sessionInfos.first().sessionId : null);
    }

    onSessionDataChange(sessionId, singleSessionEvent) {
        this.emit(singleSessionEvent, {sessionId});
        if (singleSessionEvent === SINGLE_SESSION_EVENTS.SESSION_INFO_CHANGE) {
            this.emit(SESSIONS_EVENTS.SESSION_LIST_CHANGE);
        }
    }

    async queryAndInsertGroupSession(gid) {
        const response = await SocketManager.rpcRequest('grpproxy.getGroupInfo', {
            uid: LoginStore.getUserInfo().uid,
            gid: gid
        });
        const groupInfo = response.param.groupFullInfo;
        const memberUids = groupInfo.user.map(member => member.uid);

        await ensureUserAccountsCmd(memberUids);

        this.onSessionsJoin([{
            sessionId: gid,
            sessionType: WebSessionType.WEB_SESSION_TYPE_GROUP,
            sessionName: groupInfo.group.name,
            sessionLogo: groupInfo.group.avatar,
            mute: !!groupInfo.group.silent,
            memberCount: groupInfo.user.length,
            isDetailPulled: true,
            members: memberUids.map(function(uid){
                var userAccount = UserAccountStore.getUserAccount(uid);
                if(userAccount){
                    return userAccount.toJS()
                }else {
                    console.error('cannot find user of id = '+ uid);
                    return null;
                }
            }),
            managerUids: groupInfo.group.manager
        }]);

        return this.getSession(gid);
    }

    /**@return {Session} */
    getSession(sessionId) {
        return this._sessionsMap[sessionId];
    }

    /**@return {SessionListSchema} */
    getSessionInfos() {
        const oldIdxMap = {},
            sessionInfos = this._sessions.map((session, idx) => {
                oldIdxMap[session.sessionInfo.sessionId] = idx;
                return session.sessionInfo;
            });
        return immutable.List(sessionInfos.sort((a, b) => {
            const lastTimeA = a.lastMessage ? a.lastMessage.msgSrvTime : -1,
                lastTimeB = b.lastMessage ? b.lastMessage.msgSrvTime : -1;
            if (lastTimeA !== lastTimeB) {
                return lastTimeB - lastTimeA; // 时间从近到远排列
            } else {
                return oldIdxMap[a.sessionId] - oldIdxMap[b.sessionId]; // 否则保持原顺序
            }
        }));
    }

    getSelectedSessionId() {
        return this._selectedSessionId;
    }

    setSelectedSessionId(selectedSessionId) {
        this._selectedSessionId = selectedSessionId;
        this.emit(SESSIONS_EVENTS.SEL_SESSION_CHANGE);
    }

    _handleUserAccountStoreChange = () => {
        this._sessions.forEach(session => {
            const {sessionInfo} = session;
            if (sessionInfo.sessionType === WebSessionType.WEB_SESSION_TYPE_P2P) {
                const user = UserAccountStore.getUserAccount(sessionInfo.sessionId);
                if (user) {
                    const changes = {},
                        expectedName = getUserDisplayName(user);
                    if (sessionInfo.sessionName !== expectedName) {
                        changes.sessionName = expectedName;
                    }
                    if (sessionInfo.sessionLogo !== user.avatar) {
                        changes.sessionLogo = user.avatar;
                    }
                    if (!isEmpty(changes)) {
                        session.updateSessionInfo(changes);
                    }
                }
            }
        });
    }

    _handleRpcNotify = async rpcMsg => {
        if (rpcMsg.method === 'MsgNtf') {
            // 处理消息数据类型
            const handleMsgNotifyData = async ({session, msgId, type, msgSrvTime, fromUid, fromNickname, fromAvatar, data}) => {
                const msgData = {};
                let msgType = null;
                if (session.sessionInfo.sessionType === WebSessionType.WEB_SESSION_TYPE_P2P && isArrayBuffer(data)) {
                    // 单聊中, 如果data未解出, 则表示密钥失效, 解密失败
                    msgType = EnumMsgType.ExpiredMsg;
                } else {
                    msgType = msgTypeFromEChatType(type);
                    switch (type) {
                        case EnumMsgType.SystemMsg:
                            msgData.text = data;
                            break;
                        case EChatSubItemType.EChatSubItemType_Plain_Text:
                            msgData.text = data.text;
                            break;
                        case EChatSubItemType.EChatSubItemType_Text:
                            msgData.text = data;
                            break;
                        case EChatSubItemType.EChatSubItemType_Image: {
                            const ext = FileUtils.getExtension(data.cryptimgurl || data.imgurl);
                            assign(msgData, {
                                ext: ext,
                                thumbDataUrl: toImageDataUrl(data.thumb_bytes, ext),
                                imgWidth: data.imgwidth,
                                imgHeight: data.imgheight,
                                fileSize: Number(data.filesize)
                            }, (data.cryptimgurl && data.fileaes256key) ? {
                                cryptFileUrl: data.cryptimgurl,
                                fileAesKey: data.fileaes256key,
                                imgUrl: data.imgurl
                            } : {fileUrlOrBlobUrl: data.imgurl});
                            break;
                        }
                        case EChatSubItemType.EChatSubItemType_OrigImage: {
                            const ext = FileUtils.getExtension(data.cryptimgurl || data.imgurl);
                            assign(msgData, {
                                ext: ext,
                                thumbDataUrl: toImageDataUrl(data.thumb_bytes, ext),
                                imgWidth: data.imgwidth,
                                imgHeight: data.imgheight,
                                fileSize: Number(data.filesize)
                            }, (data.cryptimgurl && data.fileaes256key) ? {
                                cryptFileUrl: data.cryptimgurl,
                                fileAesKey: data.fileaes256key
                            } : {fileUrlOrBlobUrl: data.imgurl});
                            break;
                        }
                        case EChatSubItemType.EChatSubItemType_Audio:
                            assign(msgData, {
                                ext: FileUtils.getExtension(data.cryptfileurl || data.fileurl),
                                playDuration: data.playduration,
                                fileSize: Number(data.filesize),
                                formatSupported: FileUtils.isAudioFormatSupported(data.cryptfileurl || data.fileurl)
                            }, (data.cryptfileurl && data.fileaes256key) ? {
                                cryptFileUrl: data.cryptfileurl,
                                fileAesKey: data.fileaes256key
                            } : {fileUrlOrBlobUrl: data.fileurl});
                            break;

                        case EChatSubItemType.EChatSubItemType_ShortVideo:
                            assign(msgData, {
                                ext: FileUtils.getExtension(data.cryptvideourl || data.videourl),
                                fileSize: parseInt(data.videosize, 10),
                                playDuration: data.playduration,
                                thumbDataUrl: toImageDataUrl(data.thumb_bytes, FileUtils.getExtension(data.cryptimgurl || data.imgurl || 'test.jpg'))
                            }, data.cryptvideourl ? {
                                cryptFileUrl: data.cryptvideourl,
                                fileAesKey: data.fileaes256key
                            } : {
                                fileUrlOrBlobUrl: data.videourl
                            });
                            break;

                        case EChatSubItemType.EChatSubItemType_Location:
                            assign(msgData, {
                                longitude: data.lngt,
                                latitude: data.lat,
                                pointName: data.poiname
                            });
                            break;
                        case EChatSubItemType.EChatSubItemType_ContactCard: {
                            const contactInfo = JSON.parse(data.contactJson);
                            const name = gettNameFromContactJson(contactInfo);
                            assign(msgData, {
                                contactName: name,
                                contactJson: data.contactJson
                            });
                            break;
                        }
                    }
                }

                await ensureUserAccountsCmd([fromUid]);
                var fromNameDisplay = getUserDisplayName(UserAccountStore.getUserAccount(fromUid));
                var sessionId = session.sessionInfo.sessionId;
                var msgDataObj = {
                    sessionId: sessionId,
                    sessionType: session.sessionInfo.sessionType,
                    msgId: msgId,
                    msgType: msgType,
                    msgSrvTime: Number(msgSrvTime),
                    msgStatus: buildMsgDataStatus(sessionId,msgId,fromUid),// fromUid === LoginStore.getUserInfo().uid ? EnumMsgStatus.MySent : EnumMsgStatus.OtherReceive,
                    fromUid: fromUid,
                    fromNameDisplay: fromNameDisplay,
                    fromAvatar: fromAvatar,
                    ...msgData
                };


                if(msgDataObj.msgType === EnumMsgType.Text){
                    var textDecrypted =  parseEmojiTextImmediately(msgDataObj.text);
                    msgDataObj['textDecrypted'] = textDecrypted;
                }

                session.onPushMessages(createImmutableSchemaData(MessageListSchema, [msgDataObj]));

                //如果是Text类型解析Emoji表情
                decryptEmojiTextCmd(msgDataObj);

            };

            const msgNtf = rpcMsg.param.data;
            switch (msgNtf.sessiontype) {
                case ESessionType.ESessionType_P2P: {
                    const p2pNtf = msgNtf.data,
                        sessionId = p2pNtf.fromuid;
                    let ntfType = p2pNtf.type;
                    let session = this.getSession(sessionId);
                    if (msgTypeFromEChatType(ntfType) != null) {
                        if (!session) {
                            this.onSessionsJoin([{
                                sessionId: sessionId,
                                sessionType: WebSessionType.WEB_SESSION_TYPE_P2P,
                                sessionName: p2pNtf.fromnickname || sessionId,
                                sessionLogo: p2pNtf.fromavatar,
                                mute: false // jyf: TODO
                            }]);
                            session = this.getSession(sessionId);
                        }

                       await handleMsgNotifyData({
                            session: session,
                            msgId: p2pNtf.msgid,
                            type: ntfType,
                            msgSrvTime: p2pNtf.msgsrvtime,
                            fromUid: p2pNtf.fromuid,
                            fromNickname: p2pNtf.fromnickname || '',
                            fromAvatar: p2pNtf.fromavatar,
                            data: p2pNtf.data
                        });

                        msgsAckCmd(session.messages.filter(msg => msg.msgId === p2pNtf.msgid), false);

                    } else {
                        switch (ntfType) {
                            case EChatSubItemType.EChatSubItemType_TYPING:
                                // 用户正在输入...
                                break;
                            case EChatSubItemType.EChatSubItemType_SPEAKING:
                                // 用户正在说话...
                                break;
                            default:
                                warning(`SessionsStore._handleRpcNotify: 未处理的P2P Notify类型: ${ntfType}`);
                        }
                    }
                    break;
                }

                case ESessionType.ESessionType_P2PAck: {
                    const p2pNtf = msgNtf.data;
                    const session = this.getSession(p2pNtf.fromuid);
                    switch (p2pNtf.type) {
                        case EChatSubItemType.EChatSubItemType_RECEIVED:

                            var isMsgReceiveNotifyUsed = false;
                            if (session) {
                                var msgId = p2pNtf.msgid;
                                const msg = session.getMsg(msgId);
                                if (msg && msg.msgStatus < EnumMsgStatus.MyReceived) {
                                    session.onEditMessages([{
                                        msgId: msgId,
                                        msgStatus: EnumMsgStatus.MyReceived
                                    }]);
                                    isMsgReceiveNotifyUsed = true;
                                }
                            }

                            if(!isMsgReceiveNotifyUsed){
                                //由于Notify是异步的,收到此通知时,消息不一定存在,此时暂存一下该notify
                                SessionMsgStatus.setMsgStatusIfLess(p2pNtf.fromuid, p2pNtf.msgid, EnumMsgStatus.MyReceived);
                            }

                            msgAckDelCmd(msgId, p2pNtf.msgsrvtime, p2pNtf.touid);
                            break;

                        case EChatSubItemType.EChatSubItemType_READ:

                            var isMsgReadNotifyUsed = false;
                            //没有关闭已读回执才会显示已接收和已读状态 SW-198
                            if (UserSettingsStore.isHaveReadPrivacy()) {
                                if (session) {
                                    const msg = session.getMsg(p2pNtf.msgid);
                                    if (msg && msg.msgStatus < EnumMsgStatus.MyRead) {
                                        session.onEditMessages([{
                                            msgId: p2pNtf.msgid,
                                            msgStatus: EnumMsgStatus.MyRead
                                        }]);
                                        isMsgReadNotifyUsed = true;
                                    }
                                }
                            }

                            if(!isMsgReadNotifyUsed){
                                //由于Notify是异步的,收到此通知时,消息不一定存在,此时暂存一下该notify
                                SessionMsgStatus.setMsgStatusIfLess(p2pNtf.fromuid, p2pNtf.msgid, EnumMsgStatus.MyRead);
                            }

                            msgAckDelCmd(p2pNtf.msgid, p2pNtf.msgsrvtime, p2pNtf.touid);
                            break;
                        default:
                            warning(`SessionsStore._handleRpcNotify: 未处理的P2P Ack Notify类型: ${p2pNtf.type}`);
                    }
                    break;
                }

                case ESessionType.ESessionType_SELF_NOTIFY: {
                    const selfNtf = msgNtf.data,
                        requestData = selfNtf.request_data,
                        responseData = selfNtf.response_data,
                        userInfo = LoginStore.getUserInfo();
                    switch (selfNtf.notify_type) {

                        case SelfNotifyType.SELF_NOTIFY_TYPE_MARK_P2P_READ:{
                            console.log("SELF_NOTIFY_TYPE_MARK_P2P_READ",requestData);
                            var clearSession_peer_uid = requestData.peer_uid;
                            clearSessionUnreadCntCmd(clearSession_peer_uid);
                            break;
                        }
                        case SelfNotifyType.SELF_NOTIFY_TYPE_MARK_GROUP_READ:{
                            console.log("SELF_NOTIFY_TYPE_MARK_GROUP_READ",requestData);
                            var clearSession_gid = requestData.gid;
                            clearSessionUnreadCntCmd(clearSession_gid);
                            break;
                        }

                        case SelfNotifyType.SELF_NOTIFY_TYPE_SEND_P2P_MESSAGE: {

                            let {type} = requestData;
                            if (type === 21 || type === 29) {
                                //对于打电话消息忽略掉imchatmsg.proto
                                return;
                            }

                            const {touid} = requestData;
                            let session = this.getSession(touid);
                            if (!session) {
                                await ensureUserAccountsCmd([touid]);
                                const toUserInfo = UserAccountStore.getUserAccount(touid);
                                this.onSessionsJoin([{
                                    sessionId: touid,
                                    sessionType: WebSessionType.WEB_SESSION_TYPE_P2P,
                                    sessionName: toUserInfo.name || toUserInfo.mobile,
                                    sessionLogo: toUserInfo.avatar,
                                    mute: false // jyf: TODO
                                }]);
                                session = this.getSession(touid);
                            }
                            handleMsgNotifyData({
                                session: session,
                                msgId: requestData.msgid,
                                type: requestData.type,
                                msgSrvTime: responseData.srvtime,
                                fromUid: userInfo.uid,
                                fromNickname: userInfo.name,
                                fromAvatar: userInfo.avatar,
                                data: requestData.data
                            });
                            break;
                        }
                        // case SelfNotifyType.SELF_NOTIFY_TYPE_ACK_RECEIVED_DEL_MESSAGE: {
                        //     break;
                        // }
                        // case SelfNotifyType.SELF_NOTIFY_TYPE_ACK_BATCH_RECEIVED_DEL_MESSAGE:{
                        //     break;
                        // }
                        case SelfNotifyType.SELF_NOTIFY_TYPE_SEND_GROUP_MESSAGE: {
                            const sessionId = requestData.gid;
                            let session = this.getSession(sessionId);
                            if (!session) {
                                session = await this.queryAndInsertGroupSession(sessionId);
                            }
                            handleMsgNotifyData({
                                session: session,
                                msgId: requestData.msgid,
                                type: requestData.type,
                                msgSrvTime: Date.now(),
                                fromUid: userInfo.uid,
                                fromNickname: userInfo.name,
                                fromAvatar: userInfo.avatar,
                                data: requestData.data
                            });
                            break;
                        }
                    }
                    break;
                }

                case ESessionType.ESessionType_GroupChat: {
                    const groupNtf = msgNtf.data,
                        sessionId = groupNtf.gid;
                    let session = this.getSession(sessionId);
                    const groupNtfType = groupNtf.type;
                    if (msgTypeFromEChatType(groupNtfType)) { // 普通群聊消息推送
                        if (!session) {
                            session = await this.queryAndInsertGroupSession(sessionId);
                        }
                        handleMsgNotifyData({
                            session: session,
                            msgId: groupNtf.msgid,
                            type: groupNtfType,
                            msgSrvTime: Number(groupNtf.msgsrvtime),
                            fromUid: groupNtf.fromuid,
                            fromNickname: groupNtf.fromnickname || '',
                            fromAvatar: groupNtf.fromavatar || '',
                            data: groupNtf.data
                        });
                    } else {
                        const myUid = LoginStore.getUserInfo().uid;
                        const addSystemMsg = text => {
                            session.onPushMessages(createImmutableSchemaData(MessageListSchema, [{
                                msgId: uniqueId('sys_msg_'),
                                msgType: EnumMsgType.SystemMsg,
                                msgSrvTime: Number(groupNtf.msgsrvtime),
                                text: text
                            }]));
                        };
                        switch (groupNtfType) {
                            case EGroupMsgType.EGroupMsgType_GroupCreate: {
                                const creatorUid = groupNtf.data.operator.uid;
                                await ensureUserAccountsCmd([creatorUid]);
                                const createdByMe = creatorUid === myUid,
                                    creator = UserAccountStore.getUserAccount(creatorUid),
                                    creatorName = creator.name || creator.mobile,
                                    groupName = groupNtf.groupFullInfo.group.name;
                                if (!session) {
                                    const memberUids = groupNtf.groupFullInfo.user.map(user => user.uid);
                                    await ensureUserAccountsCmd(memberUids);
                                    this.onSessionsJoin([{
                                        sessionId: sessionId,
                                        sessionType: WebSessionType.WEB_SESSION_TYPE_GROUP,
                                        sessionName: groupName,
                                        sessionLogo: groupNtf.groupFullInfo.group.avatar,
                                        mute: groupNtf.groupFullInfo.group.silent,
                                        memberCount: memberUids.length,
                                        isDetailPulled: true,
                                        members: UserAccountStore.getUserAccountList(memberUids).toJS(),
                                        managerUids: groupNtf.groupFullInfo.group.manager
                                    }]);
                                    session = this.getSession(sessionId);
                                }
                                addSystemMsg(createdByMe ?
                                    StringUtils.formatLocale(getLocale()['baba_group_createdgroup'], groupName) :
                                    StringUtils.formatLocale(getLocale()['baba_group_other_createdgroup'], creatorName, groupName))
                                break;
                            }

                            case EGroupMsgType.EGroupMsgType_MemberEnter:
                                if (session) {
                                    const operatorUid = groupNtf.fromuid;
                                    let enteredMemberUids = groupNtf.data.usersAdd.map(user => user.uid);
                                    await ensureUserAccountsCmd(enteredMemberUids.concat([operatorUid]));
                                    await session.onMembersJoin(enteredMemberUids);
                                    const operator = UserAccountStore.getUserAccount(operatorUid),
                                        newMemberNames = enteredMemberUids.map(uid => getUserDisplayName(UserAccountStore.getUserAccount(uid))).join(', ')
                                    addSystemMsg(StringUtils.formatLocale(
                                        getLocale()['baba_grpinvite_joinedinfo'],
                                        operatorUid === myUid ? getLocale()['inbox.group.you'] : getUserDisplayName(operator),
                                        newMemberNames
                                    ));
                                }
                                break;

                            case EGroupMsgType.EGroupMsgType_MemberLeave:
                                if (session) {
                                    const operatorUid = groupNtf.data.operator.uid,
                                        leavedUid = groupNtf.data.userLeave.uid;
                                    await ensureUserAccountsCmd([operatorUid, leavedUid]);
                                    const operator = UserAccountStore.getUserAccount(operatorUid),
                                        leavedMember = UserAccountStore.getUserAccount(leavedUid),
                                        sessionId = session.sessionInfo.sessionId;
                                    if (leavedUid === myUid) {
                                        session.updateSessionInfo({
                                            notInGroup: true
                                        });
                                    }
                                    if (operatorUid === leavedUid) { // 主动退群
                                        this.onSessionLeave(sessionId); //从聊天列表中删除该群组
                                        addSystemMsg(StringUtils.formatLocale(
                                            getLocale()['group.message.left'],
                                            leavedUid === myUid ? getLocale()['inbox.group.you'] : getUserDisplayName(operator)
                                        ));
                                    } else { // 被他人踢出群
                                        if (leavedUid === myUid) {
                                            addSystemMsg(StringUtils.formatLocale(getLocale()['groupchat_removed_you'], getUserDisplayName(operator)));
                                        } else {
                                            addSystemMsg(StringUtils.formatLocale(
                                                getLocale()['group.message.removed'],
                                                getUserDisplayName(leavedMember),
                                                operatorUid === myUid ? getLocale()['group.message.you'] : getUserDisplayName(operator)
                                            ));
                                        }
                                    }
                                    session.onMemberLeave(leavedUid);
                                }
                                break;

                            case EGroupMsgType.EGroupMsgType_ModifyInfo:
                                if (session) {
                                    const operatorUid = groupNtf.data.operator.uid,
                                        groupName = groupNtf.data.gname;
                                    await ensureUserAccountsCmd([operatorUid]);
                                    const operator = UserAccountStore.getUserAccount(operatorUid);
                                    addSystemMsg(
                                        operatorUid === myUid ? StringUtils.formatLocale(getLocale()['baba_group_yourename'], groupName)
                                            : StringUtils.formatLocale(getLocale()['group.message.renamed'], getUserDisplayName(operator), groupName)
                                    );
                                    session.updateSessionInfo({
                                        sessionName: groupName
                                    });
                                }
                                break;

                            case EGroupMsgType.EGroupMsgType_AvatarChange:
                                if (session) {
                                    const operatorUid = groupNtf.data.operator.uid;
                                    await ensureUserAccountsCmd([operatorUid]);
                                    addSystemMsg(StringUtils.formatLocale(
                                        getLocale()[operatorUid === myUid ? 'baba_groups_chnggrppic_you' : 'baba_groups_chnggrppic_others'],
                                        getUserDisplayName(UserAccountStore.getUserAccount(operatorUid))
                                    ));
                                    session.updateSessionInfo({
                                        sessionLogo: groupNtf.data.avatarUrl
                                    });
                                }
                                break;

                            case EGroupMsgType.EGroupMsgType_LeaderChange:
                                if (session && session.sessionInfo.isDetailPulled) {
                                    const leaderUid = groupNtf.data.leader.uid,
                                        {members, managerUids} = session.sessionInfo;
                                    if (members.some(member => member.uid === leaderUid) && !managerUids.includes(leaderUid)) {
                                        if (leaderUid === myUid) {
                                            addSystemMsg(getLocale()['baba_group_admin']);
                                        }
                                        session.updateSessionInfo({
                                            managerUids: managerUids.push(leaderUid).toJS()
                                        });
                                    }
                                }
                                break;

                            default:
                                warning(`SessionsStore._handleRpcNotify: 未处理的GroupNotify类型: ${groupNtfType}`);
                        }

                    }
                    break;
                }
            }
        }
    }
}

export default new SessionsStore();
