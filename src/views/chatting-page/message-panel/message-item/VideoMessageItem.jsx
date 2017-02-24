import React from 'react';
import MessageItemBase from './MessageItemBase';
import {openViewSessionMedias} from '../MessageMediaDialog';
import './VideoMessageItem.less';

export default class VideoMessageItem extends MessageItemBase {
    cls = 'video-msg';

    openMediaAlbum = ()=>{
        const {message} = this.props;
        openViewSessionMedias(message);
    };

    getMenuConfigs() {
        const {locale} = this.props;
        return [
            {key: MessageItemBase.MENU_DOWNLOAD, label: locale['sticker_download_button']}
            // {key: MessageItemBase.MENU_FORWARD, label: locale['chat_forward']}
        ];
    }

    renderContent() {
        const {message} = this.props;
        return (
            <div className="message-item-content">
                <div className="video-thumbnail" style={{backgroundImage: `url(${message.thumbDataUrl})`}} onClick={this.openMediaAlbum}></div>
            </div>
        );
    }
}
