import React, {PropTypes} from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import  ViewGlobalListItem from './ViewGlobalListItem';
import {formatSessionName} from '../../../../core/core-utils/SessionUtils';
import './GlobalSearch.less';
import exposeLocale from '../../../../components/exposeLocale';

@exposeLocale()
export default class SearchChatsList extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            isShowMoreBtn: false,
            renderedChatsLists: [],
            searchText: ''
        };
    }

    /**
     * 判断账号是否被匹配
     * @param session
     */
    isMatchSearchText=(session, searchText, p2pUserAccount)=> {
        if (!searchText) {
            //没有输入搜索条件,不需要搜索.
            return true;
        }

        //手机号或姓名 匹配都可以
        //var sessionName = session.sessionName;
        //sessionName = sessionName.toLowerCase();
        searchText = searchText.toLowerCase();
        var displaySessionName = formatSessionName(session,p2pUserAccount);
        displaySessionName = displaySessionName.toLowerCase();
        var isSessionNameOk = displaySessionName.indexOf(searchText) !== -1;
        if(isSessionNameOk) {
            return "matchName";
        } else {
            if(p2pUserAccount) {
                var mobile = p2pUserAccount.uid || "";
                mobile = mobile.toLowerCase();
                if(mobile.indexOf(searchText) !== -1) {
                    return "matchPhone";
                }
            }
        }



    }

    filterSearchList=(sessions, searchText, isChatsMoreClick)=> {
        var renderedChatsLists = [];
        var that = this;
        var userAccountMap = that.props.userAccountMap;
        sessions.forEach(function (u, i) {
            var p2pUserAccount = (userAccountMap && userAccountMap[u.sessionId]);
            var matchObject = that.isMatchSearchText(u, searchText, p2pUserAccount);
            if (!matchObject) {
                return;
            }
            u.matchObject = matchObject;  //添加匹配对象是手机号还是姓名的属性
            if(p2pUserAccount) {  //添加isVip属性
                u.isVip = p2pUserAccount.isVip;
            } else {
                u.isVip = false;
            }


            renderedChatsLists.push(u);
        });

        if(renderedChatsLists.length === 0) {
            that.props.action.setSearchResult("chatsList");
            this.setState({isShowMoreBtn: false});
        } else if(renderedChatsLists.length > 3) {
            if(isChatsMoreClick) {
                this.setState({isShowMoreBtn: false});
                this.setState({renderedChatsLists: renderedChatsLists});
            } else {
                renderedChatsLists = renderedChatsLists.slice(0, 3);
                this.setState({renderedChatsLists: renderedChatsLists});
                this.setState({isShowMoreBtn: true});
            }
        } else {
            this.setState({renderedChatsLists: renderedChatsLists});
            this.setState({isShowMoreBtn: false});
        }

    }

    componentWillReceiveProps(nextProps) {
        const {sessions, searchText, isChatsMoreClick} = nextProps;
        this.filterSearchList(sessions, searchText, isChatsMoreClick);
        this.setState({searchText: searchText});
    }

    componentWillMount() {
        const {sessions, searchText, isChatsMoreClick} = this.props;
        this.filterSearchList(sessions, searchText, isChatsMoreClick);
        this.setState({searchText: searchText});
    }

    onClickMore() {
        this.props.action.setMoreClick("chatsList");
        this.setState({isShowMoreBtn: false});
    }

    render() {
        var that = this;
        var locale = that.state.locale || {};
        const {isShowMoreBtn, renderedChatsLists, searchText} = that.state;
        const {parent, userInfo,userAccountMap} = this.props;

        return (
            <div className="SearchList" >
                <div className="searchType">
                    <span>{locale["tab_chats"].toUpperCase()}</span>
                </div>
                {renderedChatsLists.map((renderedChatsList, index) => {
                    return <ViewGlobalListItem key={index} data={renderedChatsList} userInfo={userInfo} locale={locale} searchText={searchText} searchType="chatsList" parent={parent} userAccountMap={userAccountMap}/>
                })}
                {isShowMoreBtn &&
                    <div className="clickMore" onClick={that.onClickMore.bind(that)}>
                        <i></i>
                        <span>{locale["baba_search_morechathistory"]}</span>
                    </div>
                }
            </div>
        );
    }

}