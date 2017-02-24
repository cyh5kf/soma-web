import React, {PropTypes} from 'react';
import PureRenderComponent from '../PureRenderComponent';
import {showStyle} from '../../utils/JSXRenderUtils';
//import PhotoPickerMenus from './PhotoPickerMenus';
import PhotoPickerCropper from './PhotoPickerCropper';
import BlueLoading from '../../components/loading/BlueLoading';
import Dropdown from '../../components/dropdown/Dropdown';
import Menu, {MenuItem} from '../../components/menu/Menu';
import AccountAvatar from '../UserAvatar/AccountAvatar';
import './PhotoPicker.less';

function getLoadingStyle() {
    return {
        width: 36,
        height: 36,
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop:"-18px",
        marginLeft:"-18px"
    };
}

class PhotoImageView extends PureRenderComponent {

    render(){
        var {size,name,imgSrc,croppedImageURL,isCropPending,isVip,className} = this.props;
        var loadingStyle = getLoadingStyle();
        return (
            <div className="PhotoImageView">
                <div className="grayMask"/>
                {!isCropPending ? <AccountAvatar className={className} isVip={isVip} avatar={imgSrc} name={name} size={size}/> : null}
                {isCropPending ? <BlueLoading style={loadingStyle}/> : null }
                {isCropPending ? <AccountAvatar className="bb" avatar={croppedImageURL} name={name} size={size}/> : null}
            </div>
        );

    }




}


const PhotoImageViewTimeHandler = "PhotoImageViewTimeHandler";

function showPhotoImageViewDropDown(photoPickerComponent, isShow) {
    var PhotoImageViewDropDown = photoPickerComponent.refs['PhotoImageViewDropDown'];
    PhotoImageViewDropDown.setShowPopper(isShow);
}

function onMouseEnterPhotoImageView(photoPickerComponent) {
    showPhotoImageViewDropDown(photoPickerComponent, true);
    if (photoPickerComponent[PhotoImageViewTimeHandler]) {
        clearTimeout(photoPickerComponent[PhotoImageViewTimeHandler]);
        photoPickerComponent[PhotoImageViewTimeHandler] = null;
    }
}

function onMouseLeavePhotoImageView(photoPickerComponent) {
    photoPickerComponent[PhotoImageViewTimeHandler] = setTimeout(()=> {
        showPhotoImageViewDropDown(photoPickerComponent, false);
        photoPickerComponent[PhotoImageViewTimeHandler] = null;
    }, 20);
}



/**
 * 这里没有用组件的Dropdown是因为引入的这个cropbox组件要监听点击事件
 */
export default class PhotoPicker extends PureRenderComponent {

