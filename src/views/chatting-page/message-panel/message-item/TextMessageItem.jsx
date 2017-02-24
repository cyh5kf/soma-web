import React from 'react';
import MessageItemBase from './MessageItemBase';
import {textToEmojifyHtml} from '../../../../components/emojify/Emojify';

import './TextMessageItem.less';

// 两种类型匹配Link: 1. http://foo  2. foo.com
const RE_LINK = /((http|https|ftp)(:|&#58;)\/\/\w+[^<>"\s]*)|((\w+\.)+(com|hk|cn|org|im)(\/[^<>"\s]*|\/?))/g;
function parseLinkHtml(html) {
    //'<a target="_blank" href="$&">$&</a>'
    return html.replace(RE_LINK, function(x){
        if(x.indexOf('http://')===0 || x.indexOf('https://')===0 || x.indexOf('https&#58;//')===0 || x.indexOf('http&#58;//')===0){
            x = x.replace(/^https&#58;\/\//,"https://");
            x = x.replace(/^http&#58;\/\//,"http://");
            return `<a target="_blank" href="${x}">${x}</a>`;
        }else {
            return `<a target="_blank" href="http://${x}">${x}</a>`;
        }
    });
}

export default class TextMessageItem extends MessageItemBase {
    cls = 'text-msg';
    shouldRenderTimeAndStatus = false;

    getMenuConfigs() {
        const {locale} = this.props;
        return [
            {key: MessageItemBase.MENU_COPY, label: locale['copy']},
            {key: MessageItemBase.MENU_FORWARD, label: locale['chat_forward']}
        ];
    }

    parseTextDecrypted =({textDecrypted,text})=>{
        return textToEmojifyHtml({textDecrypted,defaultText:text});
    };

    renderContent() {
        const {message} = this.props,
            textHtml = parseLinkHtml(this.parseTextDecrypted(message));

        return (
            <div className="message-item-content">
                <span dangerouslySetInnerHTML={{__html:textHtml}}></span>
                {this.renderTimeAndStatus('ts-placeholder')}
                {this.renderTimeAndStatus()}
            </div>
        );
    }
}
