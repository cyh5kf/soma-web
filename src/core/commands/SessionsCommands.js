import {createCommand} from '../../utils/command';
import StringUtils from '../../utils/StringUtils';
import warning from '../../utils/warning';
import {getLocale} from '../../components/exposeLocale';
import toast from '../../components/popups/toast';
import SocketManager from '../socket/SocketManager';
import LoginStore from '../stores/LoginStore';
import SessionsStore from '../stores/SessionsStore';
import UserAccountStore from '../stores/UserAccountStore';
import EnumMsgType from '../enums/EnumMsgType';
import {ensureUserAccountsCmd} from './UsersCommands';
import {WebSessionType} from '../protos/protos';

const querySessionsCmd = createCommand(function () {
    return SocketManager.rpcRequest('websession.getWebSessionList', {
        uid: LoginStore.getUserInfo().uid
    }).then(response => {

        const userInfoList = [];

        const sessions = (response.param.session || []).map(session => {
            if (session.type === WebSessionType.WEB_SESSION_TYPE_P2P) {
                const userInfo = session.session_info.user_info;
                userInfoList.push(userInfo);
                return {
                    sessionId: userInfo.uid,
                    sessionType: session.type,
                    sessionName: userInfo.name,
                    sessionLogo: userInfo.avatar,
                    mute: false // jyf: TODO
                };
            } else if (session.type === WebSessionType.WEB_SESSION_TYPE_GROUP) {
                const groupInfo = session.session_info.group_info;
                return {
                    sessionId: groupInfo.gid,
                    sessionType: session.type,
                    sessionName: groupInfo.name,
                    sessionLogo: groupInfo.avatar,
                    mute: !!groupInfo.silent,
                    memberCount: groupInfo.membercount
                };
            }
        });

        //通过此接口获取到的用户名称一般不使用
        UserAccountStore.onSaveUserAccountList(userInfoList, false);
        SessionsStore.onSessionsJoin(sessions);
    });
});

const selectSessionCmd = createCommand(function (sessionId, {createIfNotExist = false, sessionType = null/**createIfNotExist为true时必传*/} = {}) {
    console.log(sessionId, createIfNotExist, sessionType);
    return Promise.resolve()
        .then(() => {
            if (createIfNotExist && !SessionsStore.getSession(sessionId)) {
                if (sessionType === WebSessionType.WEB_SESSION_TYPE_P2P) {
                    return addP2PSessionCmd(sessionId);
                } else {
                    return queryGroupInfoCmd(sessionId, {insertIfNotExisted: true});
                }
            }
        })
        .then(() => {
            SessionsStore.setSelectedSessionId(sessionId);
        });
});


//updateSessionLastMsgCmd(sessionId,{
//    msgType: EnumMsgType.EmptyMsg,
//    msgSrvTime: new Date().getTime()
//});
const updateSessionLastMsgCmd = createCommand(function(sessionId,lastMsg){
    var session = SessionsStore.getSession(sessionId);
    if(session){
        lastMsg = lastMsg.toJS?lastMsg.toJS():lastMsg;
        session.updateSessionInfo({
            lastMessage: lastMsg
        });
    }
});

const clearSessionUnreadCntCmd = createCommand(function (sessionId) {
    const session = SessionsStore.getSession(sessionId);
    if (session) {
        session.updateSessionInfo({
            unreadMsgCount: 0
        });
    }
});

//const toggleSessionMuteCmd = createCommand(async function ({sessionId, sessionType, mute}) {
//    if (sessionType === WebSessionType.WEB_SESSION_TYPE_P2P) {
//        await SocketManager.rpcRequest('accountproxy.updateUserMute', {
//            uid: LoginStore.getUserInfo().uid,
//            targetUid: sessionId,
//            isMute: mute
//        });
//    } else if (sessionType === WebSessionType.WEB_SESSION_TYPE_GROUP) {
//        await SocketManager.rpcRequest('grpproxy.markSilent', {
//            uid: LoginStore.getUserInfo().uid,
//            gid: sessionId,
//            silent: !!mute
//        });
//    }
//    const session = SessionsStore.getSession(sessionId);
//    if (session) {
//        session.updateSessionInfo({
//            mute: !!mute
//        });
//    }
//}, {
//    getCmdKey: ({sessionId}) => sessionId
//});

