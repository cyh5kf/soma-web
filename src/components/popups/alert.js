import React from 'react';
import ReactDOM from 'react-dom';
import ReactAlert from 'react-alert';
import PureRenderComponent from '../PureRenderComponent';

export let alertInst = null;

class ReactAlertWrapper extends PureRenderComponent {
    state = {
        offset: 5,
        position: 'top right',
        theme: 'dark',
        time: 2000,
        transition: 'scale'
    };

    render() {
        return <ReactAlert ref={comp => alertInst = comp} {...this.state}/>;
    }
}

const alertContainerNode = document.createElement('span');
document.body.appendChild(alertContainerNode);
ReactDOM.render(<ReactAlertWrapper/>, alertContainerNode);

/**@param {string} message
 * @param {number} [time]
 * @param {string} [icon]
 * @param {['info', 'success', 'error']} type */
export function showAlert(message, {time, icon, type = 'info'} = {}) {
    const options = {type};
    time != null && (options.time = time);
    icon != null && (options.icon = icon);

    alertInst.show(message, options);
}

const _bindAlertType = type => (message, options) => showAlert(message, {type, ...options});

export const alertInfo = _bindAlertType('info');
export const alertSuccess = _bindAlertType('success');
export const alertError = _bindAlertType('error');

export function removeAllAlerts() {
    alertInst.removeAll();
}
