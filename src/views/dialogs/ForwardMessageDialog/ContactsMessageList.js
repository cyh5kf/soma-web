import React, {PropTypes} from 'react'
import PureRenderComponent from '../../../components/PureRenderComponent';
import  ViewForwardListItem from './ViewForwardListItem';

export default class ContactsMessageList extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {

        };
    }


    render() {
        const {userAccountList, groupFavoriteList, locale, parent, message, userInfo, searchText} = this.props;

        return (
            <div className="recent-sessions" >
                <div className="session-list">
                    <div className="groupContent">
                    {groupFavoriteList.map((value, index) => {
                        return <ViewForwardListItem key={index} searchText={searchText} message={message} data={value} locale={locale} userInfo={userInfo} searchType="chatsList" parent={parent}/>
                    })}
                    </div>
                    <div className="contactContent">
                        {userAccountList.map((value, index) => {
                            return <ViewForwardListItem key={index} message={message} data={value} locale={locale} searchType="contactsList" parent={parent}/>
                        })}
                    </div>
                </div>
            </div>
        );
    }

}