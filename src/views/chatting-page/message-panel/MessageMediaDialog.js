import React from 'react';
import ViewMediasDialog from '../../dialogs/ViewMediasDialog/ViewMediasDialog';
import Dialog from '../../../components/dialog/Dialog';
import SessionsStore, {SINGLE_SESSION_EVENTS} from '../../../core/stores/SessionsStore';
import {decryptFileMsgDataUrlCmd} from '../../../core/commands/MessagesCommands';
import EnumMsgType from '../../../core/enums/EnumMsgType';

//
//function getMessageMediaDataUrl(msg){
//    var fileUrlOrBlobUrl = msg.fileUrlOrBlobUrl;
//    if (fileUrlOrBlobUrl) {
//        return fileUrlOrBlobUrl;
//    }
//
//    decryptFileMsgDataUrlCmd(msg);
//
//    return null;
//}

class MessageSessionMediaDialog extends ViewMediasDialog {

    static propTypes = {
        ...ViewMediasDialog.propTypes,
        sessionId: React.PropTypes.string,
        msgId: React.PropTypes.string
    };

    constructor(props) {
        super(...arguments);
    }

    componentWillMount() {
        if (super.componentWillMount) {
            super.componentWillMount(...arguments);
        }

        this._updateSessionData(this.props.sessionId, true);
        SessionsStore.on(SINGLE_SESSION_EVENTS.MESSAGES_CHANGE, this._handleSingleSessionDataChange);
    }

    //计算当前点击的message在imageList中的索引
    _calculateCurrentImageIndex = (imageList, msgId)=> {
        for (var i = 0; i < imageList.length; i++) {
            var m = imageList[i];
            if (msgId === m.msgId) {
                return i;
            }
        }
        return -1;
    };

    _calculateImageList = (messageList)=> {
        var imageList = [];
        messageList.forEach((msg)=> {
            var {thumbDataUrl,msgId,msgType,fromNameDisplay,fromAvatar,msgSrvTime,imgWidth,playDuration,imgHeight,fileUrlOrBlobUrl,ext} = msg;
            if (msgType === EnumMsgType.Image) {
                imageList.push({
                    ownerAvatar: fromAvatar,
                    ownerName: fromNameDisplay,
                    createTime: msgSrvTime,
                    width: imgWidth,
                    height: imgHeight,
                    ext: ext,
                    type: 'image',
                    fileUrlOrBlobUrl: msg.fileUrlOrBlobUrl,
                    getFileUrlOrBlobUrl: ()=>decryptFileMsgDataUrlCmd(msg),
                    thumbUrl: fileUrlOrBlobUrl || thumbDataUrl,
                    msg:msg,//为了转发
                    msgId: msgId //此字段ViewMediasDialog字段用不到,只是在此处为了定位索引使用
                });
            }

            else if (msgType===EnumMsgType.Video){
                imageList.push({
                    ownerAvatar: fromAvatar,
                    ownerName: fromNameDisplay,
                    createTime: msgSrvTime,
                    width:imgWidth,
                    height:imgHeight,
                    ext: ext,
                    type: 'video',
                    playDuration:playDuration,
                    fileUrlOrBlobUrl:msg.fileUrlOrBlobUrl,
                    getFileUrlOrBlobUrl:()=>decryptFileMsgDataUrlCmd(msg),
                    thumbUrl: thumbDataUrl,
                    msg:msg,//为了转发
                    msgId: msgId //此字段ViewMediasDialog字段用不到,只是在此处为了定位索引使用
                });
            }

        });
        return imageList;
    };

    _updateSessionData = (sessionId, isUpdateCurrentIndex)=> {
        const session = sessionId && SessionsStore.getSession(sessionId);
        const messages = (session && session.messages) || [];
        const imageList = this._calculateImageList(messages);
        if (isUpdateCurrentIndex) {
            const msgId = this.props.msgId;
            const currentIndex = this._calculateCurrentImageIndex(imageList, msgId);
            this.setState({mediaList: imageList, currentIndex: currentIndex});
        } else {
            this.setState({mediaList: imageList});
        }
    };

    _handleSingleSessionDataChange = ({sessionId}) => {
        if (this.props.sessionId === sessionId) {
            this._updateSessionData(sessionId, false);
        }
    };

    componentWillUnmount() {
        if (super.componentWillUnmount) {
            super.componentWillUnmount(...arguments);
        }
        SessionsStore.off(SINGLE_SESSION_EVENTS.MESSAGES_CHANGE, this._handleSingleSessionDataChange);
    }

}


//目前只支持图片查看
export function openViewSessionMedias(targetMessage) {
    var {sessionId,msgId} = targetMessage;
    Dialog.openDialog(MessageSessionMediaDialog, {sessionId: sessionId, msgId: msgId, isShowDownload:true});
}