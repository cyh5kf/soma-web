import React from 'react';
import moment from 'moment';
import PureRenderComponent from '../../../components/PureRenderComponent';
import focusMsgInput from '../../../core/core-utils/focusMsgInput';
import Dropdown from '../../../components/dropdown/Dropdown';
import Menu, {MenuItem} from '../../../components/menu/Menu';
import AccountAvatar from '../../view-components/AccountAvatar/AccountAvatar';
import {UserProfileSchema} from '../../../core/schemas/LoginSchemas';
import {UserSettingsSchema} from '../../../core/schemas/UserSettingsSchemas';
import {isSessionMuted} from '../../../core/core-utils/SessionUtils';
import {formatDateForRecentSession} from '../../../utils/TimeUtils';
import EnumMsgType from '../../../core/enums/EnumMsgType';
import {SessionListSchema, SessionSchema} from '../../../core/schemas/SessionsSchemas';
import {selectSessionCmd, removeSessionCmd, leaveGroupCmd} from '../../../core/commands/SessionsCommands';
import {toggleSessionMuteCmd} from '../../../core/commands/UserSettingsCommands';
import {addGroupToFavoriteCmd, removeGroupFromFavoriteCmd} from '../../../core/commands/GroupFavoriteCommands';
import ReactPropTypes from '../../../core/ReactPropTypes';
import {WebSessionType} from '../../../core/protos/protos';
import SessionLastMsg from '../../view-components/session-last-msg/SessionLastMsg';
import {formatSessionName} from '../../../core/core-utils/SessionUtils';
import toast from '../../../components/popups/toast';
import {confirmDanger} from '../../../components/popups/confirm';

import './RecentSessions.less';

const KEY_SAVE_TO_CONTACTS = 'save',
    KEY_REMOVE_FROM_FAVORITES = 'remove',
    KEY_MUTE = 'mute',
    KEY_DELETE_SESSION = 'delete',
    KEY_LEAVE_GROUP = 'leave';

export class SessionItem extends PureRenderComponent {
    static propTypes = {
        userInfo: ReactPropTypes.ofSchema(UserProfileSchema).isRequired,
        userSettings: ReactPropTypes.ofSchema(UserSettingsSchema),
        session: ReactPropTypes.ofSchema(SessionSchema).isRequired,
        isSelected: ReactPropTypes.bool.isRequired,
        locale: ReactPropTypes.ofLocale().isRequired,
        timestamp:ReactPropTypes.any
    };

    handleSessionClick = e => {
        const sessionId = e.currentTarget.dataset.sessionId;
        selectSessionCmd(sessionId);
        focusMsgInput();
    };

    handleMenuSelect = ({key}) => {
        const {session, locale ,userSettings} = this.props;
        const isSessionMutedNow = isSessionMuted(userSettings,session);
        switch (key) {
            case KEY_MUTE:
                if (!toggleSessionMuteCmd.isPending(session.sessionId)) {
                    toggleSessionMuteCmd({
                        sessionId: session.sessionId,
                        sessionType: session.sessionType,
                        mute: !isSessionMutedNow
                    }).then(() => {
                        !isSessionMutedNow? toast(locale['baba_chats_chatmute']): toast(locale['baba_chats_mutecancelled']);
                    })
                }
                break;
            case KEY_DELETE_SESSION:
                if (!removeSessionCmd.isPending(session.sessionId)) {
                    removeSessionCmd(session.sessionId);
                }
                break;
            case KEY_SAVE_TO_CONTACTS:
                if (!addGroupToFavoriteCmd.isPending(session.sessionId)) {
                    addGroupToFavoriteCmd(session).then(() => {
                        toast(locale['baba_grpchat_savetocontacts_toast']);
                    }).catch(function () {
                        var errorMsg = locale['common.servererror'];
                        window.alert(errorMsg);
                    });
                }
                break;
            case KEY_REMOVE_FROM_FAVORITES:
                if (!removeGroupFromFavoriteCmd.isPending(session.sessionId)) {
                    removeGroupFromFavoriteCmd(session.sessionId).then(() => {
                        toast(locale['baba_grpchat_dltfromcontacts_toast']);
                    }).catch(function () {
                        var errorMsg = locale['common.servererror'];
                        window.alert(errorMsg);
                    });
                }
                break;
            case KEY_LEAVE_GROUP: {
                const title = locale['circleview.quit'];
                const content = locale['circleview.quitdescription'];
                confirmDanger(title, content, function () {
                    !leaveGroupCmd.isPending(session.sessionId) && leaveGroupCmd(session.sessionId);
                });
                break;
            }
            default:
                window.alert('TODO...');
        }
    };

    //判断session的收藏状态
    getFavoriteStatus=(session, groupFavoriteList)=> {
        var isFavorited = '';
        if(groupFavoriteList) {
            groupFavoriteList.forEach(function(u, i) {
                if(u.gid === session.sessionId) {
                    isFavorited = true;
                    return false;
                } else {
                    isFavorited = false;
                }
            });
            return isFavorited;
        }
        return false;

    };

