import React,{PropTypes} from 'react';
import FullScreenDialog from '../../../components/dialog/FullScreenDialog';
import {classNames,hideStyle} from '../../../utils/JSXRenderUtils';
import ViewMediasItem from './ViewMediasItem';
import ViewMediasThumbs from './ViewMediasThumbs';
import './ViewMediasDialog.less';


export default class ViewMediasDialog extends FullScreenDialog {

    static propTypes = {
        ...FullScreenDialog.propTypes,
        isShowPreNext: PropTypes.bool.isRequired,
        isShowThumb: PropTypes.bool.isRequired,
        isShowForward: PropTypes.bool.isRequired,
        isShowDownload: PropTypes.bool.isRequired,
        currentIndex: PropTypes.number.isRequired,
        mediaList: PropTypes.array.isRequired //暂时还不知道这里真实的数据类型,也可能是个immutable.list
    };


    static defaultProps = {
        className:'',
        isShowPreNext: true,
        isShowThumb: true,
        isShowForward: true,
        isShowDownload: false,
        mediaList: [],
        currentIndex: 0
    };

    constructor(props) {
        super(...arguments);
        console.log(arguments);

        this.className += ' dlg-ViewMediasDialog';
        this.state = {
            show: true, //这个属性是Dialog要的,要不然显示不出来.
            currentIndex: props.currentIndex || 0,
            mediaList: props.mediaList || []
        };

    }

    componentWillMount() {
        if (super.componentWillMount) {
            super.componentWillMount(...arguments);
        }
        document.addEventListener('keydown', this._handleKeyDownEvent);
    }

    componentWillUnmount() {
        if (super.componentWillUnmount) {
            super.componentWillUnmount(...arguments);
        }
        document.removeEventListener('keydown', this._handleKeyDownEvent);
    }

    _handleKeyDownEvent = (e)=> {
        var currentIndex = this.state.currentIndex;
        var keyCode = e.keyCode;
        if (keyCode === 37 || keyCode === 38) { //Left Up
            currentIndex = currentIndex - 1;
        }

        if (keyCode === 39 || keyCode === 40) { //Right Down
            currentIndex = currentIndex + 1;
        }

        if (currentIndex < 0) {
            currentIndex = 0;
        }
        if (currentIndex > this.state.mediaList.length - 1) {
            currentIndex = this.state.mediaList.length - 1;
        }

        this.setState({currentIndex: currentIndex});
    };

    /**
     * 点击缩略图
     */
    onClickThumbItem = (currentIndex)=> {
        this.setState({currentIndex: currentIndex});
    };

    /**
     * 上一个
     */
    onClickPreMedia = (isDisabledPre)=> {
        if (isDisabledPre) {
            return;
        }
        var currentIndex = this.state.currentIndex;
        currentIndex = currentIndex - 1;
        this.setState({currentIndex: currentIndex});
    };

    /**
     * 下一个
     */
    onClickNextMedia = (isDisabledNext)=> {
        if (isDisabledNext) {
            return;
        }
        var currentIndex = this.state.currentIndex;
        currentIndex = currentIndex + 1;
        this.setState({currentIndex: currentIndex});
    };


    renderContent() {
        var that = this;
        var mediaList = this.state.mediaList || [];
        var currentIndex = this.state.currentIndex;
        var mediasCount = mediaList.length;
        var {isShowThumb,isShowPreNext,isShowDownload,isShowForward,className} = this.props;
        var isDisabledPre = currentIndex <= 0;
        var isDisabledNext = currentIndex >= (mediasCount - 1);
        //var {thumbLeftPadding,thumbRightPadding} = this.calculateThumbPadding(mediasCount,currentIndex);
        return (
            <div className={`view-medias-dialog ${className}`}>

                {
                    mediaList.map(function (media, i) {
                        var isCurrent = (i === currentIndex);
                        return <ViewMediasItem key={i}
                                               media={media}
                                               onClickClose={that.onCloseClick}
                                               isShowDownload={isShowDownload}
                                               isShowForward={isShowForward}
                                               isShow={isCurrent} />
                    })
                }

                <div style={hideStyle(!isShowPreNext)}
                     className={classNames({'left-button':true,'disabled':isDisabledPre})}
                     onClick={()=>that.onClickPreMedia(isDisabledPre)}>
                    <div className="left-icon"></div>
                </div>

                <div style={hideStyle(!isShowPreNext)}
                     className={classNames({'right-button':true,'disabled':isDisabledNext})}
                     onClick={()=>that.onClickNextMedia(isDisabledNext)}>
                    <div className="right-icon"></div>
                </div>

                <ViewMediasThumbs mediaList={mediaList} isShowThumb={isShowThumb} currentIndex={currentIndex}
                                  onClickThumbItem={that.onClickThumbItem}/>

            </div>
        );
    }
}