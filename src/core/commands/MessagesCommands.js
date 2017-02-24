/* global AMR, PCMData */
import axios from 'axios';
import forEach from 'lodash/forEach';
import map from 'lodash/map';
import debounce from 'lodash/debounce';
import immutable from 'immutable';
import {DEFAULT_AES_IVKEY_STRING, DEFAULT_AES_IVKEY} from '../../utils/crypto';
import {createCommand} from '../../utils/command';
import {loadAMRLib,loadEmojiLib} from '../../utils/loadLibs';
import binaryUtils from '../../utils/binaryUtils';
import {toImageDataUrl, toAudioDataUrl, toVideoDataUrl} from '../../utils/toDataUrl';
import {parseEmojiText,parseEmojiTextImmediately} from '../../utils/EmojifyUtils';
import {aesDecrypt} from '../../utils/crypto';
import {createImmutableSchemaData} from '../../utils/schema';
import {updateServerTime,getServerTimestamp} from '../../utils/TimeUtils';
import {getMaxValueFromList} from '../../utils/functions';
import {getUserDisplayName} from '../core-utils/UserUtils';
import SocketManager from '../socket/SocketManager';
import {MessageSchema} from '../schemas/MessageSchemas';
import LoginStore from '../stores/LoginStore';
import UserKeysStore from '../stores/UserKeysStore';
import SessionsStore from '../stores/SessionsStore';
import EnumMsgStatus from '../enums/EnumMsgStatus';
import EnumMsgType from '../enums/EnumMsgType';
import {getCacheOrCreatePromise} from '../../utils/PromiseCache';
import {getImageFileInfo} from '../core-utils/ImageUtils';
import {uploadAvatar} from '../core-utils/UploadUtils';
import {addP2PSessionCmd,queryGroupInfoCmd} from './SessionsCommands';
import {getMatchUsersCmd} from './FriendAccountCommands';
import {ensureUserEccKeysCmd, updateUserEccKeysCmd,getBatchUserLastSeenCmd} from './UsersCommands';
import {markP2PSessionReadTaskQueue,markGroupSessionReadTaskQueue,msgAckDelCmdTaskQueue} from './MessagesCommandTaskQueue';
import {WebSessionType, ECocoErrorcode} from '../protos/protos';

function buildMessage(options) {
    const userInfo = LoginStore.getUserInfo();
    var dateNow = getServerTimestamp();

    return createImmutableSchemaData(MessageSchema, {
        ...options,
        msgId: dateNow.toString(),
        msgSrvTime: dateNow,
        fromUid: userInfo.uid,
        fromNameDisplay: getUserDisplayName(userInfo),
        fromAvatar: userInfo.avatar
    });
}

