import React, {PropTypes} from 'react'
import PureRenderComponent from '../../../components/PureRenderComponent';
import  ViewForwardListItem from './ViewForwardListItem';
import {WebSessionType} from '../../../core/protos/protos';

export default class RecentMessageList extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {

        };
    }


    render() {
        const {sessions, locale, parent, message, userInfo, searchText, userAccountMap} = this.props;

        return (
            <div className="recent-sessions" >
                <div className="session-list">
                    {sessions.map((session, index) => {
                        var p2pUserAccount = (userAccountMap && userAccountMap[session.sessionId]);
                        var isP2P = session.sessionType === WebSessionType.WEB_SESSION_TYPE_P2P;
                        session.isVip = isP2P? p2pUserAccount.isVip: false;  //添加是否VIP会员属性
                        return <ViewForwardListItem key={index} searchText={searchText} message={message} data={session} locale={locale} userInfo={userInfo} searchType="chatsList" parent={parent}/>
                    })}
                </div>
            </div>
        );
    }

}