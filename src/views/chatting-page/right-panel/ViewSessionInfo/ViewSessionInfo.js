import React,{PropTypes} from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import SwitchBtn from '../../../../components/buttons/SwitchBtn';
import BlueLoading from '../../../../components/loading/BlueLoading';
import exposeLocale from '../../../../components/exposeLocale';
import ContactListDialog from '../../../dialogs/ContactListDialog/ContactListDialog';
import FriendAccountStore from '../../../../core/stores/FriendAccountStore';
import UserAccountStore,{USER_ACCOUNT_EVENTS} from '../../../../core/stores/UserAccountStore';
import Dialog from '../../../../components/dialog/Dialog';
import RightPanelHeader from '../components/RightPanelHeader';
import {createGroupSessionCmd,removeSessionCmd} from '../../../../core/commands/SessionsCommands';
import EnumStatusType from '../../../../core/enums/EnumStatusType';
import SessionsStore from '../../../../core/stores/SessionsStore';
import UserSettingsStore,{USER_SETTINGS_EVENTS} from '../../../../core/stores/UserSettingsStore';
import {toggleSessionMuteCmd} from '../../../../core/commands/UserSettingsCommands';
import {ensureUserAccountsCmd} from '../../../../core/commands/UsersCommands';
import {formatPhoneNumber,formatUserAccountLastSeen} from '../../../../core/core-utils/UserUtils';
import {formatSessionName} from '../../../../core/core-utils/SessionUtils';
import AvatarEditor from '../../../view-components/AvatarEditor/AvatarEditor';

import RightPanelManager from '../RightPanelManager';

import './ViewSessionInfo.less';

class InfoItem extends PureRenderComponent {

    static propTypes = {
        title: PropTypes.string,
        titleClass: PropTypes.string,
        childClass: PropTypes.string,
        onClick: PropTypes.func,
        children: PropTypes.node
    };


    onClick = ()=> {
        if (this.props.onClick) {
            this.props.onClick();
        }
    };

    render() {

        var props = this.props;
        var isTitleClick = (!!props.onClick);
        var titleClass = props.titleClass || "";
        var childClass = props.childClass || "";
        return (
            <div className="infoItem">
                <div className={`title click_${isTitleClick} ${titleClass}`} onClick={this.onClick}>{props.title}</div>
                <div className={`children ${childClass}`}>{props.children}</div>
            </div>);
    }

}

@exposeLocale()
export default class ViewSessionInfo extends PureRenderComponent {

