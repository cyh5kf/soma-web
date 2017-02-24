import React from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import focusMsgInput from '../../../../core/core-utils/focusMsgInput';
import LeftPanelManager from '../LeftPanelManager';
import ContactList from '../../../view-components/ContactList/ContactList';
import LeftPanelHeader from '../components/LeftPanelHeader';
import exposeLocale from '../../../../components/exposeLocale';
import exposeStoreData from '../../../view-components/exposeStoreData';
import UserAccountStore from '../../../../core/stores/UserAccountStore';
import {createGroupSessionCmd,selectSessionCmd} from '../../../../core/commands/SessionsCommands';
import CreateGroupButton from '../../../view-components/CreateGroupButton/CreateGroupButton';
import FriendAccountStore,{FRIEND_ACCOUNT_EVENTS} from '../../../../core/stores/FriendAccountStore';
import './CreateGroupSession.less';


@exposeLocale()
@exposeStoreData([
    [FriendAccountStore, FRIEND_ACCOUNT_EVENTS.ACCOUNT_LIST_CHANGE, () => ({
        userAccountList: FriendAccountStore.getFriendAccountList()
    })]
])
export default class CreateGroupSession extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            isShowCreateButton:false,
            isShowCreateButtonLoading:false
        };
    }



    /**
     * 点击创建群会话按钮
     */
    onCreateGroupSession=()=>{

        this.setState({isShowCreateButtonLoading:true});

        var contactList = this.refs['contactList'];
        var selectedUids = contactList.getSelectedAccountsUid();

        createGroupSessionCmd({
            memberUids: selectedUids
        }).then(({sessionId})=>{
            selectSessionCmd(sessionId);
            focusMsgInput();
            this.setState({isShowCreateButtonLoading:false});
            LeftPanelManager.popPanel();
        },()=>{
            this.setState({isShowCreateButtonLoading:false});
            LeftPanelManager.popPanel();
        });

    };



    /**
     * 选中或取消一个联系人
     */
    onToggleAccountSelected=(data)=>{
        var {selectedAccountsSize} = data;
        var isShowCreateButton = selectedAccountsSize > 0 ;
        this.setState({isShowCreateButton:isShowCreateButton});
    };



    render() {
        var that = this;
        var {userAccountList,isShowCreateButton,isShowCreateButtonLoading,locale} = that.state;
        return (
            <div className="leftPanel CreateGroupSession" >
                <LeftPanelHeader title={locale['baba_chats_newgrpchat']}></LeftPanelHeader>
                <ContactList ref="contactList" userAccountList={userAccountList} selectType={2} onToggleAccountSelected={that.onToggleAccountSelected}></ContactList>
                <CreateGroupButton onClick={that.onCreateGroupSession} isShow={isShowCreateButton} isLoading={isShowCreateButtonLoading} />
            </div>
        );
    }

}
