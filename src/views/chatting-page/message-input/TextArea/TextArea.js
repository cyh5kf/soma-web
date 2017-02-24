import React, {PropTypes} from 'react';
import PureRenderComponent from '../../../../components/PureRenderComponent';
import gGlobalEventBus,{GLOBAL_EVENTS} from '../../../../core/dispatcher/GlobalEventBus';
import CursorManager from './CursorManager';
import './TextArea.less';

let ENTER_KEY_CODE = 13;


function containsAll(arrayA,arrayB){
    for(var i=0;i<arrayB.length;i++){
        var obj = arrayB[i];
        if(arrayA.indexOf(obj)<0){
            return false;
        }
    }

    return true;
}


export default class TextArea extends PureRenderComponent {
    static propTypes = {
        placeholder: PropTypes.string.isRequired,
        onEnter: PropTypes.func.isRequired,
        onContentChange:PropTypes.func.isRequired,
        className:PropTypes.string.isRequired
    };

    constructor() {
        super(...arguments);
    }

    shouldComponentUpdate(nextProps, nextState) {
        //它的更新不受state和props的控制
        return false;
    }

    /********************* API BEGIN ***************************/
    getContent() {
        var contentEditable = this.refs['contentEditable'];
        var content = contentEditable.innerHTML;
        return content;
    }

    clearContent() {
        var contentEditable = this.refs['contentEditable'];
        contentEditable.innerHTML = '';
        this._testPlaceholder();
    }

    replaceSelection(text) {
        if (text) {
            //CursorManager.restoreCursor();
            var contentEditable = this.refs['contentEditable'];
            contentEditable.focus();
            CursorManager.insertHtmlAtCursor(text);
        }
        this._testPlaceholder();
    }


    makeFocus(){
        var contentEditable = this.refs['contentEditable'];
        contentEditable.focus();
    }

    /********************* API END ***************************/


    _onKeyDown(e) {
        this._testPlaceholder(e);
        if (e.keyCode !== ENTER_KEY_CODE) {
            return;
        }
        if (e.keyCode === ENTER_KEY_CODE && (e.shiftKey || e.ctrlKey)) {
            return;
        }
        e.preventDefault();
        this.props.onEnter();
    }

    _onPaste(e) {
        var clipboardData = e.clipboardData;
        var userAgent = navigator.userAgent;
        if(userAgent.indexOf("Safari") > -1) {
            var clipboardDataTypes = clipboardData.types || [];
            if (clipboardDataTypes.length === 2 && containsAll(clipboardDataTypes,["public.tiff","image/tiff"])) {
                //粘贴纯图片
                e.preventDefault();
                return;
            }
        }

        //粘贴的时候,去出标签.
        var text = clipboardData.getData("text");
        if (text) {
            e.preventDefault();
            var fakeElement = document.createElement("textarea");
            fakeElement.textContent = text;
            text = fakeElement.innerHTML;
            text = text.replace(/\n/g, "<br/>");
            var isFirefox = userAgent.indexOf("Firefox") > 0;
            if (isFirefox) {
                CursorManager.insertHtmlAtCursor(text);
            } else {
                CursorManager.insertHtmlAtCursor("<span>" + text + "</span>");
            }
        }
        this._testPlaceholder();
    }


    _onContextMenu(e) {
        e.stopPropagation()
    }

    _onCut(){
        this._testPlaceholder();
    }

    _testPlaceholder() {
        var that = this;
        setTimeout(function () {
            var placeholder = that.refs['placeholder'];
            var content = that.getContent() || '';
            var isTextAreaEmpty = false;
            if (content.length > 0) {
                isTextAreaEmpty = false;
                placeholder.style.display = 'none';
            } else {
                isTextAreaEmpty = true;
                placeholder.style.display = '';
            }
            that.props.onContentChange(content,isTextAreaEmpty);
        }, 10);
    }

    _makeMsgInputFocus = ()=>{
        if(document.activeElement.className==='contentEditable'){
            return;
        }

        var contentEditable = this.refs['contentEditable'];
        contentEditable.focus();
        CursorManager.setEndOfContenteditable(contentEditable);
    };

    componentDidMount() {
        gGlobalEventBus.addEventListener(GLOBAL_EVENTS.FOCUS_MSG_INPUT, this._makeMsgInputFocus);
        this._makeMsgInputFocus();
    }

    componentWillUnmount() {
        gGlobalEventBus.removeEventListener(GLOBAL_EVENTS.FOCUS_MSG_INPUT, this._makeMsgInputFocus);
    }


    render() {
        var that = this;
        var {placeholder,className} = that.props;
        return (
            <div className={`TextArea ${className}`} >
                <div className="placeholder" ref="placeholder">{placeholder}</div>
                <div contentEditable={true}
                     ref="contentEditable"
                     className="contentEditable"
                     onPaste={that._onPaste.bind(that)}
                     onCut={that._onCut.bind(that)}
                     onKeyDown={that._onKeyDown.bind(that)}
                     onContextMenu={that._onContextMenu.bind(that)}>
                </div>
            </div>
        );
    }
}
