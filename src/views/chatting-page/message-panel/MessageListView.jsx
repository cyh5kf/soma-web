import React from 'react';
import {findDOMNode} from 'react-dom';
import moment from 'moment';
import PureRenderComponent from '../../../components/PureRenderComponent';
import AccountAvatar from '../../view-components/AccountAvatar/AccountAvatar';
import ExpiredMessageItem from  './message-item/ExpiredMessageItem';
import TextMessageItem from  './message-item/TextMessageItem';
import ImageMessageItem from  './message-item/ImageMessageItem';
import AudioMessageItem from  './message-item/AudioMessageItem';
import VideoMessageItem from  './message-item/VideoMessageItem';
import LocationMessageItem from  './message-item/LocationMessageItem';
import ContactCardMessageItem from  './message-item/ContactCardMessageItem';
import EnumMsgType from '../../../core/enums/EnumMsgType';
import {MessageListSchema} from '../../../core/schemas/MessageSchemas';
import {SessionSchema} from '../../../core/schemas/SessionsSchemas';
import {WebSessionType} from '../../../core/protos/protos';
import {selectSessionCmd} from '../../../core/commands/SessionsCommands';
import ReactPropTypes from '../../../core/ReactPropTypes';

import './MessageListView.less';

const messageItemComponentMap = {
    [EnumMsgType.ExpiredMsg]: ExpiredMessageItem,
    [EnumMsgType.Text]: TextMessageItem,
    [EnumMsgType.Image]: ImageMessageItem,
    [EnumMsgType.Audio]: AudioMessageItem,
    [EnumMsgType.Video]: VideoMessageItem,
    [EnumMsgType.Location]: LocationMessageItem,
    [EnumMsgType.ContactCard]: ContactCardMessageItem
};


function isUserVip(userAccountMap, uid) {
    let userAccount = (userAccountMap && userAccountMap[uid]);
    if (!userAccount) {
        return false;
    }
    let isVip = userAccount.isVip !== undefined ? userAccount.isVip : false;
    return isVip;
}

export default class MessageListView extends PureRenderComponent {
    static propTypes = {
        sessionInfo: ReactPropTypes.ofSchema(SessionSchema),
        messages: ReactPropTypes.ofSchema(MessageListSchema),
        loginUid: ReactPropTypes.string.isRequired,
        locale: ReactPropTypes.ofLocale().isRequired
    };


    /**@returns {Array.<{timeLine: number, msgUserGroups: Array.<{userFirstMsg: Message, messages: Array.<Messages>}>}>}*/
    _getMessageGroups() {
        const {messages} = this.props,
            msgTimeGroups = [],
            ONE_DAY_INTERVAL = 24*60*60*1000;
        let currTimeGrp = null,
            currUserGrp = null;
        messages.forEach(msg => {
            const timeLine = msg.msgSrvTime,
                dateNum = (new Date(timeLine)).getDate(),
                isSysMsg = msg.msgType === EnumMsgType.SystemMsg,
                handleNewGroupMsg = () => {
                    if (isSysMsg) {
                        currUserGrp = null;
                        currTimeGrp.msgUserGroups.push({
                            isSysMsg: true,
                            message: msg
                        });
                    } else {
                        currUserGrp = {
                            userFirstMsg: msg,
                            messages: [msg]
                        };
                        currTimeGrp.msgUserGroups.push(currUserGrp);
                    }
                };
            if (currTimeGrp && currTimeGrp.dateNum === dateNum && Math.abs(currTimeGrp.timeLine - timeLine) <= ONE_DAY_INTERVAL) { // 同一时间分组
                if (currUserGrp && !isSysMsg && currUserGrp.userFirstMsg.fromUid === msg.fromUid) { // 同一用户分组
                    currUserGrp.messages.push(msg);
                } else { // 不同用户分组
                    handleNewGroupMsg();
                }
            } else { // 不同时间分组
                currTimeGrp = {
                    timeLine: timeLine,
                    dateNum: dateNum,
                    msgUserGroups: []
                };
                msgTimeGroups.push(currTimeGrp);
                handleNewGroupMsg();
            }
        });

        return msgTimeGroups;
    }