    static propTypes = {
        sessionId: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            isSessionMuted: false,
            isLoading:false,
            userAccount: null,
            sessionInfo:null
        };
    }

    buildSessionInfo=(sessionId)=>{
        var {sessionInfo} = SessionsStore.getSession(sessionId);
        var uid = sessionInfo.sessionId; //对于单聊情况,sessionId就是uid
        var userAccount = UserAccountStore.getUserAccount(uid);
        var isSessionMuted = UserSettingsStore.isSessionMute(sessionInfo.sessionId,sessionInfo.sessionType);
        this.setState({userAccount: userAccount,sessionInfo:sessionInfo,isSessionMuted:isSessionMuted});
        return userAccount;
    };

    _handleUserSettingChange = ()=>{
        this.buildSessionInfo(this.props.sessionId);
    };

    _handleUserAccountChange = ()=>{
        this.buildSessionInfo(this.props.sessionId);
    };

    componentDidMount() {
        var sessionId =  this.props.sessionId;
        var userAccount = this.buildSessionInfo(sessionId);
        var uid = this.props.sessionId; //对于单聊情况,sessionId就是uid
        if(!userAccount){
            this.setState({isLoading: true});
            var callback = ()=>this.setState({isLoading: false});
            ensureUserAccountsCmd([uid], true).then(callback, callback);
        }else {
            ensureUserAccountsCmd([uid], true);
        }
    }

    componentWillReceiveProps(nextProps) {
        var sessionId = nextProps.sessionId;
        this.buildSessionInfo(sessionId);
    }

    componentWillMount() {
        UserAccountStore.on(USER_ACCOUNT_EVENTS.USER_ACCOUNT_STORE_CHANGE, this._handleUserAccountChange);
        UserSettingsStore.on(USER_SETTINGS_EVENTS.USER_SETTINGS_STORE_CHANGE, this._handleUserSettingChange);
    }

    componentWillUnmount() {
        UserAccountStore.off(USER_ACCOUNT_EVENTS.USER_ACCOUNT_STORE_CHANGE, this._handleUserAccountChange);
        UserSettingsStore.off(USER_SETTINGS_EVENTS.USER_SETTINGS_STORE_CHANGE, this._handleUserSettingChange);
    }

    /**
     * 点击切换按钮
     */
    toggleSessionMute=()=>{
        var sessionInfo =  this.state.sessionInfo;
        var isSessionMuted = this.state.isSessionMuted;
        var {sessionType,sessionId} = sessionInfo;
        toggleSessionMuteCmd({sessionId:sessionId, sessionType:sessionType, mute:!isSessionMuted});
    };


    /**
     * 点击删除会话
     */
    onDeleteChat = ()=> {
        removeSessionCmd(this.props.sessionId).then(function(){
            RightPanelManager.clearAllPanel();
        });
    };



    /**
     * 点击添加成员
     */
    onAddGroupMember = ()=> {
        var locale = this.state.locale;
        var sessionInfo = this.state.sessionInfo;
        var uid = sessionInfo.sessionId; //对于单聊情况,sessionId就是uid
        var withOutUids = [uid];
        var userAccountList = FriendAccountStore.getFriendAccountListWithOut(withOutUids);
        Dialog.openDialog(ContactListDialog, {
            title: locale['baba_group_addmember'],
            selectType: 2,
            userAccountList: userAccountList,
            onMemberSelectFinished: function (selectedUids, dialog) {
                selectedUids = selectedUids.concat([uid]);
                createGroupSessionCmd({
                    memberUids: selectedUids
                }).then(function(){
                    dialog.close();
                });
            }
        });
    };

    getStatusText({whatsUpType,sysWhatsUpNum,customWhatsUpContent},locale){
        if (whatsUpType === 0) {
            return locale[EnumStatusType[sysWhatsUpNum]];
        } else {
            return customWhatsUpContent;
        }
    }

    getPhotoPickerMenuItems=()=>{
        var locale = this.state.locale || {};
        return [
            {key: '1', content: locale['baba_web_profile_view'], action: 'viewPhoto'}
        ];
    };

    /**
     * 渲染除头部以外的内容区
     */
    renderContent(userAccount, locale, state, that) {
        userAccount = userAccount || {};

        var statusText = this.getStatusText(userAccount,locale);

        var displayPhoneNumber = formatPhoneNumber(userAccount.countryCode,userAccount.mobile);

        //P2P聊天中,如果不是我的好友,显示对方手机号,如果对方没有设置头像,头像显示成一个加号
        var displaySessionName = formatSessionName(state.sessionInfo,userAccount);

        var isMyFriend = userAccount['isMyFriend'];  //陌生人也可以添加成员建群,在这不做区分

        return (
            <div className="content">
                <AvatarEditor className="viewSessionInfo-avatar"
                              size={80}
                              imgSrc={userAccount.avatar}
                              name={displaySessionName}
                              menuItems={that.getPhotoPickerMenuItems()}
                              isVip={userAccount.isVip} />

                <div className="flex-cell ActionArea" >
                    <div className="session-name">{displaySessionName}</div>
                    <div className="session-last-time">{formatUserAccountLastSeen(userAccount,locale)}</div>
                </div>

                <div className="card flex-cell ActionArea" style={{marginTop:'24px'}}>
                    <InfoItem title={locale["baba_contactinfo_status"]} childClass="display-text">{statusText}</InfoItem>
                    <InfoItem title={locale["more_phone"]}>{displayPhoneNumber}</InfoItem>
                </div>

                <div className="card flex-cell ActionArea">

                    <InfoItem title={locale["common.mute"]} titleClass="title78">
                        <SwitchBtn isOpen={state.isSessionMuted} onClick={that.toggleSessionMute}/>
                    </InfoItem>

                    <InfoItem title={locale["baba_session_deletechat"]} titleClass="title78"
                              onClick={that.onDeleteChat} />
                </div>
                <div className="redBtnTop"></div>
                <div className="flex-cell redBtnWrapper">
                    <button className="btn-big-red" onClick={that.onAddGroupMember}>
                        <span className="ic_add_white" />{locale["baba_group_addmember"]}
                    </button>
                </div>
            </div>
        );
    }


    render() {
        var that = this;
        var state = that.state;
        var {locale,userAccount,isLoading} = state;
        return (
            <div className="rightPanel ViewSessionInfo">
                <RightPanelHeader title={locale["baba_chats_chatinfo"]}></RightPanelHeader>
                {isLoading ? <BlueLoading size={36} />:that.renderContent(userAccount, locale, state, that)}
            </div>
        );
    }

}