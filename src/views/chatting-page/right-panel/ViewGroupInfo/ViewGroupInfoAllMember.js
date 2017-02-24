import React,{PropTypes} from 'react'
import RightPanelHeader from '../components/RightPanelHeader';
import ContactList from '../../../view-components/ContactList/ContactList';
import ViewGroupInfo from './ViewGroupInfo';
import './ViewGroupInfoAllMember.less';

export default class ViewGroupInfoAllMember extends ViewGroupInfo {

    static propTypes = {
        sessionId: PropTypes.string.isRequired
    };


    render() {
        var that = this;
        var {allGroupMembers,sessionInfo,locale} = that.state;

        if (!sessionInfo) {
            return <div></div>
        }

        var memberCount = sessionInfo.memberCount;
        return (
            <div className="rightPanel ViewGroupInfoAllMember">
                <RightPanelHeader icon="back" title={locale.baba_group_groupmem+`(${memberCount})`}>
                    <div className="ic_group_add" onClick={that.onClickAddMember}></div>
                </RightPanelHeader>
                <ContactList userAccountList={allGroupMembers}
                             onClickContactItem={that.handleCreateSingleChat}
                             renderItemExtend={that.renderContactItemExtend}
                             selectType={1} />
            </div>
        );
    }

}