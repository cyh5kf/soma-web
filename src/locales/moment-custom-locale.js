const customForAll = {
    //meridiem: function (hour, minute, isLower) {
    //    var hm = hour * 100 + minute;
    //    if (hm < 1200) {
    //        return isLower ? 'am' : 'AM';
    //    } else {
    //        return isLower ? 'pm' : 'PM';
    //    }
    //}
};

export default {
    'zh-cn': {
        ...customForAll,
        longDateFormat: {
            LL: 'YYYY年M月D日'
        }
    },

    'en-gb': {
        ...customForAll,
        longDateFormat: {
            LL: 'MMMM D, YYYY'
        }
    }
}
