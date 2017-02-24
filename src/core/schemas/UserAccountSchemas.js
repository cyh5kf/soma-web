import {compile} from '../../utils/schema';

var TYPE_STRING = 'string';
var TYPE_NUMBER = 'number';
var TYPE_BOOLEAN = 'boolean';

export const UserAccountSrc = {
    uid: TYPE_STRING, // 单聊: 对方uid; 群聊: gid
    name: TYPE_STRING,
    nameAsFriend: TYPE_STRING,
    avatar: TYPE_STRING,
    whatsUpType: TYPE_NUMBER,
    customWhatsUpContent: TYPE_STRING,
    sysWhatsUpNum: TYPE_NUMBER,
    countryCode: TYPE_NUMBER,
    mobile: TYPE_STRING,//uint64
    regionCodeAlphabet: TYPE_STRING,
    isVip: TYPE_BOOLEAN,
    vipExpireDate: TYPE_STRING//uint64,
};


const lastSeenSrc = {
    lastSeenOnline: TYPE_BOOLEAN,
    lastSeenTime: TYPE_STRING,
    lastSeenAllowShow: TYPE_BOOLEAN
};

/**
 * 这是一个通用的Schema,不是好友的数据接口也是这样的.
 */
export const UserAccountSchema = compile({
    ...UserAccountSrc,
    ...lastSeenSrc,
    isMyFriend: TYPE_BOOLEAN,
    __options: {
        notRequired: "*"
    }
});


export const UserAccountListSchema = compile([UserAccountSchema]);

export const FriendAccountListSchema = UserAccountListSchema;

export const FriendAccountSchema = UserAccountSchema;