const addP2PSessionCmd = createCommand(function (otherUid) {
    var sessionId = otherUid;
    return ensureUserAccountsCmd([otherUid])
        .then(() => {
            const userAccount = UserAccountStore.getUserAccount(otherUid);
            SessionsStore.onSessionsJoin([{
                sessionId: sessionId,
                sessionType: WebSessionType.WEB_SESSION_TYPE_P2P,
                sessionName: userAccount.name,
                sessionLogo: userAccount.avatar,
                mute: false // jyf: TODO
            }]);
            return Promise.resolve({sessionId:sessionId});
        }).then(function(data){

            //创建好P2P会话后,将P2P2会话显示在最上方
            updateSessionLastMsgCmd(sessionId,{
                msgType: EnumMsgType.EmptyMsg,
                msgSrvTime: new Date().getTime()
            });

            return data;
        });
});

const createGroupSessionCmd = createCommand(function ({memberUids}) {

    const myUid = LoginStore.getUserInfo().uid;

    memberUids = [myUid].concat(memberUids);

    var groupName = memberUids.map(uid => {
        var userAccount = UserAccountStore.getUserAccount(uid);
        return  userAccount.name || userAccount['nameAsFriend'];
    }).join(',');

    groupName = groupName.substring(0, 25);

    return SocketManager.rpcRequest('grpproxy.createGroup', {
        uid: myUid,
        friend: memberUids,
        name: groupName
    }).then(response => {
        const groupInfo = response.param.groupFullInfo,
            sessionId = groupInfo.group.gid,
            memberUids = groupInfo.user.map(member => member.uid);
        return ensureUserAccountsCmd(memberUids)
            .then(() => {
                // 有可能因推送先到来而已经存在
                if (!SessionsStore.getSession(sessionId)) {
                    SessionsStore.onSessionsJoin([{
                        sessionId: sessionId,
                        sessionType: WebSessionType.WEB_SESSION_TYPE_GROUP,
                        sessionName: groupInfo.group.name,
                        sessionLogo: groupInfo.group.avatar,
                        mute: !!groupInfo.group.silent,
                        memberCount: groupInfo.user.length,
                        isDetailPulled: true,
                        members: UserAccountStore.getUserAccountList(memberUids).toJS(),
                        managerUids: [myUid]
                    }]);
                }


                return {sessionId:sessionId};
            });
    }, error => {
        toast(StringUtils.formatLocale(getLocale()['groups_nearby_notification5'], groupName));
        __DEV__ && warning(['createGroupSessionCmd', error]);
    });
});

const removeSessionCmd = createCommand(function (sessionId) {
    const session = SessionsStore.getSession(sessionId);
    if (session) {
        SessionsStore.onSessionLeave(sessionId);
        return SocketManager.rpcRequest('websession.deleteWebSession', {
            uid: LoginStore.getUserInfo().uid,
            peer_id: sessionId
        }).catch(err => {
            SessionsStore.onSessionsJoin([session]);
            return Promise.reject(err);
        });
    }
}, {
    getCmdKey: sessionId => sessionId
});

