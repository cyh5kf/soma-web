import React,{PropTypes} from 'react'
import PhotoPicker from '../../../components/PhotoPicker/PhotoPicker';
import {uploadAvatar} from '../../../core/core-utils/UploadUtils';
import ViewMediasDialog from '../../dialogs/ViewMediasDialog/ViewMediasDialog';
import AccountAvatar from '../../view-components/AccountAvatar/AccountAvatar';
import Dialog from '../../../components/dialog/Dialog';
import './AccountEditor.less';

/**
 * Item 的action配置中,支持 viewPhoto 和 changePhoto两种
 */
export default class AvatarEditor extends PhotoPicker {

    static propTypes = {
        ...PhotoPicker.propTypes,
        onCropped: PropTypes.func,
        onAvatarUploaded: PropTypes.func.isRequired,
        onClickMenuItem: PropTypes.func
    };

    showImageAlbum = ()=> {
        var url = this.props.imgSrc || '';
        var ownerName = this.props.name || '';
        var isVip = this.props.isVip;

        var imgObj = {
            ownerAvatar: url,
            ownerName: ownerName,
            createTime: null,
            type: 'component',
            renderComponent:function(){
                return <AccountAvatar className="AccountEditorAvatar" isVip={isVip} avatar={url} name={ownerName} />;
            },
            thumbUrl:''
        };

        Dialog.openDialog(ViewMediasDialog, {
            className:'AccountEditorViewDialog',
            isShowPreNext: false,
            isShowThumb: false,
            isShowForward: false,
            isShowDownload: false,
            currentIndex: 0,
            mediaList: [imgObj]
        });
    };

    handleMenuSelect = ({key,action})=> {

        const menuItems = this.props.menuItems;

        const item = menuItems.find(function (m) {
            return m.key === key;
        });

        if (item.action === 'viewPhoto') {
            this.showImageAlbum();
            return;
        }

        if (item.action === 'changePhoto') {
            var inputFile = this.refs['fileSelector'];
            inputFile.click();
            return;
        }

        var onClickMenuItem = this.props.onClickMenuItem;
        onClickMenuItem && onClickMenuItem(item);

    };

    handleCropped = (imgBase64, cropper, onFinished)=> {
        var {onAvatarUploaded} = this.props;
        var imgBlob = cropper.getBlob();
        uploadAvatar(imgBlob).then(function (result) {
            onAvatarUploaded(result, onFinished);
        },()=>{
            alert("upload error");
            onFinished();
        });
    };

}