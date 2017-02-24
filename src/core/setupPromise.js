import isString from 'lodash/isString';
import warning from '../utils/warning';
import toast from '../components/popups/toast';

window.onunhandledrejection = event => {
    const {reason} = event;
    let errMsg = 'error...';
    if (isString(reason)) {
        errMsg = reason;
    } else if (reason.errorCode) {
        const method = reason.response && reason.response.method;
        errMsg = `${method && (method + ': ')}Error Code: ${reason.errorCode}`;
    } else if (reason.message) {
        errMsg = reason.message;
    }
    warning(reason.stack || errMsg);

    if(__DEV__){
        toast(errMsg);
    }

};
