import {
    compile
} from '../../utils/schema';
import {UserAccountSrc} from './UserAccountSchemas';


var TYPE_STRING = 'string';
var TYPE_NUMBER = 'number';

export const UserProfileSchema = compile({

    token: TYPE_STRING,
    loginVersion: TYPE_STRING,
    loginPublicKey: [TYPE_NUMBER],
    loginPrivateKey: [TYPE_NUMBER],
    loginLang: TYPE_STRING,

    ...UserAccountSrc,

    __options: {
        //在登录过程中,都有可能不存在,但是登录完毕后,所有字段都是有的.
        notRequired: "*"
    }
});
