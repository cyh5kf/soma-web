import React, {PropTypes} from 'react'
import PureRenderComponent from '../../../components/PureRenderComponent';
import  ViewForwardListItem from './ViewForwardListItem';
import '../../chatting-page/left-panel/GlobalSearch/GlobalSearch.less';


export default class SearchForwardContactsList extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            renderedGroupLists: [],
            renderedAccountLists: [],
            searchText: ''
        };
    }

    componentWillReceiveProps(nextProps) {
        const {searchText, userAccountList, groupFavoriteList} = nextProps;
        this.filterGroupList(searchText, groupFavoriteList);
        this.filterAccountList(searchText, userAccountList);
        this.setState({searchText: searchText});
    }

    componentWillMount() {
        const {searchText, userAccountList, groupFavoriteList} = this.props;
        this.filterGroupList(searchText, groupFavoriteList);
        this.filterAccountList(searchText, userAccountList);
        this.setState({searchText: searchText});
    }

    /**
     * 判断账号是否被匹配
     * @param account
     */
    isMatchSearchText=(account, searchText)=> {
        if (!searchText) {
            //没有输入搜索条件,不需要搜索.
            return true;
        }

        var sessionName = account.sessionName;
        sessionName = sessionName.toLocaleLowerCase();
        searchText = searchText.toLocaleLowerCase();
        return sessionName.indexOf(searchText) !== -1;
    }

    isMatchAccountSearchText=(account, searchText)=> {
        if (!searchText) {
            //没有输入搜索条件,不需要搜索.
            return true;
        }

        var accountName = account.name;
        accountName = accountName.toLocaleLowerCase();
        searchText = searchText.toLocaleLowerCase();
        var isNameOk = accountName.indexOf(searchText) !== -1;
        if(isNameOk) {
            return "matchName";
        } else {
            var mobile = account.uid || "";
            mobile = mobile.toLocaleLowerCase();
            if(mobile.indexOf(searchText) !== -1) {
                return "matchPhone";
            }
        }
    }



    filterGroupList=(searchText, groupFavoriteList)=> {
        var renderedGroupLists = [];
        var that = this;
        groupFavoriteList.forEach(function (u, i) {
            if (!that.isMatchSearchText(u, searchText)) {
                return;
            }
            u.matchObject = "matchName";
            renderedGroupLists.push(u);
        });

        if(renderedGroupLists.length === 0) {
            that.props.action.setSearchResult("groupList");
            that.setState({renderedGroupLists: []});
        } else {
            this.setState({renderedGroupLists: renderedGroupLists});
        }
    }

    filterAccountList=(searchText, userAccountList)=> {
        var renderedAccountLists = [];
        var that = this;
        userAccountList.forEach(function (u, i) {
            var matchObject = that.isMatchAccountSearchText(u, searchText);
            if (!matchObject) {
                return;
            }
            u.matchObject = matchObject;
            renderedAccountLists.push(u);
        });

        if(renderedAccountLists.length === 0) {
            that.props.action.setSearchResult("AccountList");
            that.setState({renderedAccountLists: []});
        } else {
            this.setState({renderedAccountLists: renderedAccountLists});
        }
    }

    render() {
        var that = this;
        const {renderedGroupLists, renderedAccountLists, searchText} = that.state;
        const {parent, locale, message, userInfo} = this.props;

        return (
            <div className="SearchList" >
                <div className="SearchGroupContent">
                {renderedGroupLists.map((renderedRecentList, index) => {
                    return <ViewForwardListItem key={index} message={message} data={renderedRecentList} searchText={searchText} locale={locale} userInfo={userInfo} searchType="chatsList" parent={parent}/>
                })}
                </div>
                <div className="SearchContactContent">
                {renderedAccountLists.map((renderedAccountList, index) => {
                    return <ViewForwardListItem key={index} message={message} data={renderedAccountList} searchText={searchText} locale={locale} searchType="contactsList" parent={parent}/>
                })}
                </div>
            </div>
        );
    }

}