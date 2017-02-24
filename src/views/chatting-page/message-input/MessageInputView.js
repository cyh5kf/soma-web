import React, {PropTypes} from 'react';
import {showStyle} from '../../../utils/JSXRenderUtils';
import PureRenderComponent from '../../../components/PureRenderComponent';
import {toEmojifyHtml,replaceEmojifyTag,convertShortCodeToChar} from '../../../components/emojify/Emojify';
import TextArea from './TextArea/TextArea';
import EmojifyPanel from './EmojifyPanel/EmojifyPanel';
import SessionsStore,{SESSIONS_EVENTS} from '../../../core/stores/SessionsStore';
import {saveRecentEmojiListCmd} from '../../../core/commands/RecentEmojiCommands';
import ReactPropTypes from '../../../core/ReactPropTypes';
import UploadButton from '../../../components/UploadButton/UploadButton';
import {SessionSchema} from '../../../core/schemas/SessionsSchemas';
import EnumMsgType from '../../../core/enums/EnumMsgType';
import exposeLocale from '../../../components/exposeLocale';
import './MessageInputView.less';


@exposeLocale()
export default class MessageInputView extends PureRenderComponent {

    static propTypes = {
        sendMessage: PropTypes.func.isRequired,
        isBlocked: PropTypes.bool.isRequired,
        sessionInfo: ReactPropTypes.ofSchema(SessionSchema),
        locale: ReactPropTypes.ofLocale().isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            isEmojiPanelVisible: false,
            isTextAreaEmpty: true //输入框中是否有内容
        };
    }

    componentDidMount() {
        SessionsStore.on(SESSIONS_EVENTS.SEL_SESSION_CHANGE, this._makeEmojiPanelHidden);
    }

    componentWillUnmount() {
        SessionsStore.off(SESSIONS_EVENTS.SEL_SESSION_CHANGE, this._makeEmojiPanelHidden);
    }


    /**
     * 隐藏Emoji面板
     */
    _makeEmojiPanelHidden=()=>{
        this._makeDisplayEmojiPanel(false);
    };

    /**
     * 在输入文本框中按下回车键
     */
    _onTextAreaEnter = ()=> {
        var textarea = this._getTextArea();
        var msg = textarea.getContent();
        if (msg && msg.trim().length > 0) {
            this._sendMessage(msg);
            textarea.clearContent();
            this._makeDisplayEmojiPanel(false);
        }
    };

    /**
     * 发送消息
     * @param msg
     * @private
     */
    _sendMessage(msg) {
        var emojiList = [];

        msg = replaceEmojifyTag(msg, function (e) {
            emojiList.push(e);
            return convertShortCodeToChar(e);
            //return ":" + e + ": ";
        });
        saveRecentEmojiListCmd(emojiList);
        this.props.sendMessage(msg,EnumMsgType.Text);
    }


    /**
     * 选中一个表情
     */
    _onEmoji = (name)=> {
        var html = toEmojifyHtml(name, '', true);
        var textarea = this._getTextArea();
        textarea.replaceSelection(html);
    };

    _makeDisplayEmojiPanel = (isEmojiPanelVisible)=> {
        var that = this;
        var textarea = that._getTextArea();
        if(textarea){
            textarea.makeFocus();
        }

        var emojiPanel = that.refs['EmojifyPanel'];
        if(emojiPanel){
            if (isEmojiPanelVisible) {
                emojiPanel.show();
            } else {
                emojiPanel.hide();
            }
        }

        that.setState({
            isEmojiPanelVisible: isEmojiPanelVisible
        });
    };

    /**
     * 点击显示表情按钮
     */
    _onEmojiPicker = ()=> {
        var that = this;
        var isNextEmojiPanelVisible = !that.state.isEmojiPanelVisible;
        that._makeDisplayEmojiPanel(isNextEmojiPanelVisible);
    };

    _getTextArea = ()=> {
        return this.refs['TextArea'];
    };

    _preventMouseDown = (e)=> {
        //防止输入框失去焦点
        e.preventDefault();
        return false;
    };

    _onTextAreaContentChange = (content, isTextAreaEmpty)=> {
        this.setState({isTextAreaEmpty: isTextAreaEmpty});
    };


    _handleSelectAttachment = (e)=>{
        var file = e.target.files[0];
        this.props.sendMessage(file, EnumMsgType.Image);
    };

    renderMessageInputView() {
        var that = this;
        var isTextAreaEmpty = that.state.isTextAreaEmpty;
        var isEmojiPanelVisible = that.state.isEmojiPanelVisible;
        var isBlocked = this.props.isBlocked;
        var locale = this.state.locale;

        return (

            <div className="MessageInputView ActionArea">

                <div className="isMute" style={showStyle(isBlocked)}>
                    {locale['baba_web_blocked_input']}
                </div>

                <div onMouseDown={that._preventMouseDown} onContextMenu={that._preventMouseDown} style={showStyle(!isBlocked)}>
                    <EmojifyPanel ref="EmojifyPanel" onEmoji={that._onEmoji}/>
                </div>

                <div className="input-flex-wrapper" style={showStyle(!isBlocked)}>
                    <div className="input-flex">
                        <button
                            className="flex-emojiPicker"
                            onMouseDown={that._preventMouseDown}
                            onClick={that._onEmojiPicker}
                            style={showStyle(!isEmojiPanelVisible)}>
                        </button>
                        <button
                            className="flex-emojiPicker ic_hide_black"
                            onMouseDown={that._preventMouseDown}
                            onClick={that._onEmojiPicker}
                            style={showStyle(isEmojiPanelVisible)}
                        >
                        </button>
                        <TextArea
                            className="flex-textArea"
                            ref="TextArea"
                            placeholder={this.props.locale['baba_web_input_hint']}
                            onEnter={that._onTextAreaEnter}
                            onContentChange={that._onTextAreaContentChange}
                        />
                        <UploadButton className="flex-obj ic_attachment" accept="image/png,image/gif,image/jpg,image/jpeg" onSelect={this._handleSelectAttachment} />
                        <button className="flex-obj ic_voice ic_voice_disabled" style={showStyle(false)}></button>
                        <button className="flex-obj ic_send_black"  style={showStyle(isTextAreaEmpty)}></button>
                        <button className="flex-obj ic_send_blue" onClick={that._onTextAreaEnter}
                                style={showStyle(!isTextAreaEmpty)}></button>
                    </div>
                </div>

            </div>
        );
    }

    render(){
        return this.renderMessageInputView();
    }
}
