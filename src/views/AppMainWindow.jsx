import React, {PropTypes} from 'react';
import DocumentTitle from 'react-document-title';
import Favicon from '../components/react-favicon';
import PureRenderComponent from '../components/PureRenderComponent';
import exposeLocale from '../components/exposeLocale';
import LoginStore,{LOGIN_EVENTS} from '../core/stores/LoginStore';
import {browserHistory} from "react-router";
import logoImg from './view-components/images/ic_soma_16px.png';
import {clearAllStoreCmd} from '../core/commands/LoginCommands';

import './AppMainWindow.less';
import './LanguageRTL.less';

@exposeLocale()
export default class ApplicationMainWindow extends PureRenderComponent {
    static propTypes = {
        children: PropTypes.node
    };

    componentWillMount(){
        LoginStore.addEventListener(LOGIN_EVENTS.LOGGED_OUT, this._onLogout);
        LoginStore.bindWebsocketEvents();
    }

    componentWillUnmount(){
        LoginStore.removeEventListener(LOGIN_EVENTS.LOGGED_OUT, this._onLogout);
        LoginStore.unbindWebsocketEvents();
    }


    _onLogout=()=>{
        clearAllStoreCmd(false);
        console.info("ApplicationMainWindow-->login");
        browserHistory.push('/login');
    };


    render() {
        const {locale} = this.state;
        var soma_web_language_type = locale['soma_web_language_type'] || '';
        return (
            <DocumentTitle title={locale['baba_common_somaweb']}>
                <div className={`app-content  soma_web_language_${soma_web_language_type}`}>
                    <Favicon url={logoImg}/>
                    {React.Children.only(this.props.children)}
                </div>
            </DocumentTitle>
        );
    }
}