    static propTypes = {
        className: PropTypes.string,
        imgSrc: PropTypes.string,
        menuItems:PropTypes.array,//[{key: '2', content: "Change Photo", action: 'changePhoto'}]
        name: PropTypes.string.isRequired,
        onCropped: PropTypes.func.isRequired,
        onClickMenuItem: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            //isShowActionMenu:false, //弹出菜单
            isEditingImage: false, //正在编辑图片
            isCropPending: false,  //正在上传图片
            sourceImageURL: null, //从本地选中的图片的DataURL
            croppedImageURL: null //编辑完之后的图片的DataURL
        };
        this.isInited = false;
    }

    componentDidMount() {
        var that = this;
        setTimeout(()=>{
            that.isInited = true;
        },300);
    }

    handleFileSelect = (inputFile, evt)=> {
        var that = this;
        var reader = new FileReader();

        reader.onload = function (e) {
            var sourceImageURL = e.target.result;
            that.setState({
                isEditingImage: true,
                sourceImageURL: sourceImageURL
            });
        };

        if (inputFile.files && inputFile.files.length > 0) {
            reader.readAsDataURL(inputFile.files[0]);
        }

    };


    getCropper = ()=>{
        return this.refs['cropper'];
    };


    handleZoomIn = ()=> {
        this.getCropper().zoomIn();
    };

    handleZoomOut = ()=> {
        this.getCropper().zoomOut();
    };

    handleCrop = ()=> {
        var cropper = this.getCropper();
        var imgBase64 = cropper.getDataURL();

        this.setState({isEditingImage: false, croppedImageURL: imgBase64, isCropPending: true});
        this.handleCropped(imgBase64, cropper, ()=> {
            this.setState({isCropPending: false, croppedImageURL: null});
        });

    };


    handleCropped = (imgBase64, cropper, onFinished)=> {
        var {onCropped} = this.props;
        onCropped && onCropped(imgBase64, cropper, onFinished);
    };


    handleMenuSelect = ({key})=> {

        const menuItems = this.props.menuItems;
        const item = menuItems.find(function (m) {
            return m.key === key;
        });

        var {action} = item;

        if(action==='changePhoto'){
            var inputFile = this.refs['fileSelector'];
            inputFile.click();
        }
    };

    renderMenuItems(menuItems) {
        return menuItems.map(function (item) {
            var key = item.key;
            var content = item.content;
            return <MenuItem key={key}>{content}</MenuItem>
        });
    }


    _onFileSelectorChange=(evt)=>{
        var inputFile = this.refs['fileSelector'];
        this.handleFileSelect(inputFile, evt)
    };


    onMouseEnter = ()=>{
        if(!this.isInited){
            return;
        }
        //this.setState({isShowActionMenu:true});
        onMouseEnterPhotoImageView(this);
    };

    onMouseLeave = ()=>{
        //this.setState({isShowActionMenu:false});
        onMouseLeavePhotoImageView(this);
    };

    onMouseEnterDropdown=()=>{
        onMouseEnterPhotoImageView(this);
    };

    onMouseLeaveDropdown=()=>{
        onMouseLeavePhotoImageView(this);
    };

    render() {
        var that = this;
        var {className,imgSrc,name,menuItems,isVip} = that.props;
        var {isEditingImage,isCropPending,croppedImageURL,sourceImageURL} = that.state;

        var viewSize = 80;
        var editSize = 120;
        return (
            <div className={`comp-PhotoPicker ActionArea ${className}`} id={that.id} >

                <input ref="fileSelector" className="fileSelector" type="file" accept="image/png,image/gif,image/jpg,image/jpeg" onChange={this._onFileSelectorChange}  />

                {
                    //!isEditingImage?(
                    //    <div className="imageView" style={{width: viewSize, height: viewSize}} onMouseEnter={that.onMouseEnter} onMouseLeave={that.onMouseLeave}>
                    //        <PhotoImageView {...{size:viewSize,name,imgSrc,croppedImageURL,isCropPending}} />
                    //        <Menu className="PhotoImageViewMenu" onClick={this.handleMenuSelect} style={showStyle(isShowActionMenu)}>
                    //            {this.renderMenuItems(menuItems)}
                    //        </Menu>
                    //    </div>
                    //):null
                }

                {
                    !isEditingImage?(
                        <div className="imageView" onMouseEnter={that.onMouseEnter} onMouseLeave={that.onMouseLeave} >
                            <Dropdown ref="PhotoImageViewDropDown"
                                      onSelect={this.handleMenuSelect}
                                      onMouseEnter={this.onMouseEnterDropdown}
                                      onMouseLeave={this.onMouseLeaveDropdown}
                                      poperClassName="PhotoImageViewPopper"
                                      anchorElement={(<PhotoImageView  {...{size:viewSize,name,imgSrc,isVip,croppedImageURL,isCropPending,className}} />)}>
                                <Menu>{this.renderMenuItems(menuItems)}</Menu>
                            </Dropdown>
                        </div>
                    ):null
                }


                {
                    isEditingImage?(
                        <div className="container">
                            <PhotoPickerCropper ref="cropper"
                                                size={editSize}
                                                className="imageBox"
                                                sourceImageURL={sourceImageURL} />
                            <div className="action">
                                <div className="action1">
                                    <button type="button" className="btnZoomIn ic_add_black" onClick={this.handleZoomIn}/>
                                    <button type="button" className="btnZoomOut ic_minus_black" onClick={this.handleZoomOut}/>
                                </div>
                                <div className="action2">
                                    <button type="button" className="btnCrop ic_right_blue" onClick={this.handleCrop}></button>
                                </div>
                            </div>
                        </div>):null
                }

            </div>
        );
    }


}