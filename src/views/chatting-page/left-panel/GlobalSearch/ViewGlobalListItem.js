import React,{PropTypes} from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import ViewListItem from '../../../view-components/ViewListItem/ViewListItem'
import {selectSessionCmd} from '../../../../core/commands/SessionsCommands';
import {WebSessionType} from '../../../../core/protos/protos';

/**
 * 联系人列表
 */
export default class ViewGlobalListItem extends PureRenderComponent {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    handleSessionClick = (e) => {
        const sessionId = e.currentTarget.dataset.sessionId;
        const sessionType = parseInt(e.currentTarget.dataset.sessionType, 10);
        this.props.parent.quitGlobalSearch();
        selectSessionCmd(sessionId, {createIfNotExist:true, sessionType:sessionType});
    };

    onClickContactItem = (e) => {
        const uid = e.currentTarget.dataset.uid;
        this.props.parent.quitGlobalSearch();
        selectSessionCmd(uid, {createIfNotExist:true, sessionType: WebSessionType.WEB_SESSION_TYPE_P2P});

    };


    render() {
        var that = this;
        var {data, userInfo,locale, searchType, searchText,userAccountMap} = that.props;

        return (
            <ViewListItem data={data} locale={locale} userInfo={userInfo} searchText={searchText} searchType={searchType} action={this} userAccountMap={userAccountMap}/>
        );
    }

}
