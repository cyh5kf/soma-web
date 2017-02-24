import React from 'react';
import pushjs from 'push.js';
import DocumentTitle from 'react-document-title';
import Favicon from '../../components/react-favicon';
import PureRenderComponent from '../../components/PureRenderComponent';
import AnimatorInAndOut from '../../components/AnimatorInAndOut';
import BodyClassName from 'react-body-classname';
import Loading from '../../components/loading/Loading';
import UserHeaderBar from './user-header-bar/UserHeaderBar';
import RecentSessions from './recent-sessions/RecentSessions';
import MessagePanel from './message-panel/MessagePanelComposer';
import LeftPanelPlaceHolder from './left-panel/LeftPanelPlaceHolder';
import RightPanelPlaceHolder from './right-panel/RightPanelPlaceHolder';
import SocketManager, {SOCKET_EVENTS} from '../../core/socket/SocketManager';
import exposeLocale from '../../components/exposeLocale';
import exposeDelayedState from '../../components/exposeDelayedState';
import exposeStoreData from '../view-components/exposeStoreData';
import exposePendingCmds from '../view-components/exposePendingCmds';
import SessionsStore, {SESSIONS_EVENTS} from '../../core/stores/SessionsStore';
import FriendAccountStore,{FRIEND_ACCOUNT_EVENTS} from '../../core/stores/FriendAccountStore';
import UserAccountStore,{USER_ACCOUNT_EVENTS} from '../../core/stores/UserAccountStore';
import GroupFavoriteStore,{GROUP_FAVORITE_EVENTS} from '../../core/stores/GroupFavoriteStore';
import {querySessionsCmd} from '../../core/commands/SessionsCommands';
import {queryLoginUserInfoCmd,updateMobStatCmd} from '../../core/commands/LoginCommands';
import {queryFriendAccountListCmd} from '../../core/commands/FriendAccountCommands';
import {getBatchUserLastSeenCmd,updateAllUserLastSeenCmd} from '../../core/commands/UsersCommands';
import LoginStore, {LOGIN_EVENTS} from '../../core/stores/LoginStore';
import UserSettingsStore, {USER_SETTINGS_EVENTS} from '../../core/stores/UserSettingsStore';
import {queryUserSettingsCmd,queryBlockListCmd} from '../../core/commands/UserSettingsCommands';
import {getGroupFavoriteListCmd} from '../../core/commands/GroupFavoriteCommands';
import {gerSomaConfigCmd} from '../../core/commands/SomaConfigCommand';
import LocaleConfig from '../../core/locale-config/LocaleConfig';
import SearchBox from '../../components/searchbox/SearchBox';
import  GsearchBox from '../../components/searchbox/GsearchBox';
import GlobalSearch from './left-panel/GlobalSearch/GlobalSearch';
import offlineImg from '../view-components/images/ic_error_red_16px.png';
import ChattingToast from '../view-components/ChattingToast/ChattingToast';

import './ChattingPage.less';

var updateAllUserLastSeenInterval = null;
var updateAllTimeInterval = null;

