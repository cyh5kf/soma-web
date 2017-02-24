function forbidBackSpace(e) {

    var ev = e || window.event;

    if(ev.keyCode !== 8){
        return true;
    }

    var obj = ev.target || ev.srcElement;
    var t = obj.type || obj.getAttribute('type');
    var vReadOnly = obj.readOnly;
    var vDisabled = obj.disabled;
    vReadOnly = (vReadOnly == undefined) ? false : vReadOnly;
    vDisabled = (vDisabled == undefined) ? true : vDisabled;

    var isContentEditable = obj.getAttribute('contenteditable');
    if(!!isContentEditable){
        return true;
    }

    var flag1 = (ev.keyCode == 8) && (t == "password" || t == "text" || t == "textarea") && (vReadOnly == true || vDisabled == true);
    var flag2 = (ev.keyCode == 8) && t != "password" && t != "text" && t != "textarea";

    if (flag2 || flag1){
        return false;
    }
}





export function doForbidBackSpace(dom){
    //禁止后退键 作用于Firefox、Opera
    dom.onkeypress = forbidBackSpace;
    //禁止后退键  作用于IE、Chrome
    dom.onkeydown = forbidBackSpace;
}