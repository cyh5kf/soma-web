import React,{PropTypes} from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import {hideStyle} from '../../../../utils/JSXRenderUtils';
import RightPanelManager,{RIGHT_PANEL_KEY} from '../RightPanelManager';
import SwitchBtn from '../../../../components/buttons/SwitchBtn';
import Dialog from '../../../../components/dialog/Dialog';
import exposeLocale from '../../../../components/exposeLocale';
import ContactListDialog from '../../../dialogs/ContactListDialog/ContactListDialog';
import RightPanelHeader from '../components/RightPanelHeader';
import {UserAccountListSchema} from '../../../../core/schemas/UserAccountSchemas';
import {ensureUserAccountsCmd} from '../../../../core/commands/UsersCommands';
import UserAccountStore from '../../../../core/stores/UserAccountStore';
import FriendAccountStore from '../../../../core/stores/FriendAccountStore';
import SomaConfigStore from '../../../../core/stores/SomaConfigStore';
import LoginStore from '../../../../core/stores/LoginStore';
import UserSettingsStore,{USER_SETTINGS_EVENTS} from '../../../../core/stores/UserSettingsStore';
import {createImmutableSchemaData} from '../../../../utils/schema';
import {addGroupMembersCmd, leaveGroupCmd,renameGroupCmd,updateGroupAvatarCmd,removeSessionCmd} from '../../../../core/commands/SessionsCommands';
import {toggleSessionMuteCmd} from '../../../../core/commands/UserSettingsCommands';
import {selectSessionCmd} from '../../../../core/commands/SessionsCommands';
import ContactList from '../../../view-components/ContactList/ContactList';
import {confirmDanger} from '../../../../components/popups/confirm';
import SessionsStore, {SINGLE_SESSION_EVENTS} from '../../../../core/stores/SessionsStore';
import AvatarEditor from '../../../view-components/AvatarEditor/AvatarEditor';
import ViewInput from '../../../../components/ViewInput/ViewInput';
import GroupMemberExtend from './GroupMemberExtend';
import CommonListItem from '../../../view-components/ContactList/CommonListItem';
import {WebSessionType} from '../../../../core/protos/protos';
import focusMsgInput from '../../../../core/core-utils/focusMsgInput';

import './ViewGroupInfo.less';


function toImmutableUserAccountSchema(json) {
    return createImmutableSchemaData(UserAccountListSchema, json);
}

const MAX_DISPLAY_MEMBER_COUNT = 4;

@exposeLocale()
export default class ViewGroupInfo extends PureRenderComponent {


    static propTypes = {
        sessionId: PropTypes.string.isRequired
    };


    constructor(props) {
        super(props);
        this.state = {
            groupMaxMembers:SomaConfigStore.getGroupMaxMembers(),
            sessionInfo: null,
            displayGroupMembers: toImmutableUserAccountSchema([]), //最多只有MAX_DISPLAY_MEMBER_COUNT个
            allGroupMembers: toImmutableUserAccountSchema([]),
            isSessionMuted : false
        };
    }

    buildSessionInfoMembers(sessionId) {
        var that = this;

        var {sessionInfo} = SessionsStore.getSession(sessionId);
        if (sessionInfo) {
            var members = sessionInfo.members;
            var memberUidList = [];
            if(members){
                members.forEach(function (m) {memberUidList.push(m.uid);});
            }

            ensureUserAccountsCmd(memberUidList).then(function () {

                var isSessionMuted = UserSettingsStore.isSessionMute(sessionInfo.sessionId, sessionInfo.sessionType);
                var allGroupMembers = UserAccountStore.getUserAccountList(memberUidList);
                var displayGroupMembers = allGroupMembers.slice(0, MAX_DISPLAY_MEMBER_COUNT);

                that.setState({
                    allGroupMembers: allGroupMembers,
                    displayGroupMembers: displayGroupMembers,
                    isSessionMuted: isSessionMuted,
                    sessionInfo: sessionInfo
                });

            });
        }
    }

    componentDidMount() {
        var sessionId = this.props.sessionId;
        this.buildSessionInfoMembers(sessionId);
    }


    componentWillReceiveProps(nextProps) {
        var sessionId = nextProps.sessionId;
        this.buildSessionInfoMembers(sessionId);
    }

