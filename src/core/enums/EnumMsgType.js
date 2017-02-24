import values from 'lodash/values';
import {EChatSubItemType} from '../protos/protos';

const EnumMsgType = {
    SystemMsg: -100,

    ExpiredMsg: -101,

    EmptyMsg:-102,

    Text: EChatSubItemType.EChatSubItemType_Plain_Text,

    Image: EChatSubItemType.EChatSubItemType_Image,

    Audio: EChatSubItemType.EChatSubItemType_Audio,

    Video: EChatSubItemType.EChatSubItemType_ShortVideo,

    Location: EChatSubItemType.EChatSubItemType_Location,

    ContactCard: EChatSubItemType.EChatSubItemType_ContactCard
};

const _MsgTypeMap = values(EnumMsgType).reduce((result, msgType) => {
    result[msgType] = true;
    return result;
}, {});

export default EnumMsgType;

export function msgTypeFromEChatType(echatItemType) {
    if (_MsgTypeMap[echatItemType]) {
        return echatItemType;
    } else if (echatItemType === EChatSubItemType.EChatSubItemType_Text) {
        return EnumMsgType.Text;
    } else if (echatItemType === EChatSubItemType.EChatSubItemType_OrigImage) {
        return EnumMsgType.Image;
    }
    return null;
}
