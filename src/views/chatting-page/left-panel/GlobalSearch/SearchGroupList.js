import React, {PropTypes} from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import ViewGlobalListItem from './ViewGlobalListItem';
import EnumSessionType from '../../../../core/enums/EnumSessionType';
import './GlobalSearch.less';
import exposeLocale from '../../../../components/exposeLocale';

@exposeLocale()
export default class SearchGroupList extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            isMoreClick: false,
            isShowMoreBtn: false,
            renderedGroupLists: [],
            searchText: ''
        };
    }

    /**
     * 判断账号是否被匹配
     * @param account
     */
    isMatchSearchText(groupFavoriteList, searchText) {
        if (!searchText) {
            //没有输入搜索条件,不需要搜索.
            return true;
        }

        var groupName = groupFavoriteList.name;
        groupName = groupName.toLocaleLowerCase();
        searchText = searchText.toLocaleLowerCase();
        return groupName.indexOf(searchText) !== -1;
    }


    filterSearchList=(sessions, groupFavoriteList, searchText, isGroupMoreClick)=> {
        var renderedGroupLists = [];
        var that = this;
        if(groupFavoriteList) {
            groupFavoriteList.forEach(function (u, i) {
                if(!that.isMatchSearchText(u, searchText)) {
                    return;
                }
                sessions.forEach(function (session, i) {
                    if(u.gid === session.sessionId) {
                        renderedGroupLists.push(session);
                    }
                });

            });
        }

        if(renderedGroupLists.length === 0) {
            that.props.action.setSearchResult("groupList");
            this.setState({isShowMoreBtn: false});
        } else if(renderedGroupLists.length > 3) {
            if(isGroupMoreClick) {
                this.setState({isShowMoreBtn: false});
                this.setState({renderedGroupLists: renderedGroupLists});
            } else {
                renderedGroupLists = renderedGroupLists.slice(0, 3);
                this.setState({renderedGroupLists: renderedGroupLists});
                this.setState({isShowMoreBtn: true});
            }
        } else {
            this.setState({renderedGroupLists: renderedGroupLists});
            this.setState({isShowMoreBtn: false});
        }

    }

    componentWillReceiveProps(nextProps) {
        const {sessions, groupFavoriteList, searchText, isGroupMoreClick} = nextProps;
        this.filterSearchList(sessions, groupFavoriteList, searchText, isGroupMoreClick);
        this.setState({searchText: searchText});
    }

    componentWillMount() {
        const {sessions, groupFavoriteList, searchText, isGroupMoreClick} = this.props;
        this.filterSearchList(sessions, groupFavoriteList, searchText, isGroupMoreClick);
        this.setState({searchText: searchText});
    }

    onClickMore() {
        this.props.action.setMoreClick("groupList");
        this.setState({isShowMoreBtn: false});
    }

    render() {
        var that = this;
        var locale = that.state.locale || {};
        const {isShowMoreBtn, renderedGroupLists, searchText} = that.state;
        const {parent, userInfo} = this.props;

        return (
            <div className="SearchList" >
                <div className="searchType">
                    <span>{locale["groups_nearby_group"].toUpperCase()}</span>
                </div>
                {renderedGroupLists.map((renderedGroupList, index) => {
                    return <ViewGlobalListItem key={index} data={renderedGroupList} userInfo={userInfo} locale={locale} searchText={searchText} searchType="groupList" parent={parent}/>
                })}
                {isShowMoreBtn &&
                <div className="clickMore" onClick={that.onClickMore.bind(that)}>
                    <i></i>
                    <span>{locale["baba_search_moregroups"]}</span>
                </div>
                }
            </div>
        );
    }

}