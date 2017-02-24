import React, {PropTypes} from 'react';
import ModelDialog from '../../../components/dialog/ModelDialog';
import ReactPropTypes from '../../../core/ReactPropTypes';
import {FriendAccountListSchema} from '../../../core/schemas/UserAccountSchemas';
import SessionsStore, {SESSIONS_EVENTS} from '../../../core/stores/SessionsStore';
import UserAccountStore,{USER_ACCOUNT_EVENTS} from '../../../core/stores/UserAccountStore';
import FriendAccountStore,{FRIEND_ACCOUNT_EVENTS} from '../../../core/stores/FriendAccountStore';
import GroupFavoriteStore,{GROUP_FAVORITE_EVENTS} from '../../../core/stores/GroupFavoriteStore';
import SearchBox from '../../../components/searchbox/SearchBox';
import GsearchBox from '../../../components/searchbox/GsearchBox';
import ForwardSearchComposer from './ForwardSearchComposer';
import RecentMessageList from './RecentMessageList';
import ContactsMessageList from './ContactsMessageList';
import exposeLocale from '../../../components/exposeLocale';
import exposeStoreData from '../../view-components/exposeStoreData';
import LoginStore, {LOGIN_EVENTS} from '../../../core/stores/LoginStore';

import './ForwardMessageDialog.less';

@exposeLocale()
@exposeStoreData([
    [SessionsStore, SESSIONS_EVENTS.SESSION_LIST_CHANGE, () => ({
        sessions: SessionsStore.getSessionInfos()
    })],
    [FriendAccountStore, FRIEND_ACCOUNT_EVENTS.ACCOUNT_LIST_CHANGE, () => ({
        userAccountList: FriendAccountStore.getFriendAccountList()
    })],
    [UserAccountStore, USER_ACCOUNT_EVENTS.USER_ACCOUNT_STORE_CHANGE, () => ({
        userAccountMap: UserAccountStore.getUserAccountMap()
    })],
    [GroupFavoriteStore, GROUP_FAVORITE_EVENTS.GROUP_FAVORITE_STORE_CHANGE, () => ({
        groupFavoriteList: GroupFavoriteStore.getGroupFavoriteList()
    })],
    [LoginStore, LOGIN_EVENTS.CHANGE, () => ({
        userInfo: LoginStore.getUserInfo()
    })]
])
export default class ForwardMessageDialog extends ModelDialog {

    constructor() {
        super(...arguments);
        this.className += ' dlg-ContactListDialog';
        this.state = {
            show: true,
            selectTarget: 'recent',
            searchText: '',
            isSearchFocus: false
        };
    }

    static propTypes = {
        ...ModelDialog.propTypes,
        userAccountList: ReactPropTypes.ofSchema(FriendAccountListSchema)
    };

    static defaultProps = {
        closeOnMaskClick: true
    };

    onClickContactItem = ()=> {};

    onClickCloseBtn = ()=> {
        this.close();
    };

    //切换列表
    onSwitchList(target) {
        if(target === "recent") {
            this.setState({
                selectTarget: "recent",
                searchText: '',
                isSearchFocus: false
            });
        } else {
            this.setState({
                selectTarget: "contacts",
                searchText: '',
                isSearchFocus: false
            });
        }
    }

    /**
     * 搜索框中文本发生变化
     * @param e
     */
    onSearcherChange = (e)=> {
        var value = e.target.value;
        this.setState({searchText: value});
    };

    quitGlobalSearch = ()=> {
        this.setState({
            isSearchFocus: false,
            searchText: ''
        });
        this.close();
    }

    onBlurSearchInput = ()=> {
        let searchText = this.state.searchText;
        if(!searchText) {
            this.setState({
                isSearchFocus: false
            });
        }
    }

    onClearSearchText=()=> {
        this.setState({searchText: ''});
    }

    onSearcherFocus =()=> {
        this.setState({isSearchFocus: true});
    }

