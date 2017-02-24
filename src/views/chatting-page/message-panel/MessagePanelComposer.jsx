import React from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import MessageListView from './MessageListView';
import MessagePanelHeader from './MessagePanelHeader';
import MessageInputView from '../message-input/MessageInputView';
import {UserSettingsSchema} from '../../../core/schemas/UserSettingsSchemas';
import UserSettingsStore from '../../../core/stores/UserSettingsStore';
import exposeSessionData from '../../view-components/exposeSessionData';
import exposeStoreData from '../../view-components/exposeStoreData';
import EnumMsgStatus from '../../../core/enums/EnumMsgStatus';
import {isUserBlocked} from '../../../core/core-utils/SessionUtils';
import EnumMsgType from '../../../core/enums/EnumMsgType';
import {sendP2PTextMsg, sendGroupTextMsg, msgsAckCmd, sendFileMsgCmd ,markSessionReadCmd} from '../../../core/commands/MessagesCommands';
import {clearSessionUnreadCntCmd} from '../../../core/commands/SessionsCommands';
import LoginStore, {LOGIN_EVENTS} from '../../../core/stores/LoginStore';
import {WebSessionType} from '../../../core/protos/protos';
import ReactPropTypes from '../../../core/ReactPropTypes';

import './MessagePanel.less';

@exposeSessionData({sessionInfo: true, messages: true})
@exposeStoreData([
    [LoginStore, LOGIN_EVENTS.CHANGE, () => ({
        loginUid: LoginStore.getUserInfo().uid
    })]
])
export default class MessagePanelComposer extends PureRenderComponent {
    static propTypes = {
        sessionId: ReactPropTypes.string,
        userSettings: ReactPropTypes.ofSchema(UserSettingsSchema),
        locale: ReactPropTypes.ofLocale().isRequired
    };

    sendMessage = (msg,msgType) => {
        const {sessionInfo: {sessionId, sessionType}} = this.state;

        if (msgType === EnumMsgType.Text) {

            switch (sessionType) {
                case WebSessionType.WEB_SESSION_TYPE_P2P:
                    return sendP2PTextMsg({
                        touid: sessionId,
                        text: msg
                    });
                case WebSessionType.WEB_SESSION_TYPE_GROUP:
                    return sendGroupTextMsg({
                        gid: sessionId,
                        text: msg
                    });
            }
        }

        else if (msgType === EnumMsgType.Image) {

            return sendFileMsgCmd({
                msgType: msgType,
                sessionId: sessionId,
                sessionType: sessionType,
                file: msg
            });

        }
        else {
            console.error("error msg type")
        }

    };


    async clearUnreadMessages(sessionInfo, messages) {
        const {loginUid} = this.state;

        const unreadMsgs = messages.filter(msg => {
            return msg.msgType !== EnumMsgType.SystemMsg && msg.fromUid !== loginUid && msg.msgStatus !== EnumMsgStatus.OtherReadAcked && !msgsAckCmd.isPending(`${msg.msgId}-read`);
        });

        if (unreadMsgs.size) {
            const {userSettings} = this.props;
            //如果已读回执关闭,不给对方发送已读回执.
            if (UserSettingsStore.isHaveReadPrivacy()) {
                //只有P2P消息才会发ACK
                if(sessionInfo.sessionType === WebSessionType.WEB_SESSION_TYPE_P2P){
                    await msgsAckCmd(unreadMsgs, true);
                }
            }

            //发通知给移动端
            markSessionReadCmd(sessionInfo, messages);
        }


        if (sessionInfo.unreadMsgCount) {
            clearSessionUnreadCntCmd(sessionInfo.sessionId);
        }
    }


    componentWillMount() {
        const {sessionInfo, messages} = this.state || {};
        sessionInfo && messages && this.clearUnreadMessages(sessionInfo, messages);
    }

    componentWillUpdate(nextProps, nextState) {
        if (this.state.sessionInfo !== nextState.sessionInfo || this.state.messages !== nextState.messages) {
            if (nextState.sessionInfo && nextState.messages) {
                this.clearUnreadMessages(nextState.sessionInfo, nextState.messages);
            }
        }
    }

    render() {
        const {locale,userSettings, userAccountMap} = this.props,
            {sessionInfo, messages, loginUid} = this.state;
        if (!sessionInfo) {
            return (
                <div className="message-panel empty-panel">
                    <div className="empty-panel-tip">
                        <i className="empty-icons"/>
                        <span className="empty-tip-text">{locale['baba_web_chat_select']}</span>
                    </div>
                </div>
            );
        } else {

            //只对P2P有效
            var isBlocked = isUserBlocked(userSettings,sessionInfo);
            return (
                <div className={`message-panel ${sessionInfo.notInGroup ? 'disable-actions' : ''}`}>
                    <MessagePanelHeader sessionInfo={sessionInfo} locale={locale}/>
                    <MessageListView sessionInfo={sessionInfo} messages={messages} userAccountMap={userAccountMap} loginUid={loginUid} locale={locale} userSettings={userSettings}/>
                    <MessageInputView sendMessage={this.sendMessage} isBlocked={isBlocked} locale={locale} sessionInfo={sessionInfo}/>
                </div>
            );
        }
    }
}
