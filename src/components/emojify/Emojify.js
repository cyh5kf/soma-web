import React, {PropTypes} from 'react';
import PureRenderComponent from '../PureRenderComponent';
import './Emojify.less';
import EmojifyPosNdUnicode from '../../utils/EmojifyPosNdUnicode';
import {convertUnicodeToChar} from '../../utils/EmojifyUtils';
import EmojifyPlaceholder from './EmojifyPlaceholder.gif';
import $ from 'webpack-zepto';



function noop() {
    // No operation performed.
}

function getPosition(name) {
    //see "rollup-core_required_ts.js of slack";
    var mul = 100 / 40;
    var mm = EmojifyPosNdUnicode[name] || {};
    var pos = mm.pos;
    var pX = null;
    var pY = null;
    if (pos) {
        pX = mul * pos[0];
        pY = mul * pos[1];
    }
    return {pX, pY};
}


export function convertShortCodeToChar(name){
    var mm = EmojifyPosNdUnicode[name] || {};
    var unicode = mm['ucd'];
    if(unicode){
        return convertUnicodeToChar(unicode);
    }
    return "";
}


/**
 * 生成HTML
 * @param name emojify的name
 * @param className
 * @param isImg 可选参数
 * @returns {*}
 */
export function toEmojifyHtml(name, className, isImg) {
    var pos = getPosition(name);
    if(!pos){
        return null;
    }

    var style = `background-position:${pos.pX}% ${pos.pY}%`;
    if (isImg === true) {
        var src = EmojifyPlaceholder;
        return `<img src='${src}' data-name='${name}' class='emoji ${className}' style='${style}' />`;
    } else {
        return `<div data-name='${name}' class='emoji ${className}' style='${style}' ></div>`;
    }
}


/**
 * 将含有类似 hello :smile: world 的字符串替换成 hello <div class="emoji"> world
 */
export function textToEmojifyHtml ({textDecrypted,defaultText},className = ''){
    if(!textDecrypted){
        defaultText = defaultText || "";
        return defaultText.replace(/</gm,'&lt;').replace(/>/gm,'&gt;');
    }else {
        textDecrypted = textDecrypted.replace(/</gm,'&lt;').replace(/>/gm,'&gt;');
        return textDecrypted.replace(/:[+\-_0-9a-zA-Z]+:/gm,function(e0){
            var e = e0.replace(/:/g,'');
            var t = toEmojifyHtml(e,className);
            return t || e0;
        });
    }
}


/**
 * 将html字符串中的img标签替换为 emojfy 字符
 * @param text
 * @param replaceFunc 可选参数,传入一个函数,用于生成替换后的字符串
 * @returns {*}
 */
export function replaceEmojifyTag(text,replaceFunc){
    text = text.replace(/<br>/gm, '\n');
    var $html = $("<div>" + text + "</div>");
    $html.find('.emoji').each(function () {
        var $this = $(this);
        var emoji = $this.attr('data-name');
        if(replaceFunc){
            $this.html(replaceFunc(emoji));
        }else {
            $this.html(":" + emoji + ":");
        }
    });
    return $html.text();
}


export default class Emojify extends PureRenderComponent {

    static propTypes = {
        name: PropTypes.string.isRequired,
        className: PropTypes.string,
        onClick: PropTypes.func
    };

    render() {

        var {name,className,onClick} = this.props;

        className = className || '';
        onClick = onClick || noop;

        var pos = getPosition(name);
        var style = {"backgroundPosition": `${pos.pX}% ${pos.pY}%`};

        return (
            <img data-name={name} onClick={onClick} className={`emoji ${className}`} style={style}
                 src={EmojifyPlaceholder}/>
        );
    }
}
