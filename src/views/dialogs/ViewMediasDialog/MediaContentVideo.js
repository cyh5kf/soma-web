import React,{PropTypes} from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import MediaContentBase from './MediaContentBase';
//import BlueLoading from '../../../components/loading/BlueLoading';
//import {hideStyle} from '../../../utils/JSXRenderUtils';
//import ViewMediasHeader  from './ViewMediasHeader';
//import {default as Video, Controls, Seek, Play, Mute, Fullscreen, Time, Overlay} from 'react-html5video';
//import isString from 'lodash/isString';

import 'react-html5video/dist/ReactHtml5Video.css'
import './MediaContentVideo.less';

import Controls from 'react-html5video/src/components/controls/Controls';
import Play from 'react-html5video/src/components/controls/play/Play';
import Seek from 'react-html5video/src/components/controls/seek/Seek';
import Overlay from 'react-html5video/src/components/video/overlay/Overlay';
import Video from 'react-html5video/src/components/video/Video';
import Icon from 'react-html5video/src/components/icon/Icon';
import ProgressBar from 'react-html5video/src/components/progressbar/ProgressBar';


class MyMute extends PureRenderComponent {

    static propTypes={
        copyKeys: React.PropTypes.object,
        volume: React.PropTypes.number,
        unmute: React.PropTypes.func,
        setVolume: React.PropTypes.func,
        toggleMute: React.PropTypes.func,
        muted: React.PropTypes.bool
    };


    changeVolume=(e)=>{
        this.props.setVolume(e.target.value / 100, true);
        this.props.unmute();
    };

    toggleMute=()=>{
        // If we volume has been dragged to 0, assume it is in
        // a muted state and then toggle to full volume.
        if (this.props.volume <= 0) {
            this.props.setVolume(1);
        } else {
            this.props.toggleMute();
        }
    };

    render() {
        return (
            <div className="video-mute video__control" >
                <button
                    className="video-mute__inner"
                    onClick={this.toggleMute}
                    aria-label={this.props.muted || this.props.volume <= 0
                        ? this.props.copyKeys.unmute : this.props.copyKeys.mute}>
                    {this.props.muted || this.props.volume <= 0
                        ? <Icon name="volume-off" />
                        : <Icon name="volume-up" />}
                </button>
                <div className="video-mute__volume0">
                    <div className="video-mute__track0">
                        <ProgressBar
                            orientation="horizontal"
                            onChange={this.changeVolume}
                            progress={this.props.muted
                                ? 0
                                : this.props.volume * 100}
                        />
                    </div>
                </div>
            </div>
        );
    }
}



class MyTime extends PureRenderComponent {

    static propTypes = {
        currentTime: React.PropTypes.number,
        duration: React.PropTypes.number
    };

    formatTime(seconds) {
        var date = new Date(Date.UTC(1970,1,1,0,0,0,0));
        seconds = isNaN(seconds) ? 0 : Math.floor(seconds);
        date.setSeconds(seconds);
        var mm =  date.toISOString();

        var hh = mm.substr(11, 2);
        var hhNum = parseInt(hh,10);
        if(hhNum>0){
            return mm.substr(11, 8);
        }
        return mm.substr(14, 5);
    }

    render() {
        return (
            <div className="video-time video__control">
                <span className="video-time__current">
                    {this.formatTime(this.props.currentTime)}
                </span>
                /
                <span className="video-time__duration">
                    {this.formatTime(this.props.duration)}
                </span>
            </div>
        );
    }
}


class MyVideo extends Video{
    render(){
        var {controls, copyKeys, style,videoStyle, ...otherProps} = this.props;
        return (
            <div className={this.getVideoClassName()}
                 tabIndex="0"
                 onFocus={this.onFocus}
                 onBlur={this.onBlur}
                 style={style}>
                <video
                    style={videoStyle}
                    {...otherProps}
                    className="video__el"
                    ref={(el) => {
                        this.videoEl = el;
                    }}
                    {...this.mediaEventProps}>
                    {this.renderSources()}
                </video>
                {controls ? this.renderControls() : ''}
            </div>
        );
    }
}

class VideoWrapper extends PureRenderComponent {

    static propTypes = {
        src: PropTypes.string
    };

    render() {
        var {src,mw,mh} = this.props;
        var size = {'maxWidth':mw,'maxHeight':mh};
        return (
            <MyVideo
                style={size}
                videoStyle = {size}
                className="custom-video" controls>
                <source src={src} type="video/mp4" />
                <Overlay />
                <Controls>
                    <Play />
                    <MyTime />
                    <Seek />
                    <MyMute />
                </Controls>
            </MyVideo>
        );
    }


    //render(){
    //    var src = this.props.src;
    //    return <video src={src} type="video/mp4" controls autoPlay></video>
    //}

}


export default class MediaContentVideo extends MediaContentBase {

    static propTypes = {
        ...MediaContentBase.propTypes,
        width: PropTypes.number,
        height: PropTypes.number,
        fileUrlOrBlobUrl: PropTypes.string,
        thumbUrl: PropTypes.string
    };


    render() {
        var resizeVersion = this.state.resizeVersion;
        var maxContentSize = this.getMaxContentSize();

        var width = Math.min(720, maxContentSize.width);
        var height = Math.min(576, maxContentSize.height);

        var {fileUrlOrBlobUrl,thumbUrl} =  this.props;
        return (
            <div className="MediaContentVideo" style={{width:width,height:height}}>
                {
                    fileUrlOrBlobUrl?
                        <VideoWrapper src={fileUrlOrBlobUrl} mw={width} mh={height} resizeVersion={resizeVersion} ></VideoWrapper> :
                        <img className="videoThumbImg" src={thumbUrl}  alt="" />}
            </div>
        );
    }
}