    _handleSingleSessionDataChange = ({sessionId}) => {
        if (this.props.sessionId === sessionId) {
            this.buildSessionInfoMembers(sessionId);
        }
    };

    _handleUserSettingChange = ()=>{
        this.buildSessionInfoMembers(this.props.sessionId);
    };

    componentWillMount() {
        SessionsStore.on(SINGLE_SESSION_EVENTS.SESSION_INFO_CHANGE, this._handleSingleSessionDataChange);
        UserSettingsStore.on(USER_SETTINGS_EVENTS.USER_SETTINGS_STORE_CHANGE, this._handleUserSettingChange);
    }

    componentWillUnmount() {
        SessionsStore.off(SINGLE_SESSION_EVENTS.SESSION_INFO_CHANGE, this._handleSingleSessionDataChange);
        UserSettingsStore.off(USER_SETTINGS_EVENTS.USER_SETTINGS_STORE_CHANGE, this._handleUserSettingChange);
    }

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
     * 点击查看所有群成员
     */
    onClickShowAllGroupMember = ()=> {
        var sessionId = this.props.sessionId;
        RightPanelManager.pushPanel(RIGHT_PANEL_KEY.VIEW_GROUP_INFO_ALL_MEMBER, {sessionId: sessionId});
    };


    /**
     * 点击分享链接
     */
    onClickInviteLink =()=>{

    };

    /**
     * 点击添加群成员的操作
     */
    onClickAddMember = ()=> {
        var locale = this.state.locale;
        var groupMaxMembers = this.state.groupMaxMembers;
        var sessionInfo = this.state.sessionInfo;
        var sessionId = sessionInfo.sessionId;
        var members = sessionInfo.members;

        var withOutUids = [];
        if (members) {
            members.forEach(function (m) {
                withOutUids.push(m.uid);
            });
        }


        var userAccountList = FriendAccountStore.getFriendAccountListWithOut(withOutUids);

        Dialog.openDialog(ContactListDialog, {
            title: locale['baba_group_addmember'],
            selectType: 2,
            userAccountList: userAccountList,
            onMemberSelectFinished: function (selectedUids, dialog) {
                dialog.displayLoading(true);
                addGroupMembersCmd({
                    gid: sessionId,
                    memberUids: selectedUids
                }).then(function () {
                    dialog.close();
                }).catch(function (errorObject) {
                    var errorMsg = locale['common.servererror'];
                    var {errorCode} = errorObject || {};
                    if (errorCode === 3006) {
                        errorMsg = locale['groups_nearby_invite_notice3'];
                        errorMsg = errorMsg.replace('%d', groupMaxMembers);
                    }

                    dialog.displayErrorMsg(true, errorMsg);
                    dialog.displayLoading(false);
                });
            }
        });
    };

    onClickLeaveGroupBtn = () => {
        const {locale,sessionInfo: {sessionId}} = this.state;
        const title = locale['circleview.quit'];
        const content = locale['circleview.quitdescription'];
        confirmDanger(title, content, function () {
            !leaveGroupCmd.isPending(sessionId) && leaveGroupCmd(sessionId).then(function(){
                RightPanelManager.clearAllPanel();
            });
        });
    };


    handleCreateSingleChat = (userAccount)=>{
        var myUid = LoginStore.getUserInfo().uid;
        var uid = userAccount.uid;
        if (myUid === uid) {
            return;
        }
        const sessionId = uid;
        selectSessionCmd(sessionId,{createIfNotExist:true,sessionType: WebSessionType.WEB_SESSION_TYPE_P2P}).then(()=>{
            focusMsgInput();
        });
    };

    renderContactItemExtend = (data)=> {
        var sessionInfo = this.state.sessionInfo;
        if(!data){
            return null;
        }
        var memberInfo = data || {};
        var managerUids = sessionInfo.managerUids || [];//这是一个immutable List
        var uid = memberInfo.uid;
        var isGroupManager = managerUids.indexOf(uid) >= 0;
        return {
            isGroupManager:isGroupManager,
            extendComponent: <GroupMemberExtend memberInfo={memberInfo} sessionInfo={sessionInfo}/>
        }
    };