@exposeLocale()
@exposePendingCmds([querySessionsCmd])
@exposeStoreData([
    [SessionsStore, SESSIONS_EVENTS.SESSION_LIST_CHANGE, () => ({
        sessions: SessionsStore.getSessionInfos()
    })],
    [SessionsStore, SESSIONS_EVENTS.SEL_SESSION_CHANGE, () => ({
        selectedSessionId: SessionsStore.getSelectedSessionId()
    })],
    [LoginStore, LOGIN_EVENTS.CHANGE, () => ({
        userInfo: LoginStore.getUserInfo()
    })],
    [UserSettingsStore, USER_SETTINGS_EVENTS.USER_SETTINGS_STORE_CHANGE, () => ({
        userSettings: UserSettingsStore.getUserSettings()
    })],
    [FriendAccountStore, FRIEND_ACCOUNT_EVENTS.ACCOUNT_LIST_CHANGE, () => ({
        friendAccountList: FriendAccountStore.getFriendAccountList()
    })],
    [UserAccountStore, USER_ACCOUNT_EVENTS.USER_ACCOUNT_STORE_CHANGE, () => ({
        userAccountMap: UserAccountStore.getUserAccountMap()
    })],
    [GroupFavoriteStore, GROUP_FAVORITE_EVENTS.GROUP_FAVORITE_STORE_CHANGE, () => ({
        groupFavoriteList: GroupFavoriteStore.getGroupFavoriteList()
    })],
    [SocketManager, SOCKET_EVENTS.ON_CONNECTED_CHANGE, () => ({
        socketConnected: SocketManager.isConnected()
    })]
])
@exposeDelayedState([
    {key: 'delayedOnline', fromStateKey: 'online', delay: 1000},
    {key: 'delayedSockedConnected', fromStateKey: 'socketConnected', delay: 1000}
])
export default class ChattingPageComposer extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            searchText: '',
            isSearchFocus: false,
            warnForNotify: pushjs.Permission.get() === 'default',
            isLocaleLoaded : false,
            timestamp: new Date().getTime()
        };
    }

    requestNotifyPermission = () => {
        const updateNotifyState = () => this.setState({
            warnForNotify: pushjs.Permission.get() === 'default'
        });
        pushjs.Permission.request(updateNotifyState, updateNotifyState);
    };

    componentWillMount() {
        this.requestNotifyPermission();
        var locale = this.state.locale;
        var userInfo = LoginStore.getUserInfo();
        gerSomaConfigCmd();

        SocketManager.openAuthWebSocket(userInfo.uid,userInfo.token);
        querySessionsCmd();

        queryFriendAccountListCmd().then(({friendUidList})=>{
            getBatchUserLastSeenCmd(friendUidList);
        });
        queryLoginUserInfoCmd();
        updateMobStatCmd(true); //通知客户端登录成功

        //加载完UserSetting后,加载语言,使用客户端语言.
        queryUserSettingsCmd().then(({language})=>{
            queryBlockListCmd();
            var loginLang = userInfo.loginLang || language;
            LocaleConfig.load(loginLang).then(()=>{
                this.setState({isLocaleLoaded: true});
            });
        });

        getGroupFavoriteListCmd().catch(function () {
            var errorMsg = locale['common.servererror'];
            window.alert(errorMsg);
        });

        updateAllUserLastSeenInterval = setInterval(()=> {
            updateAllUserLastSeenCmd();
        }, 1000 * 60 * 1); //后台没有推送事件,每隔1分钟,去拉取一次

        updateAllTimeInterval = setInterval(()=> {
            this.setState({timestamp: new Date().getTime()});
        }, 1000 * 60 * 60 * 1); // 一小时更新一次

        this.onWindowOnlineChange();
        window.addEventListener('online', this.onWindowOnlineChange);
        window.addEventListener('offline', this.onWindowOnlineChange);

    }

    componentWillUnmount() {
        window.removeEventListener('online', this.onWindowOnlineChange);
        window.removeEventListener('offline', this.onWindowOnlineChange);

        if (updateAllUserLastSeenInterval) {
            clearInterval(updateAllUserLastSeenInterval);
            updateAllUserLastSeenInterval = null;
        }

        if (updateAllTimeInterval) {
            clearInterval(updateAllTimeInterval);
            updateAllTimeInterval = null;
        }

    }

    /**
     * 搜索框中文本发生变化
     * @param e
     */
    onSearcherChange = (e)=> {
        var value = e.target.value;
        this.setState({searchText: value});
    };

    quitGlobalSearch = ()=> {
        this.setState({
            isSearchFocus: false,
            searchText: ''
        });
    };

    onWindowOnlineChange = () => this.setState({online: navigator.onLine});

    onBlurSearchInput = ()=> {
        let searchText = this.state.searchText;
        if(!searchText) {
            this.setState({
                isSearchFocus: false
            });
        }
    };

    onClearSearchText=()=> {
        this.setState({searchText: ''});
    };

    onSearcherFocus =()=> {
        this.setState({isSearchFocus: true});
    };

    renderWarnTip(showOfflineState) {
        const {warnForNotify, locale} = this.state;
        let tipInfo = null;
        if (showOfflineState) {
            tipInfo = {
                cls: 'offline-tip',
                title: locale['inbox.tips.network'],
                subtitle: locale['inbox.tips.network.description']
            };
        } else if (warnForNotify) {
            tipInfo = {
                cls: 'notification-disabled-tip',
                title: 'Get Notified of New Mesages', // jyf: TODO: locale
                subtitle: 'Turn on desktop notifications', // jyf: TODO: locale
                onSubtitleClick: this.requestNotifyPermission
            };
        }
        return (
            <AnimatorInAndOut className="warn-tip-animator" leaveDuration={2000}>
                {!tipInfo ? null : (
                    <div className={`warn-tip ${tipInfo.cls}`}>
                        <i className="warn-tip-icon"/>
                        <div className="tip-title">{tipInfo.title}</div>
                        <div className={`tip-subtitle ${tipInfo.onSubtitleClick ? 'clickable' : ''}`} onClick={tipInfo.onSubtitleClick}>{tipInfo.subtitle}</div>
                    </div>
                )}
            </AnimatorInAndOut>
        );
    }

    //判断除chrome以外的浏览器
    isNotChrome() {
        var userAgent = navigator.userAgent;
        if (userAgent.indexOf("Chrome") === -1){
            return true;
        }

    }

    render() {
        const {sessions, selectedSessionId, userInfo, userSettings, locale, pendingCmds, searchText, isSearchFocus, friendAccountList, groupFavoriteList, delayedSockedConnected, delayedOnline, isLocaleLoaded,userAccountMap,timestamp} = this.state,
            showOfflineState = delayedSockedConnected === false || delayedOnline === false,
            tottalUnreadCnt = sessions ? sessions.reduce((total, session) => total + session.unreadMsgCount, 0) : 0;
        let that = this;
        if (userInfo.name == null || pendingCmds.isPending(querySessionsCmd) || !isLocaleLoaded) {
            return (
                <BodyClassName className="chatting-page-loading"><Loading type="blue-circle" width={80}/></BodyClassName>
            );
        }
        let isNotChrome = that.isNotChrome();

        return (
            <DocumentTitle title={(tottalUnreadCnt > 0 ? `(${tottalUnreadCnt > 99 ? '99+' : tottalUnreadCnt}) ` : '') + locale['baba_common_somaweb']}>
                <div className="chatting-page">
                    {showOfflineState && <Favicon url={offlineImg}/>}
                    {isNotChrome && <ChattingToast locale={locale} />}
                    <div className="chatting-page-left-panel">
                        <LeftPanelPlaceHolder />
                        <div className="chatting-page-left-panel-content ActionArea">
                            <UserHeaderBar userInfo={userInfo} locale={locale}/>
                            {this.renderWarnTip(showOfflineState)}
                            {
                                isSearchFocus?
                                    <GsearchBox searchText={searchText} parent={this}></GsearchBox> :
                                    <div className="recent-search">
                                        <SearchBox placeholder={locale['Search']} onFocus={that.onSearcherFocus}/>
                                    </div>

                            }
                            {
                                searchText?
                                    <GlobalSearch searchText={searchText} sessions={sessions} userAccountList={friendAccountList} groupFavoriteList={groupFavoriteList} userInfo={userInfo} userAccountMap={userAccountMap} parent={this}></GlobalSearch>:
                                    <RecentSessions timestamp={timestamp} sessions={sessions} groupFavoriteList={groupFavoriteList} selectedSessionId={selectedSessionId} userInfo={userInfo} userSettings={userSettings} locale={locale} userAccountMap={userAccountMap} />
                            }
                        </div>
                    </div>
                    <MessagePanel sessionId={selectedSessionId} userAccountMap={userAccountMap} locale={locale} userSettings={userSettings}/>
                    <RightPanelPlaceHolder />
                </div>
            </DocumentTitle>
        );
    }
}
