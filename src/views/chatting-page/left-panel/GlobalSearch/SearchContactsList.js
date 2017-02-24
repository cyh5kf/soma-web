import React, {PropTypes} from 'react'
import PureRenderComponent from '../../../../components/PureRenderComponent';
import  ViewGlobalListItem from './ViewGlobalListItem';
import {getUserDisplayName} from '../../../../core/core-utils/UserUtils';
import './GlobalSearch.less';
import exposeLocale from '../../../../components/exposeLocale';

@exposeLocale()
export default class SearchContactsList extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            isMoreClick: false,
            isShowMoreBtn: false,
            renderedContactsLists: [],
            searchText: ''
        };
    }


    /**
     * 判断账号是否被匹配
     * @param account
     */
    isMatchSearchText(account, searchText) {
        if (!searchText) {
            //没有输入搜索条件,不需要搜索.
            return true;
        }

        //手机号或姓名 匹配都可以
        //var accountName = account.name;
        //accountName = accountName.toLocaleLowerCase();
        searchText = searchText.toLowerCase();
        var userDisplayName = getUserDisplayName(account).toLowerCase();
        var isNameOk = userDisplayName.indexOf(searchText) !== -1;
        if(isNameOk) {
            return "matchName";
        } else {
            var mobile = account.uid || "";
            mobile = mobile.toLowerCase();
            if(mobile.indexOf(searchText) !== -1) {
                return "matchPhone";
            }
        }

    }

    filterSearchList=(userAccountList, searchText, isContactsMoreClick)=> {
        var renderedContactsLists = [];
        var that = this;
        userAccountList.forEach(function (u, i) {
            var matchObject = that.isMatchSearchText(u, searchText);
            if (!matchObject) {
                return;
            }
            u.matchObject = matchObject;
            renderedContactsLists.push(u);
        });


        if(renderedContactsLists.length === 0) {
            that.props.action.setSearchResult("contactsList");
            this.setState({isShowMoreBtn: false});
        } else if(renderedContactsLists.length > 3) {
            if(isContactsMoreClick) {
                this.setState({isShowMoreBtn: false});
                this.setState({renderedContactsLists: renderedContactsLists});
            } else {
                renderedContactsLists = renderedContactsLists.slice(0, 3);
                this.setState({renderedContactsLists: renderedContactsLists});
                this.setState({isShowMoreBtn: true});
            }
        } else {
            this.setState({renderedContactsLists: renderedContactsLists});
            this.setState({isShowMoreBtn: false});
        }

    }

    componentWillReceiveProps(nextProps) {
        const {userAccountList, searchText, isContactsMoreClick} = nextProps;
        this.filterSearchList(userAccountList, searchText, isContactsMoreClick);
        this.setState({searchText: searchText});
    }

    componentWillMount() {
        const {userAccountList, searchText, isContactsMoreClick} = this.props;
        this.filterSearchList(userAccountList, searchText, isContactsMoreClick);
        this.setState({searchText: searchText});
    }

    onClickMore() {
        this.props.action.setMoreClick("contactsList");
        this.setState({isShowMoreBtn: false});
    }

    render() {
        var that = this;
        var locale = that.state.locale || {};
        const {isShowMoreBtn, renderedContactsLists, searchText} = that.state;
        const {parent} = this.props;

        return (
            <div className="SearchList" >
                <div className="searchType">
                    <span>{locale["mainview.friends"].toUpperCase()}</span>
                </div>
                {renderedContactsLists.map((renderedContactsList, index) => {
                    return <ViewGlobalListItem key={index} data={renderedContactsList} locale={locale} searchText={searchText} searchType="contactsList" parent={parent}/>
                })}
                {isShowMoreBtn &&
                <div className="clickMore" onClick={that.onClickMore.bind(that)}>
                    <i></i>
                    <span>{locale["baba_search_morecontacts"]}</span>
                </div>
                }

            </div>
        );
    }

}