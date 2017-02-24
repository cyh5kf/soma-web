import immutable from 'immutable';
import {forEach,getValue} from './functions';




/**
 *
 * @param immutableOldList 一定是一个Immutable对象
 * @param addList  Immutable或者普通的js数组,都可以.
 * @param keyName 字符串,用来比较对象值
 * @param mergeFunction
 * @param createFunction
 * @returns {*}
 */
export function pushOrMergeElement(immutableOldList,addList,keyName,mergeFunction,createFunction){

    var pushList = immutable.fromJS([]);
    var newList = immutableOldList;

    //1. merge
    forEach(addList || [], function (addObject) {
        var value = getValue(addObject,keyName);
        var oldObjectIndex = immutableOldList.findIndex(function (oldObj) {
            var oldValue = getValue(oldObj,keyName);
            return oldValue === value;
        });
        if (oldObjectIndex >= 0) {
            var oldObject = immutableOldList.get(oldObjectIndex);
            newList = newList.set(oldObjectIndex, mergeFunction(oldObject, addObject));
        } else {
            pushList = pushList.push(createFunction(addObject));
        }
    });

    //2.push
    newList = newList.concat(pushList);


    return newList;
}