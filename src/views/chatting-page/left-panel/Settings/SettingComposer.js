import React, {PropTypes} from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import LeftPanelHeader from '../components/LeftPanelHeader';
import {confirmDanger} from '../../../../components/popups/confirm';
import LeftPanelManager from '../LeftPanelManager';
import LoginStore, {LOGIN_EVENTS} from '../../../../core/stores/LoginStore';
import {logoutCmd} from '../../../../core/commands/LoginCommands';
import UserSettingsStore, {USER_SETTINGS_EVENTS} from '../../../../core/stores/UserSettingsStore';
import exposeStoreData from '../../../view-components/exposeStoreData';
import {updateNameCmd, updateStatusCmd, updateNotificationCmd, updateSoundCmd,updateAvatarCmd} from '../../../../core/commands/UserSettingsCommands';
import SwitchBtn from '../../../../components/buttons/SwitchBtn';
import './settings.less';
import exposeLocale from '../../../../components/exposeLocale';
import ViewInput from '../../../../components/ViewInput/ViewInput';
import EnumStatusType from '../../../../core/enums/EnumStatusType';
import AvatarEditor from '../../../view-components/AvatarEditor/AvatarEditor';


@exposeLocale()
@exposeStoreData([
    [UserSettingsStore, USER_SETTINGS_EVENTS.USER_SETTINGS_STORE_CHANGE, () => ({
        userSettings: UserSettingsStore.getUserSettings()
    })],
    [LoginStore, LOGIN_EVENTS.CHANGE, () => ({
        userInfo: LoginStore.getUserInfo()
    })]
])
export default class SettingComposer extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {

        };
    }

    componentWillMount() {

    }


    getPhotoPickerMenuItems=()=>{
        var locale = this.state.locale || {};
        return [
            {key: '1', content: locale['baba_web_profile_view'], action: 'viewPhoto'},
            {key: '2', content: locale['baba_web_profile_change'], action: 'changePhoto'}
        ];
    };

    handleAvatarUploaded=(result,onFinished)=>{
        var newAvatar = result.imgUrl;
        updateAvatarCmd(newAvatar).then(function(){
            onFinished();
        });
    };

    onClickSwitchBtn(stateKey) {
        let userSettings = this.state.userSettings;
        let {web_notification, web_sound} = userSettings;
        if(stateKey === 'notification') {
            updateNotificationCmd(web_notification === null? false: !web_notification);
        } else if(stateKey === 'sound') {
            updateSoundCmd(web_sound === null? false: !web_sound);
        }
    }

    onModifyUserName =(newName,onFinished)=>{
        updateNameCmd(newName).then(function(){
            onFinished();
        });
    };

    onModifyStatus =(newStatus,onFinished)=>{
        updateStatusCmd(newStatus).then(function(){
            onFinished();
        });
    };


    handleLogOut=()=>{
        logoutCmd();
    };

    render() {
        var that = this;
        var locale = that.state.locale || {};
        var state = this.state;
        var {userSettings, userInfo} = state;
        if(userSettings) {
            var statusText = userSettings.whatsUpType === 0? locale[EnumStatusType[userSettings.sysWhatsUpNum]]: userSettings.customWhatsUpContent;
            var web_notification = userSettings.web_notification === null? true: userSettings.web_notification;
            var web_sound = userSettings.web_sound === null? true:userSettings.web_sound;
        }

        return (
            <div className="leftPanel Settings" >
                <LeftPanelHeader title={locale['mainview.settings']}></LeftPanelHeader>
                {
                    !userSettings? (<div className="loading-content"><div className="ic-loading"></div></div>) :
                        (
                            <div className="content">
                                <div className="edit-avatar-wrap">
                                    <AvatarEditor className="User-Setting-Avatar"
                                                  imgSrc={userSettings.avatar}
                                                  name={userSettings.user_name}
                                                  isVip={userInfo.isVip}
                                                  menuItems={that.getPhotoPickerMenuItems()}
                                                  onAvatarUploaded={that.handleAvatarUploaded} />
                                </div>
                                <div className="profile">
                                    <span className="edit-title">{locale['chatroom.user.profile']}</span>
                                    <div className="content-wrap">
                                        <div className="edit-list border-line">
                                            <span className="list-title">{locale['settingview.editnametitle']}</span>
                                            <ViewInput value={userSettings.user_name} onConfirm={this.onModifyUserName} />
                                        </div>
                                        <div className="edit-list">
                                            <span className="list-title">{locale['baba_contactinfo_status']}</span>
                                            <ViewInput value={statusText} onConfirm={this.onModifyStatus} />
                                        </div>
                                    </div>
                                </div>

                                <div className="notifacations">
                                    <span className="edit-title">{locale['contactmain.notifications']}</span>
                                    <div className="content-wrap">
                                        <div className="notifacations-list border-line">
                                            <div className="notifacations_text">
                                                <div className="switch_name">{locale['baba_web_notifi_switch']}</div>
                                                <div className="switch_btn">
                                                    <SwitchBtn isOpen={web_notification} onClick={that.onClickSwitchBtn.bind(that,'notification')} />
                                                </div>
                                            </div>
                                        </div>
                                        {/*<div className="notifacations-list border-line">*/}
                                        {/*<div className="notifacations_text">*/}
                                        {/*<div className="switch_name">Message Preview</div>*/}
                                        {/*<div className="switch_btn">*/}
                                        {/*<SwitchBtn isOpen={userSettings.web_preview} onClick={that.onClickSwitchBtn.bind(that,'preview')} />*/}
                                        {/*</div>*/}
                                        {/*</div>*/}
                                        {/*</div>*/}
                                        <div className="notifacations-list">
                                            <div className="notifacations_text">
                                                <div className="switch_name">{locale['settingview.sound']}</div>
                                                <div className="switch_btn">
                                                    <SwitchBtn isOpen={web_sound} onClick={that.onClickSwitchBtn.bind(that,'sound')} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <a className="about" target="_blank" href="https://soma.im">{locale['settingview.about']}</a>
                                <div className="log-out" onClick={this.handleLogOut}>{locale['more_log_out']}</div>
                            </div>
                        )
                }


            </div>
        );
    }

}