const queryGroupInfoCmd = createCommand(function (gid, {insertIfNotExisted = false} = {}) {
    return SocketManager.rpcRequest('grpproxy.getGroupInfo', {
        uid: LoginStore.getUserInfo().uid,
        gid: gid
    }).then(response => {
        const groupInfo = response.param.groupFullInfo,
            sessionId = groupInfo.group.gid,
            session = SessionsStore.getSession(sessionId),
            memberUids = groupInfo.user.map(member => member.uid);
        return ensureUserAccountsCmd(memberUids)
            .then(() => {
                if (session) {
                    session.updateSessionInfo({
                        sessionName: groupInfo.group.name,
                        sessionLogo: groupInfo.group.avatar,
                        memberCount: groupInfo.user.length,
                        isDetailPulled: true,
                        members: UserAccountStore.getUserAccountList(memberUids).toJS(),
                        managerUids: groupInfo.group.manager
                    });
                } else {
                    if (insertIfNotExisted) {
                        SessionsStore.onSessionsJoin([{
                            sessionId: sessionId,
                            sessionType: WebSessionType.WEB_SESSION_TYPE_GROUP,
                            sessionName: groupInfo.group.name,
                            sessionLogo: groupInfo.group.avatar,
                            mute: !!groupInfo.group.silent,
                            memberCount: groupInfo.user.length,
                            isDetailPulled: true,
                            members: UserAccountStore.getUserAccountList(memberUids).toJS(),
                            managerUids: groupInfo.group.manager
                        }]);
                    }
                }
            });
    });
}, {
    getCmdKey: gid => gid
});

const addGroupMembersCmd = createCommand(function ({gid, memberUids}) {
    return SocketManager.rpcRequest('grpproxy.addGroupUser', {
        uid: LoginStore.getUserInfo().uid,
        gid: gid,
        friend: memberUids
    }).then(() => {
        const session = SessionsStore.getSession(gid);
        if (session) {
            return session.onMembersJoin(memberUids);
        }
    });
});

const removeGroupMembersCmd = createCommand(function ({gid, delMemberUid}) {
    return SocketManager.rpcRequest('grpproxy.removeUser', {
        uid: LoginStore.getUserInfo().uid,
        gid: gid,
        friendId: delMemberUid
    }).then(() => {
        if (delMemberUid === LoginStore.getUserInfo().uid) {
            SessionsStore.onSessionLeave(gid);
        } else {
            const session = SessionsStore.getSession(gid);
            if (session) {
                session.onMemberLeave(delMemberUid);
            }
        }
    });
});

const leaveGroupCmd = createCommand(function (gid) {

    return removeGroupMembersCmd({
        gid: gid,
        delMemberUid: LoginStore.getUserInfo().uid
    });

}, {
    getCmdKey: gid => gid
});

const renameGroupCmd = createCommand(function ({gid, newName}) {
    const session = SessionsStore.getSession(gid);
    if (session.sessionInfo.sessionName === newName || !newName) {
        return Promise.resolve();
    }

    return SocketManager.rpcRequest('grpproxy.groupRename', {
        uid: LoginStore.getUserInfo().uid,
        gid: gid,
        name: newName
    }).then(() => {
        const session = SessionsStore.getSession(gid);
        if (session) {
            session.updateSessionInfo({
                sessionName: newName
            });
        }
    })
});

const updateGroupAvatarCmd = createCommand(function ({gid, newAvatar}) {
    return SocketManager.rpcRequest('grpproxy.updateGroupAvatar', {
        uid: LoginStore.getUserInfo().uid,
        gid: gid,
        groupAvatar: newAvatar
    });
});

const setGroupManagerCmd = createCommand(function ({gid, managerUid}) {
    return SocketManager.rpcRequest('grpproxy.setManager', {
        uid: LoginStore.getUserInfo().uid,
        gid: gid,
        friend: managerUid
    }).then(() => {
        const session = SessionsStore.getSession(gid);
        if (session && session.sessionInfo.managerUids) {
            session.updateSessionInfo({
                managerUids: session.sessionInfo.managerUids.toJS().concat(managerUid)
            });
        }
    });
});


export {
    querySessionsCmd,

    selectSessionCmd,

    clearSessionUnreadCntCmd,

    addP2PSessionCmd,

    removeSessionCmd,

    // group
    createGroupSessionCmd,
    queryGroupInfoCmd,
    addGroupMembersCmd,
    removeGroupMembersCmd,
    leaveGroupCmd,
    renameGroupCmd,
    updateGroupAvatarCmd,
    setGroupManagerCmd,
    updateSessionLastMsgCmd
}