    getPhotoPickerMenuItems=()=>{
        var locale = this.state.locale || {};
        return [
            {key: '1', content: locale['baba_web_profile_view'], action: 'viewPhoto'},
            {key: '2', content: locale['baba_web_profile_change'], action: 'changePhoto'}
        ];
    };

    //修改群头像
    onAvatarUploaded=(result,onFinished)=>{
        var sessionId = this.props.sessionId;
        var newAvatar = result.imgUrl;
        updateGroupAvatarCmd({gid:sessionId, newAvatar:newAvatar}).then(function(){
            onFinished();
        });
    };


    //修改Session名称
    onModifySessionName =(newName,onFinished)=>{
        var sessionId = this.props.sessionId;
        renameGroupCmd({gid:sessionId, newName:newName}).then(function(){
            onFinished();
        },()=>{
            console.error("error");
            onFinished();
        });
    };


    render() {
        var that = this;
        var state = this.state;

        var sessionInfo = this.state.sessionInfo;
        if (!sessionInfo) {
            return <div></div>
        }

        var isSessionMuted = state.isSessionMuted;
        var groupMaxMembers = state.groupMaxMembers;
        var memberCount = sessionInfo.memberCount || 0;
        var locale = state.locale;
        var displayGroupMembers = state.displayGroupMembers;

        console.log('VIew GroupInfo',sessionInfo.sessionLogo);

        return (
            <div className="rightPanel ViewGroupInfo">

                <RightPanelHeader title={locale['baba_group_groupinfo']}></RightPanelHeader>

                <div className="content">

                    <AvatarEditor className="sessionLogo ActionArea"
                                 size={80}
                                 imgSrc={sessionInfo.sessionLogo}
                                 name={sessionInfo.sessionName}
                                 menuItems={that.getPhotoPickerMenuItems()}
                                 onAvatarUploaded={that.onAvatarUploaded} />

                    <div className="card groupName ActionArea">
                        <div className="title">{locale['group.chat.name.title']}</div>
                        <ViewInput value={sessionInfo.sessionName} maxLength={25} onConfirm={this.onModifySessionName} />
                    </div>


                    <div className="groupMemberCount">
                        {locale['baba_group_groupmem']}: {memberCount} / {groupMaxMembers}
                    </div>

                    <div className="card groupMemberLoading" style={hideStyle(displayGroupMembers.size > 0)}>
                        <div className="loadingIcon"></div>
                    </div>

                    <div className="card groupMember ActionArea" style={hideStyle(displayGroupMembers.size === 0)}>

                        <CommonListItem
                            className="addMemberItem"
                            icon={<div className="iconWrapper"><div className="imgWrapper"/></div>}
                            content={locale['baba_group_addmember']}
                            onClick={that.onClickAddMember} />

                        <CommonListItem
                            className="createInviteItem"
                            icon={<div className="iconWrapper"><div className="imgWrapper"/></div>}
                            content={locale['baba_grpinvite_invitelink']}
                            onClick={that.onClickInviteLink} />

                        <ContactList userAccountList={displayGroupMembers}
                                     onClickContactItem={that.handleCreateSingleChat}
                                     renderItemExtend={that.renderContactItemExtend}
                                     selectType={0} />
                        <div className="showAllBtn" style={hideStyle(memberCount<=MAX_DISPLAY_MEMBER_COUNT)}>
                            <div className="info showAll" onClick={that.onClickShowAllGroupMember}>
                                {locale['shake.list.showall']}
                            </div>
                        </div>
                    </div>


                    <div className="card ActionArea">
                        <div className="infoItem">
                            <div className="title title78">{locale['common.mute']}</div>
                            <div className="children">
                                <SwitchBtn isOpen={isSessionMuted} onClick={that.toggleSessionMute}/>
                            </div>
                        </div>

                        <div className="infoItem title78 linkStyle" onClick={that.onDeleteChat} >
                            {locale['baba_session_deletechat']}
                        </div>

                    </div>

                    <div className="redBtnTop"></div>
                    <div className="flex-cell redBtnWrapper">
                        <button className="btn-big-red"
                            onClick={this.onClickLeaveGroupBtn}>{locale['circleview.quit']}</button>
                    </div>

                </div>
            </div>
        );
    }

}