function sendMsg(message,isPushMessageLocal = true) {
    const session = SessionsStore.getSession(message.sessionId),
        myInfo = LoginStore.getUserInfo(),
        {msgId} = message;

    if(isPushMessageLocal){
        session.onPushMessages(immutable.List([message.set('msgStatus', EnumMsgStatus.MySending)]));
    }

    const requestData = (() => {
        switch (message.msgType) {
            case EnumMsgType.Text:
                return {text: message.text};
            case EnumMsgType.Image:

                var image_thumb_bytes =  binaryUtils.dataUrlToArrayBuffer(message.thumbDataUrl);
                //var thumbDataUrl00 = toImageDataUrl(thumb_bytes, 'jpg');
                //console.log(thumbDataUrl00);

                return {
                    filesize: message.fileSize.toString(),
                    imgwidth: message.imgWidth,
                    imgheight: message.imgHeight,
                    thumb_bytes: image_thumb_bytes,
                    ...(message.cryptFileUrl ? {
                        cryptimgurl: message.cryptFileUrl,
                        fileaes256key: message.fileAesKey,
                        imgurl: message.imgUrl
                    } : {imgurl: message.fileUrlOrBlobUrl})
                };
            case EnumMsgType.Audio:
                return {
                    filesize: message.fileSize.toString(),
                    playduration: message.playDuration,
                    audiotype: message.ext === 'amr' ? 1 : 0,
                    ...(message.cryptFileUrl ? {
                        cryptfileurl: message.cryptFileUrl,
                        fileaes256key: message.fileAesKey
                    } : {fileurl: message.fileUrlOrBlobUrl})
                };
            case EnumMsgType.Video:
                return {
                    videosize: message.fileSize.toString(),
                    playduration: message.playDuration,
                    videotype: 0,
                    thumb_bytes: binaryUtils.dataUrlToArrayBuffer(message.thumbDataUrl),
                    ...(message.cryptFileUrl ? {
                        cryptvideourl: message.cryptFileUrl,
                        fileaes256key: message.fileAesKey
                    } : {
                        videourl: message.fileUrlOrBlobUrl
                    })
                };
            case EnumMsgType.Location:
                return {
                    lat: message.latitude,
                    lngt: message.longitude,
                    poiname: message.pointName
                };
            case EnumMsgType.ContactCard:
                return {
                    contactJson: message.contactJson
                };
            default:
                throw new Error(`sendMsg: 未处理的消息类型: ${message.msgType}`);
        }
    })();

    if (message.sessionType === WebSessionType.WEB_SESSION_TYPE_P2P) {
        return (function doSendP2PMsg() {
            const toUid = message.sessionId;
            return ensureUserEccKeysCmd([toUid])
                .then(() => {
                    const userKey = UserKeysStore.getUserKey(toUid);
                    return SocketManager.rpcRequest('msgproxy2.SendP2P', {
                        uid: myInfo.uid,
                        touid: toUid,
                        type: message.msgType,
                        msgid: msgId,
                        eccversion: userKey.eccVersion,
                        publickey: binaryUtils.arrayToArrayBuffer(myInfo.loginPublicKey.toJS()),
                        topublickey: binaryUtils.arrayToArrayBuffer(userKey.eccPK.toJS()),
                        aesivkey: DEFAULT_AES_IVKEY_STRING,
                        data: requestData
                    });
                })
                .then(function success(response) {
                    var msgSrvTime = Number(response.param.srvtime);
                    updateServerTime(msgSrvTime);

                    session.onEditMessages([{
                        msgId: msgId,
                        msgSrvTime: msgSrvTime,
                        msgStatus: EnumMsgStatus.MySent
                    }]);
                }, function failure(error) {
                    if (error && error.errorCode === ECocoErrorcode.ECocoErrorcode_SENDP2P_INVALID_ECCVERSION) {
                        // 失败原因: 接收方更新了公钥. 尝试重发
                        const resData = error.response.param;
                        updateUserEccKeysCmd([{
                            uid: toUid,
                            eccVersion: resData.eccversion,
                            eccPK: resData.publickey
                        }]);
                        return doSendP2PMsg(requestData);
                    } else {
                        session.onEditMessages([{
                            msgId: msgId,
                            msgStatus: EnumMsgStatus.MySendFailed
                        }]);
                    }
                });
        })();
    } else {
        return SocketManager.rpcRequest('grpproxy.sendGroupMessage', {
            uid: myInfo.uid,
            gid: message.sessionId,
            type: message.msgType,
            msgid: msgId,
            data: requestData
        }).then(function success({param}) {
            var srvtime = param.srvtime;
            updateServerTime(srvtime);

            session.onEditMessages([{
                msgId: msgId,
                msgStatus: EnumMsgStatus.MySent,
                msgSrvTime: getServerTimestamp()
            }]);

        }, function failure() {
            session.onEditMessages([{
                msgId: msgId,
                msgStatus: EnumMsgStatus.MySendFailed
            }]);
        });
    }
}


const sendP2PTextMsg = createCommand(function ({touid, text}) {

    //有可能返回null
    var textDecrypted = parseEmojiTextImmediately(text);

    var messageObj = buildMessage({
        sessionId: touid,
        sessionType: WebSessionType.WEB_SESSION_TYPE_P2P,
        msgType: EnumMsgType.Text,
        text: text,
        textDecrypted: textDecrypted,
        msgStatus: EnumMsgStatus.MySending
    });

    return sendMsg(messageObj).then(()=> {
        decryptEmojiTextCmd(messageObj);
    });

});

const sendGroupTextMsg = createCommand(function ({gid, text}) {

    //有可能返回null
    var textDecrypted = parseEmojiTextImmediately(text);

    var messageObj = buildMessage({
        sessionId: gid,
        sessionType: WebSessionType.WEB_SESSION_TYPE_GROUP,
        msgType: EnumMsgType.Text,
        text: text,
        textDecrypted: textDecrypted,
        msgStatus: EnumMsgStatus.MySending
    });

    return sendMsg(messageObj).then(()=> {
        decryptEmojiTextCmd(messageObj);
    });
});


