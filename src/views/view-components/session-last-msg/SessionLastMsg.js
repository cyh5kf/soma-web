import React from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import {textToEmojifyHtml} from '../../../components/emojify/Emojify';
import TimeUtils from '../../../utils/TimeUtils';
import {WebSessionType} from '../../../core/protos/protos';
import EnumMsgType from '../../../core/enums/EnumMsgType';
import EnumMsgStatus from '../../../core/enums/EnumMsgStatus';
import {SessionSchema} from '../../../core/schemas/SessionsSchemas';
import ReactPropTypes from '../../../core/ReactPropTypes';

import './SessionLastMsg.less';

const MY_MSG_STATUS_MAP = {
    [EnumMsgStatus.MySendFailed]: 'failed',
    [EnumMsgStatus.MySending]: 'sending',
    [EnumMsgStatus.MySent]: 'sent',
    [EnumMsgStatus.MyReceived]: 'received',
    [EnumMsgStatus.MyRead]: 'read'
};

export default class SessionLastMsg extends PureRenderComponent {
    static propTypes = {
        loginUid: ReactPropTypes.string.isRequired,
        session: ReactPropTypes.ofSchema(SessionSchema).isRequired,
        locale: ReactPropTypes.ofLocale().isRequired
    };



    render() {
        const {loginUid, session: {lastMessage, sessionType}, locale} = this.props;
        if (!lastMessage || lastMessage.msgType === EnumMsgType.EmptyMsg) {
            return <div className="session-last-msg"></div>;
        }
        let msgIconcls = null,
            msgDisplay = null,
            senderDisplay = null,
            isSysMsg = lastMessage.msgType === EnumMsgType.SystemMsg;
        switch (lastMessage.msgType) {
            case EnumMsgType.ExpiredMsg:
                msgDisplay = locale['baba_expire_msg'];
                break;
            case EnumMsgType.SystemMsg:
                msgDisplay = lastMessage.text;
                break;
            case EnumMsgType.Text:
                msgDisplay = textToEmojifyHtml({
                    textDecrypted:lastMessage.textDecrypted,
                    defaultText:lastMessage.text
                });
                break;
            case EnumMsgType.Image:
                msgIconcls = 'image-msg';
                msgDisplay = locale['inbox.p2p.photo'];
                break;
            case EnumMsgType.Audio:
                msgIconcls = 'audio-msg';
                msgDisplay = TimeUtils.formatDuration(lastMessage.playDuration);
                break;
            case EnumMsgType.Video:
                msgIconcls = 'video-msg';
                msgDisplay = locale['VIDEO'];
                break;
            case EnumMsgType.Location:
                msgIconcls = 'location-msg';
                msgDisplay = locale['send_location_title'];
                break;
            case EnumMsgType.ContactCard:
                msgIconcls = 'contact-msg';
                msgDisplay = locale['baba_contact'];
                break;
        }
        if (sessionType === WebSessionType.WEB_SESSION_TYPE_GROUP && !isSysMsg) {
            const senderName = lastMessage.fromUid === loginUid ? locale['baba_grpchat_me'] : (lastMessage.fromNameDisplay || lastMessage.fromUid);
            senderDisplay = <span className="msg-sender-info">{senderName}: </span>;
        }

        return (
            <div className="session-last-msg">
                {sessionType === WebSessionType.WEB_SESSION_TYPE_P2P && !isSysMsg && lastMessage.fromUid === loginUid && <i className={`msg-status-icon ${MY_MSG_STATUS_MAP[lastMessage.msgStatus]}`}/>}
                {senderDisplay}
                {!!msgIconcls && <i className={`msg-type-icon ${msgIconcls}`}/>}
                <span className={isSysMsg ? 'sys-msg-display' : 'other-msg-display'} dangerouslySetInnerHTML={{__html:msgDisplay}}></span>
            </div>
        );
    }
}