    renderSessionMenu() {
        const {session, groupFavoriteList, locale, userSettings} = this.props;
        var isFavorited = this.getFavoriteStatus(session, groupFavoriteList);
        if (session.sessionType === WebSessionType.WEB_SESSION_TYPE_P2P) {
            return (
                <Menu>
                    <MenuItem key={KEY_MUTE}>{isSessionMuted(userSettings,session) ? locale['baba_chats_cancelmute'] : locale['common.mute']}</MenuItem>
                    <MenuItem key={KEY_DELETE_SESSION}>{locale['baba_session_deletechat']}</MenuItem>
                </Menu>
            );
        } else if (session.sessionType === WebSessionType.WEB_SESSION_TYPE_GROUP) {
            return (
                <Menu>
                    {
                        isFavorited?
                            <MenuItem key={KEY_REMOVE_FROM_FAVORITES}>{locale['baba_contacts_grpchat_dltfromcontacts']}</MenuItem>:
                            <MenuItem key={KEY_SAVE_TO_CONTACTS}>{locale['baba_contacts_grpchat_savetocontacts']}</MenuItem>
                    }
                    <MenuItem key={KEY_MUTE}>{isSessionMuted(userSettings,session) ? locale['baba_chats_cancelmute'] : locale['common.mute']}</MenuItem>
                    <MenuItem key={KEY_LEAVE_GROUP}>{locale['circleview.quit']}</MenuItem>
                    <MenuItem key={KEY_DELETE_SESSION}>{locale['baba_session_deletechat']}</MenuItem>
                </Menu>
            );
        } else {
            return null;
        }
    }

    renderLastMessage() {
        const {userInfo: {uid: myUid}, session, locale, userSettings} = this.props;
        return <SessionLastMsg loginUid={myUid} session={session} locale={locale} userSettings={userSettings}/>;
    }

    renderLastMessageTime(lastMessage,locale){
        if (!lastMessage || lastMessage.msgType === EnumMsgType.EmptyMsg) {
            return null
        }
        return <div className="session-last-msg-time">{formatDateForRecentSession(lastMessage.msgSrvTime, locale)}</div>;
    }

    render() {
        const {session, isSelected,userSettings,p2pUserAccount,locale} = this.props,
            isP2P = session.sessionType === WebSessionType.WEB_SESSION_TYPE_P2P,
            isVip = (isP2P && p2pUserAccount)? p2pUserAccount.isVip: false,
            {sessionId, lastMessage, unreadMsgCount} = session;


        //P2P聊天中,如果不是我的好友,显示对方手机号,如果对方没有设置头像,头像显示成一个加号
        var displaySessionName = formatSessionName(session,p2pUserAccount);

        return (
            <div className={`session-item ${isSelected ? 'selected' : ''} ${isP2P ? 'p2p-session' : 'group-session'}`} data-session-id={sessionId} onClick={this.handleSessionClick}>
                <AccountAvatar className="recent-sessions-avatar" isVip={isVip} name={displaySessionName} avatar={session.sessionLogo}/>
                <i className="session-logo" style={session.sessionLogo ? {backgroundImage: `url(${session.sessionLogo})`} : {}}/>
                <div className="session-info">
                    <div className="session-first-row">
                        <div className="sessionName-container">
                            <div className="session-name">{displaySessionName}</div>
                            {isSessionMuted(userSettings,session)?<div className="icon-mute"></div>: null}
                        </div>
                        {this.renderLastMessageTime(lastMessage,locale)}
                    </div>
                    <div className="session-second-row">
                        {this.renderLastMessage()}
                        {unreadMsgCount > 0 && <div className="session-unread-msg-cnt">{unreadMsgCount <= 99 ? unreadMsgCount : '99+'}</div>}
                        <Dropdown className="tb-more-session-actions" onSelect={this.handleMenuSelect}>
                            {this.renderSessionMenu(session)}
                        </Dropdown>
                    </div>
                </div>
            </div>
        );
    }
}

export default class RecentSessionsView extends PureRenderComponent {
    static propTypes = {
        userInfo: ReactPropTypes.ofSchema(UserProfileSchema).isRequired,
        userSettings: ReactPropTypes.ofSchema(UserSettingsSchema),
        sessions: ReactPropTypes.ofSchema(SessionListSchema).isRequired,
        selectedSessionId: ReactPropTypes.string,
        locale: ReactPropTypes.ofLocale().isRequired,
        timestamp:ReactPropTypes.any
    };

    render() {
        const {sessions, groupFavoriteList, selectedSessionId, userInfo, userSettings,locale,userAccountMap,timestamp} = this.props;

        return (
            <div className="recent-sessions">
                {sessions.size ? (
                    <div className="session-list">
                        {sessions.map(session => {
                            var p2pUserAccount = (userAccountMap && userAccountMap[session.sessionId]);//p2p聊天这个变量才有意义
                            return <SessionItem key={session.sessionId} session={session} groupFavoriteList={groupFavoriteList} isSelected={session.sessionId === selectedSessionId} userInfo={userInfo} userSettings={userSettings} locale={locale} p2pUserAccount={p2pUserAccount} timestamp={timestamp}/>;
                        })}
                    </div>
                ) : <div className="empty-session-tip"><i className="empty-icon"/>{locale['baba_web_session_empty']}</div>}
            </div>
        );
    }
}
