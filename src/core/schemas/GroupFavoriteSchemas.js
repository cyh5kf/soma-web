import {compile} from '../../utils/schema';

var TYPE_STRING = 'string';
var TYPE_NUMBER = 'number';

export const GroupFavoriteSrc = {
    gid: TYPE_STRING,
    name: TYPE_STRING,
    avatar: TYPE_STRING
};

/**
 * 这是一个通用的Schema,不是好友的数据接口也是这样的.
 */
export const GroupFavoriteSchema = compile({
    ...GroupFavoriteSrc,
    __options: {
        notRequired: ['avatar']
    }
});


export const GroupFavoriteListSchema = compile([GroupFavoriteSchema]);
