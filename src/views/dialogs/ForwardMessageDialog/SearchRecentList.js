import React, {PropTypes} from 'react'
import PureRenderComponent from '../../../components/PureRenderComponent';
import  ViewForwardListItem from './ViewForwardListItem';
import '../../chatting-page/left-panel/GlobalSearch/GlobalSearch.less';


export default class SearchRecentList extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            renderedRecentLists: [],
            searchText: ''
        };
    }

    componentWillReceiveProps(nextProps) {
        const {sessions, searchText} = nextProps;
        this.filterSearchList(sessions, searchText);
        this.setState({searchText: searchText});
    }

    componentWillMount() {
        const {sessions, searchText} = this.props;
        this.filterSearchList(sessions, searchText);
        this.setState({searchText: searchText});
    }

    /**
     * 判断账号是否被匹配
     * @param account
     */
    isMatchSearchText=(account, searchText, p2pUserAccount)=> {
        if (!searchText) {
            //没有输入搜索条件,不需要搜索.
            return true;
        }

        var sessionName = account.sessionName;
        sessionName = sessionName.toLocaleLowerCase();
        searchText = searchText.toLocaleLowerCase();
        var isSessionNameOk = sessionName.indexOf(searchText) !== -1;
        if(isSessionNameOk) {
            return "matchName";
        } else {
            if(p2pUserAccount) {
                var mobile = p2pUserAccount.uid || "";
                mobile = mobile.toLocaleLowerCase();
                if(mobile.indexOf(searchText) !== -1) {
                    return "matchPhone";
                }
            }
        }
    }

    filterSearchList=(sessions, searchText)=> {
        var renderedRecentLists = [];
        var that = this;
        var userAccountMap = that.props.userAccountMap;
        sessions.forEach(function (u, i) {
            var p2pUserAccount = (userAccountMap && userAccountMap[u.sessionId]);
            var matchObject = that.isMatchSearchText(u, searchText, p2pUserAccount);
            if (!matchObject) {
                return;
            }
            u.matchObject = matchObject;
            if(p2pUserAccount) {  //添加isVip属性
                u.isVip = p2pUserAccount.isVip;
            } else {
                u.isVip = false;
            }
            renderedRecentLists.push(u);
        });

        if(renderedRecentLists.length === 0) {
            that.props.action.setSearchResult("recentList");
        } else {
            this.setState({renderedRecentLists: renderedRecentLists});
        }
    }

    render() {
        var that = this;
        const {renderedRecentLists, searchText} = that.state;
        const {parent, locale, message, userInfo} = this.props;

        return (
            <div className="SearchList" >
                {renderedRecentLists.map((renderedRecentList, index) => {
                    return <ViewForwardListItem key={index} searchText={searchText} message={message} data={renderedRecentList} locale={locale} userInfo={userInfo} searchType="chatsList" parent={parent}/>
                })}
            </div>
        );
    }

}