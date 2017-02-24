import React from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import ContactList from '../../../view-components/ContactList/ContactList';
import focusMsgInput from '../../../../core/core-utils/focusMsgInput';
import LeftPanelHeader from '../components/LeftPanelHeader';
import LeftPanelManager from '../LeftPanelManager';
import exposeLocale from '../../../../components/exposeLocale';
import exposeStoreData from '../../../view-components/exposeStoreData';
import FriendAccountStore,{FRIEND_ACCOUNT_EVENTS} from '../../../../core/stores/FriendAccountStore';
import {addP2PSessionCmd,selectSessionCmd} from '../../../../core/commands/SessionsCommands';
import './CreateSingleSession.less';


@exposeLocale()
@exposeStoreData([
    [FriendAccountStore, FRIEND_ACCOUNT_EVENTS.ACCOUNT_LIST_CHANGE, () => ({
        friendAccountList: FriendAccountStore.getFriendAccountList()
    })]
])
export default class CreateSingleSession extends PureRenderComponent {

    componentDidMount() {

    }

    componentWillUnmount(){

    }

    onClickContactItem = (u) => {

        addP2PSessionCmd(u.uid).then(({sessionId})=>{
            selectSessionCmd(sessionId);
            focusMsgInput();
        });
        LeftPanelManager.popPanel();
    };

    render() {
        const state = this.state;
        const {locale} = state;
        return (
            <div className="leftPanel CreateSingleSession" >
                <LeftPanelHeader title={locale['baba_chat_startnew']}></LeftPanelHeader>
                <ContactList userAccountList={state.friendAccountList} selectType={1} onClickContactItem={this.onClickContactItem}></ContactList>
            </div>
        );
    }

}
