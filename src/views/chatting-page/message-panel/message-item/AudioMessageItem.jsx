import React from 'react';
import {findDOMNode} from 'react-dom';
import FileUtils from '../../../../utils/FileUtils';
import TimeUtils from '../../../../utils/TimeUtils';
import Loading from '../../../../components/loading/Loading';
import toast from '../../../../components/popups/toast';
import MessageItemBase from './MessageItemBase';
import {decryptFileMsgDataUrlCmd, loadAudioPlayerLibCmd} from '../../../../core/commands/MessagesCommands';

import './AudioMessageItem.less';

export default class AudioMessageItem extends MessageItemBase {
    cls = 'audio-msg';

    state = {
        audioPlaying: false,
        audioPlayed: 0 // 毫秒
    };

    getMenuConfigs() {
        // const {locale} = this.props;
        return [
            // {key: MessageItemBase.MENU_FORWARD, label: locale['chat_forward']}
        ];
    }

    getAudioNode(callback) {
        const audioNode = findDOMNode(this.refs['audio']);
        if (audioNode) {
            callback(audioNode);
        }
    }

    handleAudioPause = () => this.setState({audioPlaying: false});

    handleAudioPlaying = () => this.setState({audioPlaying: true});

    handleAudioTimeUpdate = () => this.getAudioNode((audio => {
        const {message: {playDuration}} = this.props;
        this.setState({
            audioPlayed: Math.min(Math.round(audio.currentTime * 1000), playDuration)
        });
    }));

    handlePlayBtnClick = () => this.getAudioNode(audio => {
        const {message} = this.props,
            {audioPlaying} = this.state;
        if (message.formatSupported) {
            if (audioPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        } else {
            toast(`${FileUtils.getExtension(message.cryptFileUrl)} Format not supported`);
        }
    });

    componentWillMount() {
        const {message} = this.props;
        if (message.formatSupported) {
            if (message.fileUrlOrBlobUrl == null && !decryptFileMsgDataUrlCmd.isPending(message.msgId)) {
                decryptFileMsgDataUrlCmd(message);
            }
            if (!loadAudioPlayerLibCmd.isPending(message.ext)) {
                loadAudioPlayerLibCmd(message.ext);
            }
        }
    }

    renderContent() {
        const {message} = this.props,
            {audioPlaying, audioPlayed} = this.state,
            {playDuration} = message,
            playedPercent = `${Math.round(audioPlayed / playDuration * 100)}%`,
            isLoadingSource = !window.AMR || !message.fileUrlOrBlobUrl;
        let durationText = TimeUtils.formatDuration(playDuration);

        return (
            <div className="message-item-content">
                <audio ref="audio" src={message.fileUrlOrBlobUrl}
                       onTimeUpdate={this.handleAudioTimeUpdate}
                       onPause={this.handleAudioPause}
                       onPlaying={this.handleAudioPlaying}/>
                <div className={`audio-play-btn ${isLoadingSource ? 'source-loading' : ''} ${audioPlaying ? 'playing' : ''}`} onClick={this.handlePlayBtnClick}>
                    {isLoadingSource && <Loading type="spokes"/>}
                </div>
                <div className="audio-play-info">
                    <span className="audio-baseline"/>
                    <span className="audio-played-line" style={{width: playedPercent}}/>
                    <span className="audio-played-dot" style={{left: playedPercent}}/>
                </div>
                <div className="audio-duration">{durationText}</div>
            </div>
        );
    }
}