    getGroupInfo=(sessions, groupFavoriteList)=> {
        var groupFavoriteListData = [];
        var sessionData = {};
        if (groupFavoriteList) {
            groupFavoriteList.forEach(function (g, i) {
                var newGroupData = {
                    sessionLogo: g.avatar,
                    sessionName: g.name,
                    sessionId: g.gid,
                    sessionType: 2,
                    isNotInSessions: true
                }
                groupFavoriteListData.push(newGroupData);
            });

            groupFavoriteListData.forEach(function (g, i) {
                sessions.forEach(function (s, a) {
                    if (g.sessionId === s.sessionId) {
                        sessionData = s;
                        groupFavoriteListData.splice(i,1,sessionData);  //如果session中有该群组的数据则将groupFavoriteList数据替换为session的数据,如果session中的该群组删除了,则不用替换
                    }
                });
            });
        }

        return groupFavoriteListData;
    }

    renderContent() {
        var that = this;
        var {message} = that.props;
        var {locale, selectTarget, sessions, searchText, isSearchFocus, userAccountList, groupFavoriteList, userInfo, userAccountMap} = that.state;
        var recentActive = selectTarget === 'recent'? 'active': '';
        var contactsActive = selectTarget === 'contacts'? 'active': '';
        var groupFavoriteListInfo = that.getGroupInfo(sessions, groupFavoriteList);


        return (
            <div className="ForwardMessageDialog">
                <div className="ForwardMessageDialogHeader">
                    <div className="closeBtn" onClick={that.onClickCloseBtn}></div>
                    <div className="titleText">{locale['baba_web_forward_title']}</div>
                </div>

                <div className="switchList">
                    <div className={`recent ${recentActive}`} onClick={that.onSwitchList.bind(that,"recent")}>
                        <span>{locale['question.recent'].toUpperCase()}</span>
                        <div className="activeBar"></div>
                    </div>
                    <div className={`contacts ${contactsActive}`} onClick={that.onSwitchList.bind(that,"contacts")}>
                        <span>{locale['mainview.friends'].toUpperCase()}</span>
                        <div className="activeBar"></div>
                    </div>
                </div>

                {
                    selectTarget === "recent"?
                        (
                            <div className="recentContent">
                                {
                                    isSearchFocus?
                                        (
                                            <GsearchBox searchText={searchText} parent={this}></GsearchBox>
                                        ):
                                        (
                                            <div className="recent-search">
                                                <SearchBox placeholder={locale['Search']} onFocus={that.onSearcherFocus}/>
                                            </div>
                                        )
                                }
                                {
                                    searchText?
                                        (
                                            <ForwardSearchComposer message={message} locale={locale} searchText={searchText} sessions={sessions} userInfo={userInfo} userAccountMap={userAccountMap} parent={this} searchType="recent"></ForwardSearchComposer>
                                        ):
                                        (
                                            <RecentMessageList searchText={searchText} message={message} sessions={sessions} userAccountMap={userAccountMap} locale={locale} userInfo={userInfo} parent={this}/>
                                        )
                                }
                            </div>
                        ):
                        (
                            <div className="contactsContent">
                                {
                                    isSearchFocus?
                                        (
                                            <GsearchBox searchText={searchText} parent={this}></GsearchBox>
                                        ):
                                        (
                                            <div className="recent-search">
                                                <SearchBox placeholder={locale['Search']} onFocus={that.onSearcherFocus}/>
                                            </div>
                                        )
                                }
                                {
                                    searchText?
                                        (
                                            <ForwardSearchComposer message={message} locale={locale} searchText={searchText} userAccountList={userAccountList} groupFavoriteList={groupFavoriteListInfo} userAccountMap={userAccountMap} userInfo={userInfo} parent={this} searchType="contacts"></ForwardSearchComposer>
                                        ):
                                        (
                                            <ContactsMessageList message={message} searchText={searchText} userAccountList={userAccountList} groupFavoriteList={groupFavoriteListInfo} userInfo={userInfo} locale={locale}  parent={this}/>
                                        )
                                }
                            </div>
                        )
                }

            </div>
        );
    }

}
