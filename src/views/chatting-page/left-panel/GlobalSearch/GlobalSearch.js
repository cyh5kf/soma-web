import React, {PropTypes} from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import  SearchChatsList from './SearchChatsList';
import  SearchContactsList from './SearchContactsList';
import  SearchGroupList from './SearchGroupList';
import './GlobalSearch.less';
import exposeLocale from '../../../../components/exposeLocale';
import NoSearchResults from '../../../view-components/NoSearchResults/NoSearchResults';

@exposeLocale()
export default class GlobalSearch extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            isHaveChatsList: true,
            isHaveContactsList: true,
            isHaveGroupList: true,
            isChatsMoreClick: false,
            isContactsMoreClick: false,
            isGroupMoreClick: false
        };
    }

    componentWillMount() {

    }

    componentWillReceiveProps(nextProps) {
        var searchText = nextProps.searchText;
        if(searchText) {
            this.setState({
                isHaveChatsList: true,
                isHaveContactsList: true,
                isHaveGroupList: true,
                isChatsMoreClick: false,
                isContactsMoreClick: false,
                isGroupMoreClick: false
            })
        } else {
            this.setState({
                isHaveChatsList: false,
                isHaveContactsList: false,
                isHaveGroupList: false
            })
        }

    }

    setSearchResult(searchType) {
        if(searchType === 'chatsList') {
            this.setState({isHaveChatsList: false});
        } else if(searchType === 'contactsList') {
            this.setState({isHaveContactsList: false});
        } else if(searchType === 'groupList') {
            this.setState({isHaveGroupList: false});
        }
    }

    getSearchResult=()=> {
        const {isHaveChatsList, isHaveContactsList, isHaveGroupList} = this.state;
        if(!isHaveChatsList && !isHaveContactsList && !isHaveGroupList) {
            return false;
        } else {
            return true;
        }
    }

    setMoreClick(searchType) {
        switch (searchType) {
            case "chatsList":
                this.setState({isChatsMoreClick: true});
                break;
            case "contactsList":
                this.setState({isContactsMoreClick: true});
                break;
            case "groupList":
                this.setState({isGroupMoreClick: true});
                break;
        }
    }

    render() {
        var that = this;
        var locale = that.state.locale || {};
        const {sessions, searchText, userAccountList, groupFavoriteList, parent, userInfo, userAccountMap} = this.props;
        const { isHaveChatsList, isHaveContactsList, isHaveGroupList, isChatsMoreClick, isContactsMoreClick, isGroupMoreClick} = this.state;
        var isHaveSearchResult = that.getSearchResult();

        return (
            <div className="GlobalSearch">
                {
                    isHaveSearchResult?
                        <div>
                            {isHaveChatsList && <SearchChatsList searchText={searchText} sessions={sessions} userAccountMap={userAccountMap} isChatsMoreClick={isChatsMoreClick} userInfo={userInfo} action={this} parent={parent}></SearchChatsList>}
                            {isHaveContactsList && <SearchContactsList searchText={searchText} userAccountList={userAccountList} isContactsMoreClick={isContactsMoreClick} action={this} parent={parent}></SearchContactsList>}
                            {isHaveGroupList && <SearchGroupList searchText={searchText} sessions={sessions} groupFavoriteList={groupFavoriteList} isGroupMoreClick={isGroupMoreClick} userInfo={userInfo} action={this} parent={parent}></SearchGroupList>}
                        </div>:
                        <NoSearchResults locale={locale} />
                }

            </div>
        );
    }

}