//发送文件消息
/**
 * 发送文件消息
 * @param 消息的信息 必填
 * @param fileInfo 文件的信息,可选,包含如下字段: {fileUrlOrBlobUrl,thumbDataUrl,imgWidth,imgHeight, fileSize,ext}
 */
const sendFileMsgCmd = createCommand(async function ({msgType,sessionId,sessionType,file}, fileInfo) {

    if (msgType === EnumMsgType.Image) {

        if (!fileInfo) {
            fileInfo = await getImageFileInfo(file);
            var fileDataUrl = fileInfo['fileDataUrl'];
            fileInfo['fileUrlOrBlobUrl'] = binaryUtils.dataUrlToBlobUrl(fileDataUrl);
        }

        var messageObj = buildMessage({
            sessionId: sessionId,
            sessionType: sessionType,
            msgType: msgType,
            msgStatus: EnumMsgStatus.MySending,
            uploadStatus: 0,
            ...fileInfo
        });

        var session = SessionsStore.getSession(sessionId);
        session.onPushMessages(immutable.List([messageObj.set('msgStatus', EnumMsgStatus.MySending)]));

        uploadAvatar(file).then(({imgUrl})=> {

            session.onEditMessages([{msgId: messageObj.msgId, uploadStatus: 80}]);

            messageObj = messageObj.set('fileUrlOrBlobUrl', imgUrl);

            sendMsg(messageObj, false).then(()=> {
                session.onEditMessages([{msgId: messageObj.msgId, uploadStatus: 100}]);
            });

        });

    }

});


///解析Emoji表情.
const decryptEmojiTextCmd = createCommand(function ({msgId,text,textDecrypted,msgType,sessionId}) {

    if(textDecrypted || msgType !== EnumMsgType.Text){
        return Promise.resolve();
    }

    return parseEmojiText(text).then((textDecryptedResult)=>{

        const session = SessionsStore.getSession(sessionId);

        const msgChange = {
            msgId: msgId,
            textDecrypted:textDecryptedResult
        };

        session.onEditMessages([msgChange]);

        return msgChange;
    });

}, {
    getCmdKey: message => message.msgId
});


const forwardMsgCmd = createCommand(function ({sessionId, sessionType, message}) {
    message = buildMessage({
        ...message.toJS(),
        sessionId,
        sessionType
    });
    
    return Promise.resolve()
        .then(() => {
            if (sessionType === WebSessionType.WEB_SESSION_TYPE_P2P && !SessionsStore.getSession(sessionId)) {
                return addP2PSessionCmd(sessionId);
            }

            if (sessionType === WebSessionType.WEB_SESSION_TYPE_GROUP && !SessionsStore.getSession(sessionId)) {
                return queryGroupInfoCmd(sessionId, {insertIfNotExisted: true});
            }

        })
        .then(() => {


            var msgType = message.msgType;
            var fileUrlOrBlobUrl = message.fileUrlOrBlobUrl || "";
            if (fileUrlOrBlobUrl.indexOf('blob') === 0 && msgType === EnumMsgType.Image) {

                var filePromise = binaryUtils.blobUrlToBlobObject(fileUrlOrBlobUrl);
                return filePromise.then(function (blob) {
                    var fileInfo = {
                        thumbDataUrl: message.thumbDataUrl,
                        imgWidth: message.imgWidth,
                        imgHeight: message.imgHeight,
                        fileSize: message.fileSize,
                        ext: message.ext,
                        fileUrlOrBlobUrl: fileUrlOrBlobUrl
                    };
                    return sendFileMsgCmd({msgType, sessionId, sessionType, file: blob}, fileInfo);
                });

            } else {
                return sendMsg(message);
            }
        });
});

const resendMsgCmd = createCommand(function (message) {
    return sendMsg(message);
}, {
    getCmdKey: message => message.msgId
});

