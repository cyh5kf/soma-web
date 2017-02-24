import toString from 'lodash/toString';


export default {

    formatLocale(localeStr, ...args) {
        const parts = localeStr.split('%');
        let res = parts[0];
        for (let i = 1; i < parts.length; i++) {
            const thisPart = parts[i];
            if (thisPart[0] === '@' || thisPart[0] === 'd') {
                res = res + toString(args[i - 1]) + thisPart.slice(1);
            } else {
                res = res + '%' + thisPart;
            }
        }
        return res;
    },


    /**
     * 解析URL
     * @param str
     * @returns {fragment,host,pass,path,port,query,scheme,user}
     */
    parseURL(str){
        var parseURL = {};
        parseURL.SPEC = ['scheme', 'user', 'pass', 'host', 'port', 'path', 'query', 'fragment'];
        parseURL.RE = /^([^:]+):\/\/(?:([^:@]+):?([^@]*)@)?(?:([^/?#:]+):?(\d*))([^?#]*)(?:\?([^#]+))?(?:#(.+))?$/;
        var ret;
        if (null !== (ret = parseURL.RE.exec(str))) {
            var specObj = {};
            for (var i = 0, j = parseURL.SPEC.length; i < j; i++) {
                var curSpec = parseURL.SPEC[i];
                specObj[curSpec] = ret[i + 1];
            }
            ret = specObj;
            specObj = null;
        }

        return ret;
    }

}
