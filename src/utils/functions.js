import lodash_forEach from 'lodash/forEach';
import isFunction from 'lodash/isFunction';

export function isObjectPropsEq(obj,targetObject){
    var keys = Object.keys(targetObject);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var p1 = obj[key];
        var p2 = targetObject[key];
        if (p1 !== p2) {
            return false;
        }
    }
    return true;
}



export function isListContains(objectList,targetObject){
    if (!objectList) {
        return false;
    }
    var isContains = false;
    objectList = objectList.toJS ? objectList.toJS() : objectList;
    objectList.forEach(function (userAccount) {
        if (isObjectPropsEq(userAccount,targetObject)) {
            isContains = true;
        }
    });
    return isContains;
}

export function getMediaSize(maxWidth,maxHeight,sWidth,sHeight,loopCount = 0){

    if(loopCount > 2){
        //防止死循环
        console.log("[ERROR]getMediaSize");
        return {width: sWidth, height: sHeight}
    }

    var width = 100;
    var height = 100;
    var scale = 0;

    if (sHeight <= maxHeight && sWidth <= maxWidth) {
        return {width: sWidth, height: sHeight}
    }

    if (sHeight <= maxHeight && sWidth > maxWidth) {
        width = maxWidth;
        scale = sWidth / maxWidth; //> 1
        height = sHeight / scale;
    }

    if (sHeight > maxHeight && sWidth <= maxWidth) {
        height = maxHeight;
        scale = sHeight / maxHeight;//>1
        width = sWidth / scale;
    }

    if (sHeight > maxHeight && sWidth > maxWidth) {
        height = maxHeight;
        scale = sHeight / maxHeight;//>1
        sWidth = sWidth / scale;
        width = sWidth;
    }

    if(width > maxWidth || height > maxHeight){
        return getMediaSize(maxWidth,maxHeight,width,height,loopCount+1);
    }

    width = Math.round(width);
    height = Math.round(height);

    return {width: width, height:height};

}




export function getMaxValueFromList(arrayOrList, attrName, defaultValue){
    if(!arrayOrList){
        return defaultValue;
    }

    var maxValue = defaultValue;
    forEach(arrayOrList,function(obj){
        var value = obj[attrName];
        maxValue = Math.max(maxValue,value);
    });

    //if(arrayOrList.forEach){
    //    arrayOrList.forEach(function(obj){
    //        var value = obj[attrName];
    //        maxValue = Math.max(maxValue,value);
    //    });
    //}else {
    //    forEach(arrayOrList,function(obj){
    //        var value = obj[attrName];
    //        maxValue = Math.max(maxValue,value);
    //    });
    //}

    return maxValue
}


export function forEach(arrayOrList, callback) {
    if (arrayOrList.forEach) {
        arrayOrList.forEach(callback);
    } else {
        lodash_forEach(arrayOrList, callback);
    }
}


var _undefined = undefined;
export function getValue(obj,keyName){
    var value = _undefined;
    if(isFunction(obj.get)){
        value = obj.get(keyName);
        return value;
    }
    return obj[keyName];
}