const msgsAckCmd = createCommand(function (messages, isRead) {

    const msgIds = [],
        msgSrvTimeStrs = [],
        partuids = [],
        msgreadeds = [];
    messages.forEach(msg => {
        msgIds.push(msg.msgId);
        msgSrvTimeStrs.push(msg.msgSrvTime.toString());
        partuids.push(msg.fromUid);
        msgreadeds.push(isRead);
    });

    if (msgreadeds.length === 0) {
        return Promise.resolve();
    }

    return SocketManager.rpcRequest('msgproxy2.AckReceiveds', {
        uid: LoginStore.getUserInfo().uid,
        partuids: partuids,
        msgid: msgIds,
        msgsrvtime: msgSrvTimeStrs,
        msgreaded: msgreadeds
    }).then(() => {
        const sessionMsgsMap = {},
            tgtMsgStatus = isRead ? EnumMsgStatus.OtherReadAcked : EnumMsgStatus.OtherReceiveAcked;
        messages.forEach(msg => {
            const {sessionId, msgId} = msg,
                session = SessionsStore.getSession(sessionId),
                existedMsg = session && session.getMsg(msgId);
            if (existedMsg && existedMsg.msgStatus < tgtMsgStatus) {
                sessionMsgsMap[sessionId] = sessionMsgsMap[sessionId] || [];
                sessionMsgsMap[sessionId].push({
                    msgId: msgId,
                    msgStatus: tgtMsgStatus
                });
            }
        });
        forEach(sessionMsgsMap, (msgChanges, sessionId) => {
            const session = SessionsStore.getSession(sessionId);
            if (session) {
                session.onEditMessages(msgChanges);
            }
        });
    });
}, {
    getCmdKey: (messages, isRead) => messages.reduce((result, msg) => {
        result.push(`${msg.msgId}-${isRead ? 'read' : 'unread'}`);
        return result;
    }, [])
});

const msgAckDelCmd = createCommand(function (msgId, msgSrvTimeStr, toUid) {
    //生产者消费者模式
    msgAckDelCmdTaskQueue.pushTask({msgId, msgSrvTimeStr, toUid});
    //
    //return SocketManager.rpcRequest('msgproxy2.AckBatchReceivedDel', {
    //    uid: LoginStore.getUserInfo().uid,
    //    touid: [toUid],
    //    msgid: [msgId],
    //    msgsrvtime: [msgSrvTimeStr]
    //}).then(() => {
    //    //const session = SessionsStore.getSession(toUid);
    //    //if (session) {
    //    //    session.onEditMessages([{
    //    //        msgId: msgId,
    //    //        msgStatus: EnumMsgStatus.MyReadConfirmed
    //    //    }]);
    //    //}
    //});
});

