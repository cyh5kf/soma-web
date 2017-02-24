import React from 'react';
import moment from 'moment';
import Clipboard from 'clipboard';
import PureRenderComponent from '../../../../components/PureRenderComponent';
import Dropdown from '../../../../components/dropdown/Dropdown';
import Menu, {MenuItem} from '../../../../components/menu/Menu';
import confirm from '../../../../components/popups/confirm';
import toast from '../../../../components/popups/toast';
import {buildCacheManager} from '../../../../utils/cacheManager';
import EnumMsgStatus from  '../../../../core/enums/EnumMsgStatus';
import {ValidMessageSchema} from '../../../../core/schemas/MessageSchemas';
import {WebSessionType} from '../../../../core/protos/protos'
import {resendMsgCmd, decryptFileMsgDataUrlCmd} from '../../../../core/commands/MessagesCommands';
import ReactPropTypes from '../../../../core/ReactPropTypes';
import Dialog from '../../../../components/dialog/Dialog';
import ForwardMessageDialog from '../../../dialogs/ForwardMessageDialog/ForwardMessageDialog';

import './MessageItemBase.less';

const MY_MSG_STATUS_MAP = {
    [EnumMsgStatus.MySendFailed]: 'failed',
    [EnumMsgStatus.MySending]: 'sending',
    [EnumMsgStatus.MySent]: 'sent',
    [EnumMsgStatus.MyReceived]: 'received',
    [EnumMsgStatus.MyRead]: 'read'
};

function copyText(text) {
    const node = document.createElement('div');
    node.setAttribute('data-clipboard-text', text);
    new Clipboard(node);
    node.click();
}

function downloadSrc(src, filename = 'download') {
    const anchor = document.createElement('a');
    anchor.href = src;
    anchor.download = filename;
    anchor.target='_blank';
    anchor.click();
}

const msgSendTimeCache = buildCacheManager();

export default class MessageItemBase extends PureRenderComponent {
    static propTypes = {
        message: ReactPropTypes.ofSchema(ValidMessageSchema).isRequired,
        loginUid: ReactPropTypes.string.isRequired,
        locale: ReactPropTypes.ofLocale().isRequired
    };

    static MENU_FORWARD = 'forward';
    static MENU_COPY = 'copy';
    static MENU_DOWNLOAD = 'download';

    cls = '';
    shouldRenderTimeAndStatus = true;

    renderTimeAndStatus(cls = '') {
        const {message: {msgSrvTime}} = this.props,
            timeDisplay = msgSendTimeCache.get(msgSrvTime) || msgSendTimeCache.set(msgSrvTime, moment(msgSrvTime).format('HH:mm'));
        return <span className={`msg-time-status ${cls}`}>{timeDisplay}</span>
    }

    getMenuConfigs(message) {
        return [];
    }

    //打开转发弹窗
    openForwardDialog() {
        var {message, locale} = this.props;

        Dialog.openDialog(ForwardMessageDialog, {
            message: message
        });
    }

    handleMenu(key) {
        const {message} = this.props;
        switch (key) {
            case MessageItemBase.MENU_COPY:
                copyText(message.text);
                break;
            case MessageItemBase.MENU_DOWNLOAD:
                if (message.fileUrlOrBlobUrl) {
                    downloadSrc(message.fileUrlOrBlobUrl, `download_${Date.now()}.${message.ext || ''}`);
                } else {
                    toast('Content downloading. Please try it later.');
                    if (!decryptFileMsgDataUrlCmd.isPending(message.msgId)) {
                        decryptFileMsgDataUrlCmd(message);
                    }
                }
                break;
            case MessageItemBase.MENU_FORWARD:
                this.openForwardDialog();
                break;
            default:
                window.alert('TODO...');
        }
    }

    handleResendClick = () => {
        const {message, locale} = this.props;
        if (!resendMsgCmd.isPending(message.msgId)) {
            confirm({
                content: locale['delivery_fail_resend'],
                buttons: [{
                    label: locale['common.cancel'],
                    className: 'button-gray',
                    onClick(dialog) { dialog.close(); }
                }, {
                    label: locale['common.yes'],
                    className: 'button-blue',
                    onClick(dialog) {
                        resendMsgCmd(message);
                        dialog.close();
                    }
                }]
            });
        }
    }

    _handleMenuSelect = ({key}) => this.handleMenu(key);

    renderContent() {
        return null;
    }

    render() {
        const {message, loginUid} = this.props,
            {msgStatus,msgId} = message,
            isOwnMsg = message.fromUid === loginUid,
            isP2PMsg = message.sessionType === WebSessionType.WEB_SESSION_TYPE_P2P,
            statusCls = MY_MSG_STATUS_MAP[msgStatus] || '',
            menuCfgs = this.getMenuConfigs(message);
        return (
            <div className={`message-item ${this.cls} ${statusCls} ${isOwnMsg ? 'own-msg' : ''} ${isP2PMsg ? 'p2p-msg' : 'group-msg'}`} data-msgid={msgId}>
                {this.renderContent()}
                {this.shouldRenderTimeAndStatus && this.renderTimeAndStatus()}
                {menuCfgs.length > 0 && (
                    <div className="icon-msg-menu">
                        <Dropdown className="icon-content" onSelect={this._handleMenuSelect} popoverPlacement={isOwnMsg ? 'bottom-end' : 'bottom-start'}>
                            <Menu>
                                {menuCfgs.map(menuCfg => <MenuItem key={menuCfg.key} disabled={menuCfg.disabled}>{menuCfg.label}</MenuItem>)}
                            </Menu>
                        </Dropdown>
                    </div>
                )}
                {msgStatus === EnumMsgStatus.MySendFailed && <i className="msg-failure-icon" onClick={this.handleResendClick}/>}
            </div>
        );
    }
}
