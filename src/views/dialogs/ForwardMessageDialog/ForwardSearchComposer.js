import React, {PropTypes} from 'react'
import PureRenderComponent from '../../../components/PureRenderComponent';
import exposeLocale from '../../../components/exposeLocale';
import '../../chatting-page/left-panel/GlobalSearch/GlobalSearch.less';
import SearchRecentList from'./SearchRecentList';
import  SearchForwardContactsList from './SearchForwardContactsList';
import NoSearchResults from '../../view-components/NoSearchResults/NoSearchResults';

@exposeLocale()
export default class ForwardSearchComposer extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            isHaveRecentList: false,
            isHaveGroupList: false,
            isHaveAccountList: false
        };
    }

    componentWillMount() {
        var {searchText, searchType} = this.props;
        if(searchType === "recent") {
            if(searchText) {
                this.setState({
                    isHaveRecentList: true,
                })
            } else {
                this.setState({
                    isHaveRecentList: false
                })
            }
        } else {
            if(searchText) {
                this.setState({
                    isHaveGroupList: true,
                    isHaveAccountList: true
                })
            } else {
                this.setState({
                    isHaveGroupList: false,
                    isHaveAccountList: false
                })
            }
        }

    }

    componentWillReceiveProps(nextProps) {
        var {searchText, searchType} = nextProps;
        if(searchType === "recent") {
            if(searchText) {
                this.setState({
                    isHaveRecentList: true
                })
            } else {
                this.setState({
                    isHaveRecentList: false
                })
            }
        } else {
            if(searchText) {
                this.setState({
                    isHaveGroupList: true,
                    isHaveAccountList: true
                })
            } else {
                this.setState({
                    isHaveGroupList: false,
                    isHaveAccountList: false
                })
            }
        }

    }

    getSearchResult=()=> {
        const {isHaveRecentList, isHaveGroupList, isHaveAccountList} = this.state;
        if(!isHaveRecentList && !isHaveGroupList && !isHaveAccountList) {
            return false;
        } else {
            return true;
        }
    }

    getContactsSearchResult=()=> {
        const {isHaveGroupList, isHaveAccountList} = this.state;
        if(!isHaveGroupList && !isHaveAccountList) {
            return false;
        } else {
            return true;
        }
    }

    setSearchResult(searchType) {
        if(searchType === 'recentList') {
            this.setState({isHaveRecentList: false});
        } else if(searchType === 'AccountList') {
            this.setState({isHaveAccountList: false});
        } else if(searchType === 'groupList') {
            this.setState({isHaveGroupList: false});
        }
    }


    render() {
        var that = this;
        const {sessions, searchText, userAccountList, groupFavoriteList, locale, parent, message, userInfo, userAccountMap} = this.props;

        const {isHaveRecentList} = this.state;
        var isHaveSearchResult = that.getSearchResult();
        var isHaveContactsList = that.getContactsSearchResult();

        return (
            <div className="GlobalSearch">
                {
                    isHaveSearchResult?
                        <div>
                            {isHaveRecentList && <SearchRecentList message={message} searchText={searchText} sessions={sessions} userAccountMap={userAccountMap} locale={locale} userInfo={userInfo} action={this} parent={parent}></SearchRecentList>}
                            {isHaveContactsList && <SearchForwardContactsList message={message} searchText={searchText}  userAccountList={userAccountList} groupFavoriteList={groupFavoriteList} locale={locale} userInfo={userInfo}  action={this} parent={parent}></SearchForwardContactsList>}
                        </div>:
                        <NoSearchResults locale={locale} />
                }
            </div>
        );
    }

}