function replaceResourceUrlHost(resourceUrl) {
    return resourceUrl.replace(/http\w+:\/\/[^/]+\//, window.location.origin + '/');
}
const decryptFileMsgDataUrlCmd = createCommand(function (message) {

    if (!message.msgId) {
        console.error("msgId is empty", message);
    }

    if (!message.cryptFileUrl){
        return Promise.resolve();
    }

    //将promise缓存起来,可以防止在短时间内发起重复的请求
    return getCacheOrCreatePromise(`msgId_${message.msgId}`, 30, function () {

        return axios({
            url: replaceResourceUrlHost(message.cryptFileUrl),
            responseType: 'arraybuffer'
        }).then(({data}) => {
            const session = SessionsStore.getSession(message.sessionId);
            if (session) {
                const decryptedContent = aesDecrypt(data, message.fileAesKey, DEFAULT_AES_IVKEY).slice(0, message.fileSize);
                const msgChange = {
                    msgId: message.msgId
                };
                if (message.msgType === EnumMsgType.Image) {
                    msgChange.fileUrlOrBlobUrl = binaryUtils.dataUrlToBlobUrl(toImageDataUrl(decryptedContent, message.ext));
                } else if (message.msgType === EnumMsgType.Audio) {
                    if (message.ext === 'amr') {
                        // amr 格式需要转码为支持的 wav 格式
                        return loadAudioPlayerLibCmd(message.ext)
                            .then(() => {
                                const amr = new AMR(),
                                    waveData = PCMData.encode({
                                        sampleRate: 8000,
                                        channelCount: 1,
                                        bytesPerSample: 2,
                                        data: amr.decode(binaryUtils.arrayBufferToBinaryString(decryptedContent))
                                    });
                                msgChange.fileUrlOrBlobUrl = binaryUtils.dataUrlToBlobUrl(`data:audio/wav;base64,${btoa(waveData)}`);
                                session.onEditMessages([msgChange]);
                            });
                    } else {
                        msgChange.fileUrlOrBlobUrl = binaryUtils.dataUrlToBlobUrl(toAudioDataUrl(decryptedContent, message.ext));
                    }
                } else if (message.msgType === EnumMsgType.Video) {
                    msgChange.fileUrlOrBlobUrl = binaryUtils.dataUrlToBlobUrl(toVideoDataUrl(decryptedContent, message.ext));
                }
                session.onEditMessages([msgChange]);

                return msgChange;
            }

        });

    });


}, {
    getCmdKey: message => message.msgId
});

const loadAudioPlayerLibCmd = createCommand(function (extension) {
    if (extension === 'amr') {
        return loadAMRLib();
    }
}, {
    getCmdKey: extension => extension
});


const markSessionReadCmd = createCommand(function (sessionInfo, messages) {
    var {sessionId, sessionType} = sessionInfo;

    var maxMsgSrvTime = getMaxValueFromList(messages, 'msgSrvTime', 0);
    if (!maxMsgSrvTime) {
        return;
    }
    //生产者消费者模式
    if (sessionType === WebSessionType.WEB_SESSION_TYPE_P2P) {
        markP2PSessionReadTaskQueue.pushTask({sessionId, maxMsgSrvTime});
    } else {
        markGroupSessionReadTaskQueue.pushTask({sessionId, maxMsgSrvTime});
    }
});


/**
 * 解析对方发送过来的名片
 */
const decryptContactCardCmd = createCommand(function ({contactName,contactJson,sessionId,msgId}) {

    if(!contactJson){
        return Promise.resolve();
    }

    var contactInfo = JSON.parse(contactJson);
    var contactInfo_phones = contactInfo['phones'] || [];
    var phoneInfoList = [];

    forEach(contactInfo_phones,function({number,type}){
        phoneInfoList.push({
            phone: number,
            name: contactName,
            newAddContact: true
        });
    });

    return getMatchUsersCmd(phoneInfoList).then(function({userAccountList}){
        const session = SessionsStore.getSession(sessionId);
        const msgChange = { msgId: msgId };

        //一个联系人多个手机号,并且都是SOMA用户,使用LastSeen最大的那个用户的UID
        if(userAccountList.length > 1){
            var targetUids = map(userAccountList,function(u){
                return u['uid'];
            });

            return getBatchUserLastSeenCmd(targetUids, false).then(function (response) {
                var param = response.param;
                var userLastSeenKVs = param.userLastSeenKVs || [];
                var maxLastSeenUid = 0;
                var maxLastSeenTime = 0;
                forEach(userLastSeenKVs, function ({lastSeenTime,uid}) {
                    var t = parseInt(lastSeenTime, 10);
                    if (t > maxLastSeenTime) {
                        maxLastSeenTime = t;
                        maxLastSeenUid = uid;
                    }
                });

                if (maxLastSeenUid) {
                    msgChange['contactUid'] = maxLastSeenUid;
                    session.onEditMessages([msgChange]);
                } else {
                    var userAccount = userAccountList[0];
                    msgChange['contactUid'] = userAccount['uid'];
                    session.onEditMessages([msgChange]);
                }
            },function(){
                var userAccount = userAccountList[0];
                msgChange['contactUid'] = userAccount['uid'];
                session.onEditMessages([msgChange]);
            });
        }

        else if (userAccountList.length === 1) {
            var userAccount = userAccountList[0];
            msgChange['contactUid'] = userAccount['uid'];
            session.onEditMessages([msgChange]);
        }
        else {
            msgChange['contactUid'] = '--';
            session.onEditMessages([msgChange]);
        }

        return {};
    });

});

export {
    sendP2PTextMsg,
    sendGroupTextMsg,
    forwardMsgCmd,
    resendMsgCmd,
    msgsAckCmd,
    msgAckDelCmd,
    decryptFileMsgDataUrlCmd,
    loadAudioPlayerLibCmd,
    decryptEmojiTextCmd,
    decryptContactCardCmd,
    sendFileMsgCmd,
    markSessionReadCmd
}
