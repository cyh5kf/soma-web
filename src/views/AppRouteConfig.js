import React from 'react';
import {Route, IndexRoute} from 'react-router';

import AppMainWindow from './AppMainWindow';
import ChattingPage from './chatting-page/ChattingPage';
import LoginPage from './login-page/LoginPage';
import LoginConfirmSimulate from './login-page/LoginConfirmSimulate';
import NotFoundPage from './NotFoundPage';
import LoginStore from '../core/stores/LoginStore';


const isLoggedIn = () => LoginStore.isLoggedIn();

function requireLogin(nextState, replace) {
    if (!isLoggedIn()) {
        console.info("AppRouteConfig-->login");
        replace('/login');
    }
}


export default (
    <Route path="/" component={AppMainWindow}>
        <IndexRoute component={ChattingPage} onEnter={requireLogin} />
        <Route path="login" component={LoginPage} />
        <Route path="LoginConfirmSimulate" component={LoginConfirmSimulate}/>
        <Route path="*" component={NotFoundPage}/>
    </Route>
);
