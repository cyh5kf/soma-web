import React,{PropTypes} from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import {hideStyle} from '../../../utils/JSXRenderUtils';
import ViewMediasThumb from './ViewMediasThumb';
import './ViewMediasThumbs.less';

export default class ViewMediasThumbs extends PureRenderComponent {

    static propTypes = {
        currentIndex: PropTypes.number.isRequired,
        onClickThumbItem: PropTypes.func.isRequired,
        isShowThumb:PropTypes.bool.isRequired,
        mediaList:PropTypes.array.isRequired //暂时还不知道这里真实的数据类型,也可能是个immutable.list
    };


    renderLeft(width) {
        var {mediaList,currentIndex,onClickThumbItem} = this.props;

        var thumbs = mediaList.map(function (media, i) {
            if (i >= currentIndex) {
                return null;
            }
            return <ViewMediasThumb key={i} isCurrent={false} media={media} onClickThumb={()=>onClickThumbItem(i)}/>
        });
        thumbs = thumbs.reverse();
        return <div className="thumb-left" style={{width:width}}>{thumbs}</div>
    }

    renderCurrent() {
        var {mediaList,currentIndex,onClickThumbItem} = this.props;
        var thumbs = mediaList.map(function (media, i) {
            if (i !== currentIndex) {
                return null;
            }
            return <ViewMediasThumb key={i} isCurrent={true} media={media} onClickThumb={()=>onClickThumbItem(i)}/>
        });
        return <div className="thumb-current">{thumbs}</div>
    }

    renderRight(width) {
        var {mediaList,currentIndex,onClickThumbItem} = this.props;
        var thumbs = mediaList.map(function (media, i) {
            if (i <= currentIndex) {
                return null;
            }
            return <ViewMediasThumb key={i} isCurrent={false} media={media} onClickThumb={()=>onClickThumbItem(i)}/>
        });
        return <div className="thumb-right" style={{width:width}}>{thumbs}</div>
    }

    render() {
        var clientWidth = window.document.body.clientWidth;
        var sideWidth = (clientWidth-100)/2;
        var {isShowThumb} = this.props;
        return (
            <div className="view-medias-thumbs" style={hideStyle(!isShowThumb)}>
                {this.renderLeft(sideWidth)}
                {this.renderCurrent()}
                {this.renderRight(sideWidth)}
            </div>
        );
    }
}