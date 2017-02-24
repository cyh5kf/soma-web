import React from 'react';
import MessageItemBase from './MessageItemBase';
import Loading from '../../../../components/loading/Loading';
import {decryptFileMsgDataUrlCmd} from '../../../../core/commands/MessagesCommands';
import {getMediaSize} from '../../../../utils/functions';
import {openViewSessionMedias} from '../MessageMediaDialog';
import isNumber from 'lodash/isNumber';
import './ImageMessageItem.less';

const IMG_ITEM_WIDTH = 294;
const IMG_ITEM_PADDING = 3;
//function getImageItemHeight(imgWidth, imgHeight) {
//    const imgDispWidth = IMG_ITEM_WIDTH - IMG_ITEM_PADDING * 2,
//        imgDispHeight = Math.round((imgDispWidth / imgWidth) * imgHeight);
//    return imgDispHeight + IMG_ITEM_PADDING * 2;
//}


function getImageItemSize(imgWidth, imgHeight){
    //288 384
    var maxWidth = 288 + IMG_ITEM_PADDING * 2;
    var maxHeight = 384 + IMG_ITEM_PADDING * 2;
    var size =  getMediaSize(maxWidth,maxHeight,imgWidth,imgHeight);
    return size;
}

export default class ImageMessageItem extends MessageItemBase {
    cls = 'image-msg';

    getMenuConfigs(message) {

        //图片没有下载完,不显示下载按钮和转发按钮
        var {fileUrlOrBlobUrl} = message;
        if(!fileUrlOrBlobUrl){
            return [];
        }

        const {locale} = this.props;
        return [
            {key: MessageItemBase.MENU_DOWNLOAD, label: locale['sticker_download_button']}
            // {key: MessageItemBase.MENU_FORWARD, label: locale['chat_forward']}
        ];
    }

    componentWillMount() {
        const {message} = this.props;
        if (message.fileUrlOrBlobUrl == null && !decryptFileMsgDataUrlCmd.isPending(message.msgId)) {
            decryptFileMsgDataUrlCmd(message)
                .catch(() => `Download image failed: ${message.cryptFileUrl}`);
        }
    }

    openMediaAlbum = ()=>{
        const {message} = this.props;
        openViewSessionMedias(message);
    };


    renderLoading() {
        const {message: {fileUrlOrBlobUrl,uploadStatus}} = this.props;
        if ((isNumber(uploadStatus) && uploadStatus < 100) || !fileUrlOrBlobUrl) {
           return <Loading type="blue-circle" width={36}/>;
        }
        return null;
    }

    renderContent() {
        const {message: {fileUrlOrBlobUrl, thumbDataUrl, imgWidth, imgHeight,fileSize}} = this.props;

        return (
            <div className="message-item-content" style={getImageItemSize(imgWidth, imgHeight)} onClick={this.openMediaAlbum}>
                <img src={fileUrlOrBlobUrl || thumbDataUrl} className="imgContent"/>
                {this.renderLoading()}
            </div>
        );
    }
}