    componentWillUpdate(nextProps, nextState) {
        let needScrollToBottom = false;
        const dom = findDOMNode(this);
        // 更新前滚动条在底部，则更新后保持滚动到底部
        needScrollToBottom = needScrollToBottom || (dom.scrollTop >= (dom.scrollHeight - dom.clientHeight));
        const getLastMsgId = messages => messages && messages.size ? messages.last().msgId : null,
            newLastMsgId = getLastMsgId(nextProps.messages);
        if (newLastMsgId && newLastMsgId !== getLastMsgId(this.props.messages)) {

        }
        const {messages: nextMessages} = nextProps;
        // 有自己发送的新消息时，滚动到底部
        if (!needScrollToBottom && nextMessages && nextMessages.size > (this.props.messages ? this.props.messages.size : 0)) {
            if (nextMessages.last().fromUid === nextProps.loginUid) {
                needScrollToBottom = true;
            }
        }

        this._needScrollToBottom = needScrollToBottom;
    }
    componentDidUpdate() {
        if (this._needScrollToBottom) {
            const dom = findDOMNode(this);
            dom.scrollTop = dom.scrollHeight - dom.clientHeight;
        }
    }


    onClickAccountAvatar = (userFirstMsg)=> {
        var sessionId = userFirstMsg.fromUid;
        selectSessionCmd(sessionId, {
            createIfNotExist: true,
            sessionType: WebSessionType.WEB_SESSION_TYPE_P2P
        });
    };


    renderWithData() {
        const that = this;
        const {sessionInfo, loginUid, locale, userSettings, userAccountMap} = this.props,
            isGroup = sessionInfo.sessionType === WebSessionType.WEB_SESSION_TYPE_GROUP,
            msgTimeGroups = this._getMessageGroups(),
            content = [],
            nowDate = new Date(Date.now()),
            todayDateNum = nowDate.getDate();
        nowDate.setHours(0);
        nowDate.setMinutes(0);
        nowDate.setSeconds(0);
        nowDate.setMilliseconds(0);

        const todayStartTime = nowDate.getTime();
        nowDate.setDate(todayDateNum - 1);
        const yesterdayStartTime = nowDate.getTime();
        nowDate.setDate(todayDateNum - 6);
        const lastWeekStartTime = nowDate.getTime();

        msgTimeGroups.forEach(msgTimeGrp => {
            const {timeLine, msgUserGroups} = msgTimeGrp;
            let timeLineLabel = null;
            if (timeLine > todayStartTime) {
                timeLineLabel = locale['baba_today'];
            } else if (timeLine > yesterdayStartTime) {
                timeLineLabel = locale['common.time.yesterday'];
            } else if (timeLine > lastWeekStartTime) {
                timeLineLabel = moment(timeLine).format('dddd');
            } else {
                timeLineLabel = moment(timeLine).format('YYYY-MM-DD');
            }
            content.push(<div key={`tl-${timeLine}`} className="msg-timeline-wrapper">
                <div className="msg-timeline-label">{timeLineLabel}</div>
            </div>);
            msgUserGroups.forEach(msgUserGrp => {
                if (msgUserGrp.isSysMsg) {
                    const sysMsg = msgUserGrp.message;
                    content.push(
                        <div key={sysMsg.msgId} className="ActionArea sys-msg-wrapper">
                            <div className="sys-msg-content">{sysMsg.text}</div>
                        </div>
                    );
                } else {
                    const {userFirstMsg} = msgUserGrp,
                        isSelf = userFirstMsg.fromUid === loginUid;
                    let senderNameLabel = userFirstMsg.fromNameDisplay || userFirstMsg.fromUid;
                    let isVip = isUserVip(userAccountMap,userFirstMsg.fromUid);
                    content.push(
                        <div key={`ug-${userFirstMsg.msgId}`}
                             className={`ActionArea user-msgs-container ${isSelf ? 'own-msgs' : ''}`}>
                            {isGroup && !isSelf && <div className="msg-sender-name">{senderNameLabel}</div>}
                            <div className="user-msg-list">
                                {msgUserGrp.messages.map(msg => {
                                    const msguuid = msg.msgId,
                                        MessageItemComponent = messageItemComponentMap[msg.msgType];
                                    return MessageItemComponent ? <MessageItemComponent key={msguuid} message={msg} loginUid={loginUid} locale={locale} userSettings={userSettings}/> : null;
                                })}
                            </div>
                            
                            {isGroup && !isSelf && <AccountAvatar className="msg-sender-logo"
                                onClick={that.onClickAccountAvatar} data={userFirstMsg}
                                name={senderNameLabel} avatar={userFirstMsg.senderavatar} isVip={isVip}/>}
                        </div>
                    );
                }
            });
        });

        return (
            <div className={`message-list-view ${isGroup ? 'group-chat' : 'p2p-chat'}`}>
                {content}
            </div>
        );
    }

    render() {
        if (this.props.messages && this.props.sessionInfo) {
            if (this.props.messages.size) {
                return this.renderWithData();
            } else {
                return <div className="message-list-view empty-message-view">{this.props.locale['baba_web_newmsg_none']}</div>;
            }
        } else {
            return <div className="message-list-view "></div>;
        }
    }
}
