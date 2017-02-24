import React,{PropTypes} from 'react'
import PureRenderComponent from '../../../components/PureRenderComponent';
import  ViewListItem from '../../view-components/ViewListItem/ViewListItem'
import {forwardMsgCmd} from '../../../core/commands/MessagesCommands';
import {WebSessionType} from '../../../core/protos/protos';


/**
 * 联系人列表
 */
export default class ViewForwardListItem extends PureRenderComponent {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    handleSessionClick = (e) => {
        const message = this.props.message;
        const sessionId = e.currentTarget.dataset.sessionId;
        const sessionType = parseInt(e.currentTarget.dataset.sessionType, 10);
        this.props.parent.quitGlobalSearch();
        forwardMsgCmd({
            message: message,
            sessionId: sessionId,
            sessionType: sessionType
        });
    };

    onClickContactItem = (e) => {
        const message = this.props.message;
        const uid = e.currentTarget.dataset.uid;
        this.props.parent.quitGlobalSearch();
        forwardMsgCmd({
            message: message,
            sessionId: uid,
            sessionType: WebSessionType.WEB_SESSION_TYPE_P2P
        });
    };


    render() {
        var that = this;
        var {data,locale, searchType, userInfo, searchText} = that.props;

        return (
            <ViewListItem data={data} searchText={searchText} locale={locale} searchType={searchType} userInfo={userInfo} action={this} parent={parent}/>
        );
    }

}
