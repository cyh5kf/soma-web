import {compile} from '../../utils/schema';

var TYPE_STRING = 'string';
var TYPE_NUMBER = 'number';

export const SessionMutedSchema = compile({
    session_type: TYPE_NUMBER,
    session_id: TYPE_STRING,
    mute_flag: 'boolean',
    __options: {
        notRequired: ['session_type','session_id', 'mute_flag']
    }
});

export const SessionMutedListSchema = compile([SessionMutedSchema]);

export const UserSettingsSrc = {
    user_name: TYPE_STRING,
    avatar: TYPE_STRING,
    whatsUpType: TYPE_NUMBER,
    customWhatsUpContent: TYPE_STRING,
    sysWhatsUpNum: TYPE_NUMBER,
    have_read_privacy: 'boolean', //已读回执状态,打开，true,否则false，默认打开
    session_muted: SessionMutedListSchema,
    web_notification: 'boolean',
    web_preview: 'boolean',
    web_sound: 'boolean',//uint64
    language: TYPE_STRING,
    blocked_phones:[TYPE_STRING] //我设置的Block用户列表,通过单独的接口获取的
};

/**
 * 这是一个通用的Schema,不是好友的数据接口也是这样的.
 */
export const UserSettingsSchema = compile({
    ...UserSettingsSrc,
    __options: {
        notRequired: "*"
    }
});


