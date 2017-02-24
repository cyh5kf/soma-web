import trim from 'lodash/trim';
import warning from '../../utils/warning';
import {formatDateLastSeen} from '../../utils/TimeUtils';

function toPieces(str, lengths)  {
    let i = 0,
        maxI = lengths.length - 1,
        pieces = [];
    while (str) {
        const len = lengths[i];
        pieces.push(str.substr(0, len));
        str = str.substr(len);
        if (i < maxI) { i++; }
    }
    return pieces.join(' ');
}

function getPieceLengths(countryCode){
    switch (countryCode) {
        case '86':
            return [3, 4, 10];
        case '1':
        case '423':
        default:
            return [3, 3, 10];
    }
}


export function formatPhoneNumber(countryCode,phone){
    phone = "" + phone;
    countryCode = "" + countryCode;
    const pieceLengths = getPieceLengths(countryCode);
    return `+${countryCode} ${toPieces(phone, pieceLengths)}`;
}


export function getUserDisplayName({nameAsFriend,name, uid, countryCode = null, mobile = null}) {

    //通讯录里的名字
    if(nameAsFriend){
        return nameAsFriend;
    }

    //用户自己设置的昵称
    if (name) {
        return name;
    } else if (countryCode) {

        countryCode = countryCode && countryCode.toString();

        if (__DEV__ && uid.startsWith(countryCode)) {
            warning(`getUserDisplayName: uid (${uid}) and countryCode (${countryCode}) not matched!`);
        }

        const phone = uid.slice(countryCode.length + 1);

        return formatPhoneNumber(countryCode,phone);

    } else {
        return mobile || uid || '';
    }
}



//获取Uid
export function getUidFromAnyList(anyList){
    var uidList = [];
    if(anyList){
        anyList.forEach(function(u){
            uidList.push(u.uid);
        });
    }
    return uidList;
}


/**
 * 格式化显示User LastSeen
 * @param userAccount
 * @param locale
 * @returns {string} @see http://115.29.234.252:9876/pages/viewpage.action?pageId=3309791
 */
export function formatUserAccountLastSeen(userAccount,locale){

    var {lastSeenOnline,lastSeenTime,isMyFriend,lastSeenAllowShow} = userAccount;

    if(!lastSeenAllowShow){
        return "  ";
    }

    if(lastSeenOnline){
        return locale['baba_status_online'];
    }

    if(!lastSeenTime){
        if(isMyFriend){
            return '';
        }else {
            return "  ";
        }
    }
    return formatDateLastSeen(lastSeenTime,locale);
}


/**
 * 从别人发过来的名片中拼接联系人姓名
 * @param contactInfo
 * @returns {string}
 */
export function gettNameFromContactJson(contactInfo){
    var name = [contactInfo.firstName, contactInfo.middleName, contactInfo.lastName].filter(n => !!n).join(' ');
    name = name.trim();
    if(name.length > 0){
        return name;
    }
    var phone0 = contactInfo.phones[0] || {};
    return phone0['number'] || '';
}