import React from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import Loading from '../../../components/loading/Loading';
import StringUtils from '../../../utils/StringUtils';
import RightPanelManager,{RIGHT_PANEL_KEY} from '../right-panel/RightPanelManager';
import AccountAvatar from '../../view-components/AccountAvatar/AccountAvatar';
import UserAccountStore, {USER_ACCOUNT_EVENTS} from '../../../core/stores/UserAccountStore';
import {SessionSchema} from '../../../core/schemas/SessionsSchemas';
import {WebSessionType} from '../../../core/protos/protos';
import ReactPropTypes from '../../../core/ReactPropTypes';
import {formatUserAccountLastSeen} from '../../../core/core-utils/UserUtils';
import {formatSessionName} from '../../../core/core-utils/SessionUtils';
import './MessagePanelHeader.less';


export default class MessagePanelHeader extends PureRenderComponent {
    static propTypes = {
        sessionInfo: ReactPropTypes.ofSchema(SessionSchema),
        locale: ReactPropTypes.ofLocale().isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            p2pUserAccount: this.getP2pUserAccount(props) //P2P聊天时,对方账号
        };
    }

    showSessionInfoPanel=()=>{
        const {sessionInfo} = this.props;
        const sessionType = sessionInfo.sessionType;
        const sessionId = sessionInfo.sessionId;
        if (sessionType === WebSessionType.WEB_SESSION_TYPE_P2P) {
            RightPanelManager.pushPanel(RIGHT_PANEL_KEY.VIEW_SESSION_INFO, {sessionId: sessionId})
        } else {
            RightPanelManager.pushPanel(RIGHT_PANEL_KEY.VIEW_GROUP_INFO, {sessionId: sessionId})
        }
    };

    getP2pUserAccount =(props)=>{
        const sessionInfo = props.sessionInfo || {};
        const sessionType = sessionInfo.sessionType;
        if (sessionType === WebSessionType.WEB_SESSION_TYPE_P2P) {
            const uid = sessionInfo.sessionId;
            return UserAccountStore.getUserAccount(uid);
        }
        return null;
    };

    componentWillMount() {
        UserAccountStore.on(USER_ACCOUNT_EVENTS.USER_ACCOUNT_STORE_CHANGE, this.handleUserAccountChange);
    }

    componentWillUnmount() {
        UserAccountStore.off(USER_ACCOUNT_EVENTS.USER_ACCOUNT_STORE_CHANGE, this.handleUserAccountChange);
    }

    handleUserAccountChange = ()=> {
        this.setUserAccountChange(this.props);
    };

    setUserAccountChange = (props)=> {
        this.setState({p2pUserAccount: this.getP2pUserAccount(props)});
    };

    componentWillReceiveProps(nextProps){
        if (nextProps.sessionInfo !== this.props.sessionInfo){
            this.setUserAccountChange(nextProps);
        }
    }


    renderContent() {
        const {p2pUserAccount} = this.state;
        const {sessionInfo, locale} = this.props,
            isGroup = sessionInfo.sessionType === WebSessionType.WEB_SESSION_TYPE_GROUP;
        let sessionDesc = null;
        if (isGroup) {
            const {memberCount} = sessionInfo;
            sessionDesc = StringUtils.formatLocale(memberCount > 1 ? locale['baba_ios_group_groupmems'] : locale['baba_ios_group_groupmem'], memberCount);
        } else {
            if(p2pUserAccount){
                sessionDesc = formatUserAccountLastSeen(p2pUserAccount,locale); //'[Today at 11:25 AM]';
            }else {
                sessionDesc = "";
            }
        }

        //P2P聊天中,如果不是我的好友,显示对方手机号,如果对方没有设置头像,头像显示成一个加号
        var displaySessionName = formatSessionName(sessionInfo,p2pUserAccount);
        console.log('Message Panel Header',sessionInfo.sessionLogo);
        return (
            <div className={`message-panel-header ${isGroup ? 'group-chat' : ''}`}>
                <div className="session-logo" onClick={this.showSessionInfoPanel}>
                    <AccountAvatar className="message-panel-avatar" name={displaySessionName} avatar={sessionInfo.sessionLogo} isVip={p2pUserAccount? p2pUserAccount.isVip: false}/>
                </div>

                <div className="session-info" onClick={this.showSessionInfoPanel}>
                    <div className="session-name text-ellipsis">{displaySessionName}</div>
                    <div className="session-desc text-ellipsis">{sessionDesc?sessionDesc:<Loading width={16} className="sessionDescLoading"/>}</div>
                </div>
                <i className="tb-show-session-details" onClick={this.showSessionInfoPanel}/>
            </div>
        );
    }

    render() {
        if (this.props.sessionInfo) {
            return this.renderContent();
        } else {
            return <div className="message-panel-header"></div>;
        }
    }
}
