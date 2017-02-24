import React from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import Dropdown from '../../../components/dropdown/Dropdown';
import Menu, {MenuItem} from '../../../components/menu/Menu';
import LeftPanelManager,{PANEL_KEY} from '../left-panel/LeftPanelManager';
import AccountAvatar from '../../view-components/AccountAvatar/AccountAvatar';
import {UserProfileSchema} from '../../../core/schemas/LoginSchemas';
import ReactPropTypes from '../../../core/ReactPropTypes';
import focusMsgInput from '../../../core/core-utils/focusMsgInput'

import './UserHeaderBar.less';

const KEY_NEW_GROUPS = 'new-groups',
    KEY_NEW_P2P_CHAT = 'new-p2p';

export default class UserHeaderBar extends PureRenderComponent {
    static propTypes = {
        userInfo: ReactPropTypes.ofSchema(UserProfileSchema).isRequired,
        locale: ReactPropTypes.ofLocale().isRequired
    };
    handleMenuSelect = ({key}) => {
        switch (key) {
            case KEY_NEW_P2P_CHAT:
                LeftPanelManager.pushPanel(PANEL_KEY.CREATE_SINGLE_SESSION);
                break;
            case KEY_NEW_GROUPS:
                LeftPanelManager.pushPanel(PANEL_KEY.CREATE_GROUP_SESSION);
                break;
            default:
                window.alert('TODO...');
        }

        //防止输入框失去焦点
        focusMsgInput();
    };

    handleUserLogoClick = () => {
        LeftPanelManager.pushPanel(PANEL_KEY.SETTINGS);
    };

    render() {
        const {locale, userInfo} = this.props;
        return (
            <div className="user-header-bar">
                <AccountAvatar className="user-logo" onClick={this.handleUserLogoClick} isVip={userInfo.isVip} name={userInfo.name || ''} avatar={userInfo.avatar}/>

                <Dropdown className="tb-more-actions" onSelect={this.handleMenuSelect}>
                    <Menu>
                        <MenuItem key={KEY_NEW_P2P_CHAT}>{locale['compose_new_message']}</MenuItem>
                        <MenuItem key={KEY_NEW_GROUPS}>{locale['baba_chats_newgrpchat']}</MenuItem>
                    </Menu>
                </Dropdown>
            </div>
        );
    }

}
