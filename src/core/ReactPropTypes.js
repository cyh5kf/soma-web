import {PropTypes} from 'react';
import keys from 'lodash/keys';
import values from 'lodash/values';
import {ReactPropTypes as schemaPropTypes} from '../utils/schema';
import createReactTypeChecker from '../utils/createReactTypeChecker';

const _localeCheckFields = ['settings_title_language', 'sticker_rewardstickers_contactlist_invited', 'talk.delete.message.alert'];

export default {
    ...PropTypes,

    // 验证为schema数据(默认为immutable格式, 也可以指定为非immutable格式)
    ofSchema: schemaPropTypes.ofSchema,
    ofSchemas: (schemas, {isImmutable = true} = {}) => PropTypes.oneOfType(schemas.map(oneSchema => {
        return schemaPropTypes.ofSchema(oneSchema, {isImmutable});
    })),

    // 验证为enum对象中的值
    ofEnum: enumObj => PropTypes.oneOf(values(enumObj)),

    // 验证为 exposePendingCmds 导出的检查cmd进行中状态的对象
    pendingCmds: PropTypes.shape({
        isPending: PropTypes.func.isRequired
    }),

    // 验证本地化对象
    ofLocale: () => createReactTypeChecker((props, propName, componentName, location, propFullName) => {
        const propValue = props[propName];
        if (_localeCheckFields.some(field => propValue[field] == null)) {
            const dataKeys = JSON.stringify(keys(propValue));
            return new Error(`'${componentName}'中 ${location} '${propFullName}' 数据不合法, 期望得到locale数据, 实际包含字段为: ${dataKeys}.`);
        } else {
            return null;
        }
    })
};
