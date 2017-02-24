import pick from 'lodash/pick';
import {compile, compileEnum, compileAnyOf} from '../../utils/schema';
import EnumMsgType from '../enums/EnumMsgType';

const CONST_STRING = "string";
const CONST_NUMBER = "number";

const MsgCommonSrc = {
    sessionId: CONST_STRING, // 单聊: 对方uid; 群聊: gid
    sessionType: CONST_NUMBER, // protos.WebSessionType
    msgId: CONST_STRING,
    msgType: CONST_NUMBER, // EnumMsgType
    msgSrvTime: CONST_NUMBER, // 发送过程中, msgSrvTime 为本地时间
    fromUid: CONST_STRING,
    fromNameDisplay: CONST_STRING, // 发送方名称显示
    fromAvatar: CONST_STRING,

    msgStatus: CONST_NUMBER, // EnumMsgStatus

    __options: {
        notRequired: ['fromAvatar']
    }
};

export const ValidMessageSchema = compileAnyOf([
    compile({
        ...MsgCommonSrc,
        msgType: compileEnum([EnumMsgType.ExpiredMsg])
    }),
    compile({
        ...MsgCommonSrc,
        msgType: compileEnum([EnumMsgType.Text]),
        text: CONST_STRING,
        textDecrypted:CONST_STRING, //解码后的文本,主要是对Emoji的解码
        __options: {
            notRequired: ['textDecrypted']
        }
    }),
    compile({
        ...MsgCommonSrc,
        msgType: compileEnum([EnumMsgType.Image]),

        // 'cryptFileUrl' 和 'fileAesKey' 成对出现。如果没有, 则 'fileUrlOrBlobUrl' 存在且为非加密url
        cryptFileUrl: CONST_STRING,
        fileAesKey: CONST_STRING,
        fileUrlOrBlobUrl: CONST_STRING,

        ext: CONST_STRING, // 后缀格式, 如 "jpg", "png"
        thumbDataUrl: CONST_STRING, // 模糊缩略图
        imgWidth: CONST_NUMBER,
        imgHeight: CONST_NUMBER,
        imgUrl: CONST_STRING,
        fileSize: CONST_NUMBER,
        uploadStatus: CONST_NUMBER, //上传进度 0到100
        __options: {
            ...MsgCommonSrc.__options,
            notRequired: [...MsgCommonSrc.__options.notRequired, 'fileUrlOrBlobUrl', 'cryptFileUrl', 'fileAesKey', 'uploadStatus','imgUrl']
        }
    }),
    compile({
        ...MsgCommonSrc,
        msgType: compileEnum([EnumMsgType.Audio]),
        // 'cryptFileUrl' 和 'fileAesKey' 成对出现。如果没有, 则 'fileUrlOrBlobUrl' 存在且为非加密url
        cryptFileUrl: CONST_STRING,
        fileAesKey: CONST_STRING,
        fileUrlOrBlobUrl: CONST_STRING,
        ext: CONST_STRING, // 后缀格式, 比如 "amr", "acc"
        formatSupported: 'boolean',
        playDuration: CONST_NUMBER, // 单位: 毫秒
        fileSize: CONST_NUMBER,
        __options: {
            ...MsgCommonSrc.__options,
            notRequired: [...MsgCommonSrc.__options.notRequired, 'fileUrlOrBlobUrl', 'cryptFileUrl', 'fileUrlOrBlobUrl']
        }
    }),
    compile({
        ...MsgCommonSrc,
        msgType: compileEnum([EnumMsgType.Video]),
        fileSize: CONST_NUMBER,
        playDuration: CONST_NUMBER, // 单位: 秒
        thumbDataUrl: CONST_STRING,
        ext: CONST_STRING, // 后缀格式, 比如 "mp4"
        cryptFileUrl: CONST_STRING,
        fileAesKey: CONST_STRING,
        fileUrlOrBlobUrl: CONST_STRING,
        __options: {
            ...MsgCommonSrc.__options,
            notRequired: [...MsgCommonSrc.__options.notRequired, 'cryptFileUrl', 'fileAesKey', 'fileUrlOrBlobUrl']
        }
    }),
    compile({
        ...MsgCommonSrc,
        msgType: compileEnum([EnumMsgType.Location]),
        longitude: CONST_NUMBER, //经度
        latitude: CONST_NUMBER, //纬度
        pointName: CONST_STRING // 逗号(",")分隔的位置信息描述
    }),
    compile({
        ...MsgCommonSrc,
        msgType: compileEnum([EnumMsgType.ContactCard]),
        contactJson: CONST_STRING,
        contactName: CONST_STRING,
        contactAvatar: CONST_STRING,
        contactUid: CONST_STRING, //需要发起新的请求获取
        __options: {
            ...MsgCommonSrc.__options,
            notRequired: [...MsgCommonSrc.__options.notRequired, 'contactAvatar','contactUid']
        }
    }),
    compile({
        msgType: compileEnum([EnumMsgType.EmptyMsg]),
        msgSrvTime: CONST_NUMBER
    })
]);

export const ValidMessageListSchema = compile([ValidMessageSchema]);

export const MessageSchema = compileAnyOf([
    compile({
        ...pick(MsgCommonSrc, ['msgId', 'msgSrvTime']),
        msgType: compileEnum([EnumMsgType.SystemMsg]),
        text: CONST_STRING
    }),
    ...ValidMessageSchema.anyOf
]);

export const MessageListSchema = compile([MessageSchema]);
