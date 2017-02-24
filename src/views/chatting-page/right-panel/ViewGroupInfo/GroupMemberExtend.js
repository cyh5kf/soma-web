import React,{PropTypes} from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import exposeLocale from '../../../../components/exposeLocale';
import LoginStore from '../../../../core/stores/LoginStore';
import Dropdown from '../../../../components/dropdown/Dropdown';
import Menu, {MenuItem} from '../../../../components/menu/Menu';
import {confirmDanger} from '../../../../components/popups/confirm';
import BlueLoading from '../../../../components/loading/BlueLoading';
import {removeGroupMembersCmd,setGroupManagerCmd} from '../../../../core/commands/SessionsCommands';

import './GroupMemberExtend.less';

const KEY_MAKE_GROUP_ADMIN = '1'; //下拉菜单项
const KEY_REMOVE_FROM_GROUP = '2';//下拉菜单项

@exposeLocale()
export default class GroupMemberExtend extends PureRenderComponent {

    static propTypes = {
        memberInfo: PropTypes.any.isRequired,
        sessionInfo: PropTypes.any.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            isLoading:false
        };
    }

    handleMenuSelect = (userAccount, {key})=> {
        var that = this;
        var {locale} = that.state;
        var {sessionInfo} = that.props;
        var sessionId = sessionInfo.sessionId;

        const gid = sessionId;
        const targetMemberUid = userAccount.uid;

        switch (key) {
            case KEY_REMOVE_FROM_GROUP:
                confirmDanger(
                    locale['baba_group_removefromgroup'],
                    locale['baba_group_remove_notify'],
                    function () {

                        that.showLoading();
                        removeGroupMembersCmd({gid, delMemberUid: targetMemberUid}).then(function () {
                            //that.hideLoading();
                        });
                    }
                );
                break;
            case KEY_MAKE_GROUP_ADMIN:

                that.showLoading();
                setGroupManagerCmd({gid, managerUid: targetMemberUid}).then(function () {
                    that.hideLoading();
                });

                break;
            default:

        }
    };


    showLoading = ()=> {
        this.setState({isLoading: true});
    };

    hideLoading = ()=> {
        this.setState({isLoading: false});
    };


    render() {
        var that = this;
        var {locale,isLoading} = that.state;

        if(isLoading){
            return <BlueLoading className="group-member-loading" size={40} />
        }


        var {sessionInfo,memberInfo} = that.props;
        var managerUids = sessionInfo.managerUids || [];//这是一个immutable List
        var uid = memberInfo.uid;
        var isGroupManager = managerUids.indexOf(uid) >= 0;
        var myUid = LoginStore.getUserInfo().uid;

        //当前登录用户是Group Admin
        var isLoginUserGroupManager = managerUids.indexOf(myUid) >= 0;

        const GroupAdminLabel =  <div className="group-admin">{locale['baba_group_groupadmin']}</div>;

        //这个人是Group Admin
        if (isGroupManager) {

            if (uid === myUid) {
                return GroupAdminLabel;
            }

            if(!isLoginUserGroupManager){
                return GroupAdminLabel;
            }

            return (
                <Dropdown onSelect={this.handleMenuSelect.bind(this,memberInfo)} popoverPlacement="bottom-end"
                          anchorElement={GroupAdminLabel}>
                    <Menu>
                        <MenuItem key={KEY_REMOVE_FROM_GROUP}>{locale['baba_group_removefromgroup']}</MenuItem>
                    </Menu>
                </Dropdown>
            );
        }


        if (isLoginUserGroupManager) {
            return (
                <Dropdown className="tb-more-session-actions" onSelect={this.handleMenuSelect.bind(this,memberInfo)}
                          popoverPlacement="bottom-end">
                    <Menu>
                        <MenuItem key={KEY_MAKE_GROUP_ADMIN}>{locale['baba_group_makeadmin']}</MenuItem>
                        <MenuItem key={KEY_REMOVE_FROM_GROUP}>{locale['baba_group_removefromgroup']}</MenuItem>
                    </Menu>
                </Dropdown>
            );
        }

        return null;
    }

}