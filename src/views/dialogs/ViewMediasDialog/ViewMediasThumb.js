import React,{PropTypes} from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import {classNames} from '../../../utils/JSXRenderUtils';

function formatTimeNumber(num){
    if(num < 10){
        return "0"+ num;
    }
    return num;
}

function formatTimeSecond(second){
    var s = second % 60;
    var m = Math.floor(second / 60);
    var h = 0;
    if(m>=60){
        m = m % 60;
        h = Math.floor(m/60);
    }
    if(h>0){
        return [formatTimeNumber(h),formatTimeNumber(m),formatTimeNumber(s)].join(":");
    }

    return [formatTimeNumber(m),formatTimeNumber(s)].join(":");
}


export default class ViewMediasThumb extends PureRenderComponent {

    static propTypes = {
        media: PropTypes.object.isRequired,
        onClickThumb: PropTypes.func.isRequired,
        isCurrent: PropTypes.bool.isRequired
    };


    renderPlayDuration(playDuration){

        return (
            <div className="playDuration">
                <span className="ic_video_white" />
                <span className="time_text">{formatTimeSecond(playDuration || 0)}</span>
            </div>
        );
    }


    render() {

        var {media,onClickThumb,isCurrent} = this.props;
        var {thumbUrl,type,playDuration} = media;

        return (
            <div className={classNames({'view-medias-thumb':true,'current':isCurrent})} onClick={onClickThumb} >
                {type==='video'?this.renderPlayDuration(playDuration):null}
                <img className="thumb-img" src={thumbUrl} />
            </div>
        );
    }
}