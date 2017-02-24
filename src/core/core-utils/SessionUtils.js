import {WebSessionType} from '../../core/protos/protos';
import {formatPhoneNumber} from './UserUtils';
/**
 *
 * @param userSettings 可为空 @see UserSettingsSchema
 * @param sessionId
 * @param sessionType
 * @returns {*}
 */
export function isSessionMuted(userSettings, {sessionId, sessionType}) {

    if (!userSettings || !userSettings.session_muted) {
        return false;
    }

    var session_muted_list = userSettings.session_muted;

    var sessionMute = session_muted_list.find(function (sessionMute) {
        return sessionMute.session_id === sessionId && sessionMute.session_type === sessionType;
    });

    if (sessionMute) {
        return sessionMute.mute_flag;
    }

    return false;
}


/**
 * 判断一个用户是否被Block
 * @param userSettings
 * @param sessionId
 * @param sessionType
 * @returns {*}
 */
export function isUserBlocked(userSettings, {sessionId, sessionType}){

    //只对P2PSession有效
    if (sessionType !== WebSessionType.WEB_SESSION_TYPE_P2P) {
        return false;
    }

    if (!userSettings || !userSettings.blocked_phones) {
        return false;
    }

    var blocked_phones = userSettings.blocked_phones;

    var mm = blocked_phones.find(function (phone) {
        return phone === sessionId; //P2P消息的SessionId就是UID就是手机号
    });

    if (mm) {
        return true;
    }

    return false;
}


/**
 * 格式化显示SessionName
 * @param sessionInfo ===>{sessionType,sessionName}
 * @param p2pUserAccount
 */
export function formatSessionName(sessionInfo,p2pUserAccount){
    if (!sessionInfo) {
        return ' ';
    }

    var {sessionType,sessionName} = sessionInfo;
    if (sessionType === WebSessionType.WEB_SESSION_TYPE_P2P) {
        if (p2pUserAccount) {
            var {countryCode,mobile,nameAsFriend} = p2pUserAccount;

            if (!p2pUserAccount.isMyFriend) {//如果不是我的好友的话,显示手机号
                return formatPhoneNumber(countryCode, mobile);
            }
            else {
                if (nameAsFriend) {
                    return nameAsFriend;
                }
            }
        }
    }

    return sessionName || ' ';
}