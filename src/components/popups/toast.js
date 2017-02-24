import React from 'react';
import ReactDOM from 'react-dom';

import Dialog from './../dialog/Dialog';

import './toast.less';

// 中央消息弹出提示
class Toast extends Dialog {
    static defaultProps = {
        ...Dialog.defaultProps,
        className: 'dlg-toast'
    };

    state = {show: false};

    open(msg = '') {
        super.open();
        this.setState({
            msg
        });
    }

    renderHeader() {
        return null;
    }

    renderFooter() {
        return null;
    }

    renderContent() {
        return <span>{this.state.msg}</span>;
    }
}

class ToastManager {
    constructor() {
        this._queue = [];
        this._toastInst = null;
        this._running = false;

        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast';
        document.body.appendChild(toastContainer);
        this._toastInst = ReactDOM.render(<Toast/>, toastContainer);
    }

    show(options) {
        this._queue.push(options);
        if (!this._running) {
            this._running = true;
            this._run()
                .then(() => this._running = false);
        }
    }

    _run() {
        const item = this._queue.shift();
        if (item) {
            return this._showToast(item.msg)
                .then(() => this._run());
        } else {
            return Promise.resolve();
        }
    }

    _showToast(msg = '') {
        return new Promise((resolve) => {
            this._toastInst.open(msg);
            setTimeout(() => {
                this._toastInst.close();
                resolve();
            }, 2000)
        });
    }
}

const toastManager = new ToastManager();

export default function toast(msg = '') {
    toastManager.show({msg});
}
