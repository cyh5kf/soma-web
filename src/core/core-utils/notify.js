import pushjs from 'push.js';
import _get from 'lodash/get';
import uniq from 'lodash/uniq';
//import throttle from 'lodash/throttle';
import StringUtils from '../../utils/StringUtils';
import {text2image} from '../../utils/ImageGenerator';
import {getLocale} from '../../components/exposeLocale';
import EnumMsgType from '../enums/EnumMsgType';
import {selectSessionCmd} from '../commands/SessionsCommands';
import logo48Img from './images/ic_soma_48px.png';
//import notifyMP3 from './soft-bells-final.mp3';

function allSame(arr, path) {
    const first = _get(arr[0], path);
    for (let i = 1, len = arr.length; i < len; i++) {
        if (_get(arr[i], path) !== first) {
            return false;
        }
    }
    return true;
}


var playAudio =function () {
    var audioNode = document.getElementById('AudioNodeBell');
    audioNode.muted = false;
    if (audioNode.paused) {
        audioNode.play();
    }
};

class NotificationManager {
    /**@type {Array.<{session: Session, messages: Message}>}*/
    _queuedMessagesNotify = [];

    constructor() {
        //const audioNode = this._audioNode = document.createElement('audio');
        //audioNode.src = notifyMP3;
        //audioNode.preload = 'auto';
        //audioNode.style.display = 'inline-block !import';
        //document.body.appendChild(audioNode);
    }

    _doNotify({title, content, icon, onClick,enableNotification,enableSound}) {

        if (enableNotification) {
            pushjs.create(title, {
                icon: icon,
                body: content,
                onClick: function () {
                    window.focus()
                    onClick();
                    this.close();
                },
                timeout: 4000,
                onClose: this._handleNotifyClose
            });
        }

        if (enableSound) {
            playAudio();
            //if (this._audioNode.paused) {
            //    this._audioNode.play();
            //}
        }

    }

    _handleNotifyClose = () => {
        this.tryFlushMessagesNotify();
    }

    tryFlushMessagesNotify(web_notification,web_sound) {
        const ntfQueue = this._queuedMessagesNotify;
        if (pushjs.count() < 3 && ntfQueue.length) {
            const locale = getLocale();
            if (ntfQueue.length === 1) {
                    // 显示单条消息
                    const {session, message} = ntfQueue[0],
                        getMsgNotifyContent = () => {
                            switch (message.msgType) {
                                case EnumMsgType.SystemMsg: return message.text;
                                case EnumMsgType.ExpiredMsg: return locale['baba_expire_msg'];
                                case EnumMsgType.Text:{
                                    if (message.sessionType === 2) {//群组消息
                                        return message.fromNameDisplay + ": " + message.text;
                                    }
                                    return message.text;
                                }
                                case EnumMsgType.Image: return StringUtils.formatLocale(locale['IMAGE'], message.fromNameDisplay);
                                case EnumMsgType.Audio: return StringUtils.formatLocale(locale['AUDIO'], message.fromNameDisplay);
                                case EnumMsgType.Video: return StringUtils.formatLocale(locale['send_notification_video'], message.fromNameDisplay);
                                case EnumMsgType.Location: return StringUtils.formatLocale(locale['LOCATION'], message.fromNameDisplay);
                                case EnumMsgType.ContactCard: return StringUtils.formatLocale(locale['baba_push_contact'], message.fromNameDisplay);
                            }
                        };
                    this._doNotify({
                        title: session.sessionName,
                        content: getMsgNotifyContent(),
                        icon: session.sessionLogo || text2image(session.sessionName[0]),
                        onClick() {
                            selectSessionCmd(session.sessionId, {
                                createIfNotExist: true,
                                sessionType: session.sessionType
                            });
                        },
                        enableNotification: web_notification,
                        enableSound: web_sound
                    });
            } else if (allSame(ntfQueue, 'message.fromUid')) {
                // 合并显示来自同一个人的消息
                const {session, message} = ntfQueue[0];
                this._doNotify({
                    title: message.fromNameDisplay,
                    content: StringUtils.formatLocale(locale['notification_more_than_one_msg'], ntfQueue.length),
                    icon: message.fromAvatar || text2image(message.fromNameDisplay[0]),
                    onClick() {
                        selectSessionCmd(session.sessionId, {
                            createIfNotExist: true,
                            sessionType: session.sessionType
                        });
                    }
                });
            } else if (allSame(ntfQueue, 'session.sessionId')) {
                // 合并显示来自同一个群的消息
                const {session} = ntfQueue[0];
                this._doNotify({
                    title: session.sessionName,
                    content: StringUtils.formatLocale(locale['baba_pushand_singlegrp_multmsg'], ntfQueue.length),
                    icon: session.sessionLogo || text2image(session.sessionName[0]),
                    onClick() {
                        selectSessionCmd(session.sessionId, {
                            createIfNotExist: true,
                            sessionType: session.sessionType
                        });
                    }
                });
            } else {
                // 合并显示多个来源的消息
                const sessionCount = uniq(ntfQueue.map((item => item.session.sessionId))).length;
                this._doNotify({
                    title: locale['baba_baba'],
                    content: StringUtils.formatLocale(locale['baba_pushand_multchatsmsg'], ntfQueue.length, sessionCount),
                    icon: logo48Img,
                    onClick() {
                        const firstSession = ntfQueue[0].session;
                        selectSessionCmd(firstSession.sessionId, {
                            createIfNotExist: true,
                            sessionType: firstSession.sessionType
                        });
                    }
                });
            }

            this._queuedMessagesNotify = [];
        }
    }


    addMessageNotify = (sessionInfo, message,web_notification,web_sound) => {
        this._queuedMessagesNotify.push({
            session: sessionInfo,
            message: message
        });
        this.tryFlushMessagesNotify(web_notification,web_sound);
    }
}

const ntfMgr = new NotificationManager();

export const notifyNewMessage = ntfMgr.addMessageNotify;
