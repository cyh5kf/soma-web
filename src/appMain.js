import 'normalize.css';
import './components/normalize.less';
import './core/include-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import {Router, browserHistory} from 'react-router';
import './core/setupPromise';
import LocaleConfig from './core/locale-config/LocaleConfig';
import AppRouteConfig from './views/AppRouteConfig';
import SocketManager from './core/socket/SocketManager';
import socketProtoCoders from './core/socket/socketProtoCoders';
import {focusMsgInputIfNotInAction} from './core/core-utils/focusMsgInput';
import {doForbidBackSpace} from './core/core-utils/forbidBackSpace';

SocketManager.setupSocketProtoCoders(socketProtoCoders);

LocaleConfig.load().then(() => {

    var doc = document;
    focusMsgInputIfNotInAction(doc);
    doForbidBackSpace(doc);//禁止退格键让浏览器回退到登录页面

    ReactDOM.render(
        <Router history={browserHistory} routes={AppRouteConfig}/>,
        document.getElementById("app")
    );
});
