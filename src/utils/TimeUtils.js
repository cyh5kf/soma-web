import padStart from 'lodash/padStart';
import moment from 'moment';


var lastServerTime = null;
var lastWebTime = null;

export function updateServerTime(serverTime){
    if(serverTime){
        lastServerTime = Number(serverTime);
        lastWebTime = new Date().getTime();
    }
}

export function getServerTimestamp() {
    if (!lastServerTime) {
        return new Date().getTime();
    }
    var diff = lastWebTime - lastServerTime;
    return new Date().getTime() - diff;
}

export function getServerDateTime(){
    return new Date(getServerTimestamp());
}



function beforeDayTimestramp(timestramp,beforeDayCount){
    return timestramp - beforeDayCount * 24 * 60 * 60 * 1000;
}



function formatDateCommon(milliseconds, locale,options){
    if (!milliseconds || !locale) {
        return null;
    }

    var nowDate = getServerDateTime();
    nowDate.setHours(0);
    nowDate.setMinutes(0);
    nowDate.setSeconds(0);
    nowDate.setMilliseconds(0);

    const todayStartTime = nowDate.getTime();
    const yesterdayStartTime = beforeDayTimestramp(todayStartTime,1);
    const lastWeekStartTime = beforeDayTimestramp(todayStartTime,7);
    const lastTwoWeekStartTime = beforeDayTimestramp(todayStartTime,14);

    if(milliseconds < lastTwoWeekStartTime){
        return moment(milliseconds).format('YYYY-MM-DD');
    }

    if(milliseconds < lastWeekStartTime){
        return moment(milliseconds).format('dddd');
    }

    if(milliseconds < yesterdayStartTime){
        return moment(milliseconds).format('dddd');
    }

    if(milliseconds < todayStartTime){
        return locale['common.time.yesterday'];
    }

    return options['today'] || locale['baba_today'];

}

export function formatDateForRecentSession(milliseconds, locale) {
    var options = {
        'today': moment(milliseconds).format('HH:mm')
    };

    return formatDateCommon(milliseconds, locale, options);
}


export function formatDate(milliseconds, locale) {
    var options = {
        'today': locale['baba_today']
    };
    return formatDateCommon(milliseconds, locale, options);
}



/**
 * 返回这样的时间格式: Yestoday at 12:09 PM
 * @param milliseconds 时间戳
 * @param locale 国际化资源集合
 * @returns {*}
 */
export function formatDateAtTime(milliseconds, locale) {
    if(!milliseconds){
        return ' ';
    }

    milliseconds = 0 + new Number(milliseconds); //即便传过来是个字符串,也自动转换为数字
    var atLabel = locale['baba_lastseen_at'];
    var formattedDate = formatDate(milliseconds, locale);
    var formattedTime = moment(milliseconds).format('HH:mm');
    return `${formattedDate} ${atLabel} ${formattedTime}`;
}

/**
 * 返回这样的时间格式: Yestoday at 12:09 PM (超过一周的时间不需要展示小时、分钟数)
 * @param milliseconds 时间戳
 * @param locale 国际化资源集合
 * @returns {*}
 */
export function formatDateLastSeen(milliseconds, locale) {
    if(!milliseconds){
        return "";
    }

    milliseconds = Number(milliseconds); //即便传过来是个字符串,也自动转换为数字
    var atLabel = locale['baba_lastseen_at'];
    var todayDateNum = getServerTimestamp();
    if(milliseconds < todayDateNum - 1000 * 60 * 60 * 24 * 7) { //604800表示一周的时间,一周以前
        return moment(milliseconds).format('YYYY-MM-DD');
    } else {
        var formattedTime = moment(milliseconds).format('HH:mm');
        var formattedDate = formatDate(milliseconds, locale);
        return `${formattedDate} ${atLabel} ${formattedTime}`;
    }

}


export default {
    formatDuration(milliseconds) {
        const seconds = Math.round(milliseconds / 1000);
        return seconds + " s"; //SW-219
        //
        //const fill0 = num => padStart(num.toString(), 2, '0');
        //let secondNum = seconds % 60,
        //    minuteNum = Math.floor(seconds / 60),
        //    hourNum = 0;
        //if (minuteNum >= 60) {
        //    hourNum = Math.floor(minuteNum / 60);
        //    minuteNum = minuteNum % 60;
        //}
        //if (hourNum > 0) {
        //    return `${hourNum}:${fill0(minuteNum)}:${fill0(secondNum)}`;
        //} else {
        //    return `${minuteNum}:${fill0(secondNum)}`;
        //}
    }
}
