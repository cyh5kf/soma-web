import React, {PropTypes} from 'react';
import Dialog from '../dialog/Dialog';
import Button from '../buttons/Button';

import './confirm.less';

class ConfirmDialog extends Dialog {
    static propTypes = {
        ...Dialog.propTypes,
        title: PropTypes.node,
        content: PropTypes.node.isRequired,
        buttons: PropTypes.arrayOf(PropTypes.shape({
            className: PropTypes.string,
            label: PropTypes.node,
            onClick: PropTypes.func.isRequired
        })).isRequired
    };

    static defaultProps = {
        ...Dialog.defaultProps,
        name: 'dlg-confirm'
    };

    handleBtnClick(targetButton) {
        targetButton.onClick(this,targetButton);
    }

    renderHeaderTitle() {
        return this.props.title;
    }

    renderFooter() {
        const {buttons} = this.props;
        return (
            <div className="footer-content">
                {buttons.map((btn, idx) => {
                    var btnClassName = "AutoFocusInput " + btn.className || '';
                    return <Button key={`key-${idx}`} className={btnClassName} data-idx={idx} onClick={this.handleBtnClick.bind(this,btn)}>{btn.label}</Button>
                })}
            </div>
        );
    }
    renderContent() {
        return this.props.content;
    }
}

export default function confirm({title, content, buttons, className = ''}) {

    if(!title){
        className+='  dlg-confirm-no-title ';
    }

    Dialog.openDialog(ConfirmDialog, {
        className: className,
        title,
        content,
        buttons
    });
}


export function confirmDanger(title,content,onOkCallback){
    var locale = window.gLocaleSettings;
    confirm({
        title:title,
        content: content,
        buttons: [
            {
                label: locale['common.cancel'],
                className: "button-gray",
                onClick: function (dialog) {
                    dialog.close();
                }
            },
            {
                label: locale['common.yes'],
                className: "button-red",
                onClick: function (dialog) {
                    onOkCallback && onOkCallback();
                    dialog.close()
                }
            }
        ],
        className:'dlg-confirm-danger'
    });
}

/*
示例 :
 confirm({
            title: "Enable Notifications",
            content: "SOMA does not have permission to send you push notification. To enable, go to your iPhone Settings > Notifications > SOMA",
            buttons: [
                {label:"Cancel",className:"button-gray",onClick:function(dialog){
                    dialog.close();
                }},
                {label:"Enable",className:"button-blue",onClick:function(dialog){dialog.close()}}
            ],
            className: ""
        });

 confirm({
            content: "Are you sure you want to remove your photo?",
            buttons: [
                {
                    label: "Cancel", className: "button-gray", onClick: function (dialog) {
                    dialog.close();
                }
                },
                {
                    label: "Remove", className: "button-red", onClick: function (dialog) {
                    dialog.close()
                }
                }
            ],
            className: ""
        });

*/