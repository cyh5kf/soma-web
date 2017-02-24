import React,{PropTypes} from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import {hideStyle} from '../../../utils/JSXRenderUtils';
import AccountAvatar from '../../view-components/AccountAvatar/AccountAvatar';
import {formatDateAtTime} from '../../../utils/TimeUtils';
import exposeLocale from '../../../components/exposeLocale';
import Dialog from '../../../components/dialog/Dialog';
import ForwardMessageDialog from '../../dialogs/ForwardMessageDialog/ForwardMessageDialog';
import './ViewMediasHeader.less';


function downloadSrc(src, filename = 'download') {
    const anchor = document.createElement('a');
    anchor.href = src;
    anchor.download = filename;
    anchor.click();
}


@exposeLocale()
export default class ViewMediasHeader extends PureRenderComponent {

    static propTypes = {
        onClickClose: PropTypes.func.isRequired,
        media:PropTypes.object.isRequired,
        isShowForward:PropTypes.bool.isRequired,
        isShowDownload:PropTypes.bool.isRequired
    };

    onClickClose = ()=> {
        this.props.onClickClose();
    };

    onClickDownLoad = ()=> {
        var {media} = this.props;
        var {fileUrlOrBlobUrl,ext} = media;
        if (!fileUrlOrBlobUrl) {
            return;
        }

        downloadSrc(fileUrlOrBlobUrl, `download_${Date.now()}.${ext || ''}`);
    };

    onClickForward = ()=> {
        var {media} = this.props;
        var {msg,fileUrlOrBlobUrl} = media;
        if (!fileUrlOrBlobUrl) {
            return;
        }

        this.props.onClickClose();
        Dialog.openDialog(ForwardMessageDialog, {message: msg});
    };

    render() {
        var {media,isShowDownload,isShowForward} = this.props;
        var isCreateTimeExist = !!media.createTime;
        var locale = this.state.locale;

        //目前只有图片资源允许转发
        if (media.type !== 'image') {
            isShowForward = false;
        }

        var disabledDownload = false;
        var disabledForward = false;
        //如果文件没有下载完毕,下载和转发按钮都不可用
        var {fileUrlOrBlobUrl} = media;
        if (!fileUrlOrBlobUrl) {
            disabledDownload = true;
            disabledForward = true;
        }

        return (
            <div className="view-medias-header">
                <AccountAvatar name={media.ownerName} avatar={media.ownerAvatar} />
                <div className={`name-and-time createTime_${isCreateTimeExist}`}>
                    <div className="name">{media.ownerName}</div>
                    <div className="time">{formatDateAtTime(media.createTime,locale)}</div>
                </div>
                <div className="space"></div>
                <div className="right-operation">
                    <div className="btn-icon btn-close AutoFocusInput" onClick={this.onClickClose}></div>
                    <div className={`btn-icon btn-download ${disabledDownload?'disabled':''}`} title={locale['sticker_download_button']} onClick={this.onClickDownLoad} style={hideStyle(!isShowDownload)}></div>
                    <div className={`btn-icon btn-forward ${disabledForward?'disabled':''}`} title={locale['chat_forward']} onClick={this.onClickForward} style={hideStyle(!isShowForward)} ></div>
                </div>
            </div>
        );
    }
}