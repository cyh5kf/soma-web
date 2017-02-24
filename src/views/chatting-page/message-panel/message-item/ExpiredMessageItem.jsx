import React from 'react';
import MessageItemBase from './MessageItemBase';

import './ExpiredMessageItem.less';

export default class ExpiredMessageItem extends MessageItemBase {
    cls = 'expired-msg';

    renderContent() {
        const {locale} = this.props;

        return <div className="message-item-content">{locale['baba_expire_msg']}</div>;
    }
}
