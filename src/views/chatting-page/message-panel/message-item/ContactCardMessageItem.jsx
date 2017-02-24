import React from 'react';
import MessageItemBase from './MessageItemBase';
import AccountAvatar from '../../../view-components/AccountAvatar/AccountAvatar';
import {decryptContactCardCmd} from '../../../../core/commands/MessagesCommands';
import {selectSessionCmd} from '../../../../core/commands/SessionsCommands';
import {WebSessionType} from '../../../../core/protos/protos';

import './ContactCardMessageItem.less';


function isSomaUser(message){
    var contactUid = message.contactUid;
    if(contactUid && contactUid!=='--'){
        return true;
    }
    return false;
}


export default class ContactCardMessageItem extends MessageItemBase {
    cls = 'contact-card-msg';

    getMenuConfigs() {
        const {locale} = this.props;
        return [
            {key: MessageItemBase.MENU_FORWARD, label: locale['chat_forward']}
        ];
    }

    handleContactCard=()=>{
        const {message} = this.props;
        //如果是SOMA用户
        if(isSomaUser(message)){
            var {contactUid} = message;
            var sessionId = contactUid;
            selectSessionCmd(sessionId, {
                createIfNotExist: true,
                sessionType: WebSessionType.WEB_SESSION_TYPE_P2P
            });
        }
    };

    componentDidMount(){
        const {message} = this.props;
        var {contactUid} = message;
        if(!contactUid){
            decryptContactCardCmd(message);
        }
    }

    renderContent() {
        const {message, locale} = this.props;
        const contactUid = message.contactUid;
        const cls = isSomaUser(message) ? "isContactSomaUser" : "";
        return (
            <div className={`message-item-content ${cls}`} data-contactuid={contactUid||''} onClick={this.handleContactCard}>
                <div className="contact-card-info">
                    <AccountAvatar name={message.contactName} avatar={message.contactAvatar}/>
                    {message.contactName}
                </div>
                <span className="contact-card-desc">{locale['omg_contact_card']}</span>
            </div>
        );
    }
}
