import emojifyResources from './EmojifyPosNdUnicode';
import {getCacheOrCreatePromise} from './PromiseCache';
import {loadEmojiLib} from './loadLibs';

export function convertUnicodeToChar (unicode) {
    var s, lo, hi;
    if (unicode.indexOf("-") > -1) {
        var parts = [];
        s = unicode.split('-');
        for (var i = 0; i < s.length; i++) {
            var part = parseInt(s[i], 16);
            if (part >= 0x10000 && part <= 0x10FFFF) {
                hi = Math.floor((part - 0x10000) / 0x400) + 0xD800;
                lo = ((part - 0x10000) % 0x400) + 0xDC00;
                part = (String.fromCharCode(hi) + String.fromCharCode(lo));
            }
            else {
                part = String.fromCharCode(part);
            }
            parts.push(part);
        }
        //return parts.join("\u200D");
        return parts.join('');
    }
    else {
        s = parseInt(unicode, 16);
        if (s >= 0x10000 && s <= 0x10FFFF) {
            hi = Math.floor((s - 0x10000) / 0x400) + 0xD800;
            lo = ((s - 0x10000) % 0x400) + 0xDC00;
            return (String.fromCharCode(hi) + String.fromCharCode(lo));
        }
        else {
            return String.fromCharCode(s);
        }
    }
}



var jsEmojiFix = {
    '2614':'umbrella_with_rain_drops'
};


function emojiUnicode2ShorCode(emojiConvertorData,idx){
    if (jsEmojiFix[idx]) {
        return ":" + jsEmojiFix[idx] + ":";
    }

    var dd = emojiConvertorData[idx] || {};
    var shorCodeArr = dd[3] || [];
    for (var i = 0; i < shorCodeArr.length; i++) {
        var shortCode = shorCodeArr[i];
        if (emojifyResources[shortCode]) {
            return ":" + shortCode + ":";
        }
    }
    return "";
}


function converEmojiCharToImage(emojiConvertor,str){

    if(!str){
        return str;
    }

    //对于形如 hello :smile: world中的文本的处理,替换成转义字符,避免显示成表情
    str = str.replace(/:/gm,'&#58;');

    var self = emojiConvertor;
    var emojiConvertorData= emojiConvertor['data'];
    self.init_unified();
    return str.replace(self.rx_unified, function(m, p1, p2){
        var val = self.map.unified[p1];
        if (!val) return m;
        var idx = null;
        if (p2 == '\uD83C\uDFFB') idx = '1f3fb';
        if (p2 == '\uD83C\uDFFC') idx = '1f3fc';
        if (p2 == '\uD83C\uDFFD') idx = '1f3fd';
        if (p2 == '\uD83C\uDFFE') idx = '1f3fe';
        if (p2 == '\uD83C\uDFFF') idx = '1f3ff';
        if (idx){
            return self.replacement(val, null, null, {
                idx	: idx,
                actual	: p2,
                wrapper	: ''
            });
        }

        return emojiUnicode2ShorCode(emojiConvertorData,val);
    });
}


export function loadEmojiLibPromise(){

    var emojiConvertor = window.EmojiConvertorInstance;
    if(emojiConvertor){
        return Promise.resolve(emojiConvertor);
    }

    //多次调用不会发起重复请求
    return getCacheOrCreatePromise("loadEmojiLib",30,()=>{
        return loadEmojiLib().then(()=>{
            var emojiConvertor = window.EmojiConvertorInstance || new window.EmojiConvertor();
            window.EmojiConvertorInstance = emojiConvertor;
            return emojiConvertor;
        });
    });

}


//如果Emoji库存在则解析,否则返回null
export function parseEmojiTextImmediately(sourceText){
    var emojiConvertor = window.EmojiConvertorInstance;
    if(emojiConvertor){
        return converEmojiCharToImage(emojiConvertor,sourceText);
    }
    loadEmojiLibPromise();
    return null;
}


export function parseEmojiText(sourceText){
     return loadEmojiLibPromise().then((emojiConvertor)=>{
         var textDecrypted = converEmojiCharToImage(emojiConvertor,sourceText);
         return textDecrypted;
     });
}