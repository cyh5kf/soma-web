import React, {PropTypes} from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import {showStyle} from '../../../utils/JSXRenderUtils';
import SearchBox from '../../../components/searchbox/SearchBox';
import ReactPropTypes from '../../../core/ReactPropTypes';
import ContactListItem from './ContactListItem';
import SelectedAndSearch from './SelectedAndSearch';
import {FriendAccountListSchema} from '../../../core/schemas/UserAccountSchemas';
import exposeLocale from '../../../components/exposeLocale';
import './ContactList.less';


const SELECT_TYPE_NONE = 0;
const SELECT_TYPE_SINGLE = 1;
const SELECT_TYPE_MULTI = 2;


/**
 * 联系人列表
 */
@exposeLocale()
export default class ContactList extends PureRenderComponent {


    static propTypes = {
        onClickContactItem: PropTypes.func,
        onToggleAccountSelected: PropTypes.func,
        renderItemExtend: PropTypes.func, //用于渲染对每一项的扩展,可以为空.
        selectType: PropTypes.number.isRequired,
        className: PropTypes.string,
        userAccountList: ReactPropTypes.ofSchema(FriendAccountListSchema)
    };


    static defaultProps = {
        selectType: SELECT_TYPE_NONE,
        className: ''
    };

    constructor(props) {
        super(props);
        this.state = {
            searchText: '',
            selectedAccountsUid: {},
            selectedAccountsSize: 0 //选中的数量
        };
    }

    onClickContactItem = (targetUser)=> {
        if (this.props.selectType === SELECT_TYPE_MULTI) {
            var uid = targetUser.uid;
            this.markAccountSelected(uid, true);
            this.setState({searchText:''});
            this.makeSearchInputFocus();
        }
        var {onClickContactItem} = this.props;
        onClickContactItem && onClickContactItem(targetUser);
    };

    makeSearchInputFocus=()=>{
        var SelectedAndSearch = this.refs['SelectedAndSearch'];
        SelectedAndSearch.makeInputFocus();
    };

    /**
     * 搜索框中文本发生变化
     * @param e
     */
    onSearcherChange = (e,searchText)=> {
        var value = e  ? e.target.value : searchText;
        this.setState({searchText: value});
    };

    /**
     * 在搜索框中按下回车键
     */
    onSearcherEnterKey = ()=> {

    };

    /**
     * 移除已选中的联系人
     */
    onRemoveSelectedItem = (targetUser)=> {
        var uid = targetUser.uid;
        this.markAccountSelected(uid, false);
    };

    /**
     * 标记某个Account是否被选中
     * @param uid
     * @param isSelected
     */
    markAccountSelected(uid, isSelected) {
        var selectedAccountsUid = Object.assign({}, this.state.selectedAccountsUid);
        selectedAccountsUid[uid] = isSelected;

        var selectedAccountsSize = 0;
        for (var key in selectedAccountsUid) {
            if (selectedAccountsUid.hasOwnProperty(key)) {
                var isKeySelected = selectedAccountsUid[key];
                if (isKeySelected) {
                    selectedAccountsSize++;
                }
            }
        }

        this.setState({selectedAccountsUid: selectedAccountsUid, selectedAccountsSize: selectedAccountsSize});

        var {onToggleAccountSelected} = this.props;
        onToggleAccountSelected && onToggleAccountSelected({selectedAccountsUid, selectedAccountsSize});
    }


    /**
     * 判断
     * @param account
     */
    isMatchSearchText(account) {
        var searchText = this.state.searchText;
        if (!searchText) {
            //没有输入搜索条件,不需要搜索.
            return true;
        }

        //手机号或姓名 匹配都可以
        var name = account.name || "";
        name = name.toLowerCase();
        searchText = searchText.toLowerCase();
        var isNameOk =  name.indexOf(searchText) !== -1;
        if (isNameOk){
            return true;
        }

        var mobile = account.uid || "";
        mobile = mobile.toLowerCase();
        return mobile.indexOf(searchText) !== -1;
    }

    /**
     * 判断这个账号有没有被选中
     * @param account
     */
    isAccountSelected = (account)=> {
        var uid = account.uid;
        var selectedAccountsUid = this.state.selectedAccountsUid;
        return (!!selectedAccountsUid[uid]);
    };


    getSelectedAccountsUid() {
        var selectedAccountsUid = this.state.selectedAccountsUid;
        var result = [];
        for (var key in selectedAccountsUid) {
            if (selectedAccountsUid.hasOwnProperty(key)) {
                var isKeySelected = selectedAccountsUid[key];
                if (isKeySelected) {
                    result.push(key);
                }
            }
        }
        return result;
    }


    renderUserAccountList=(that, userAccountList, renderItemExtend, locale)=> {
        var renderedAccountList = [];
        userAccountList.forEach(function (u, i) {
            if (that.isAccountSelected(u)) {
                return;
            }
            if (!that.isMatchSearchText(u)) {
                return;
            }
            var uid = u.uid || '';
            var key = uid + '_' +i;
            renderedAccountList.push(
                <ContactListItem key={key}
                                 onClick={that.onClickContactItem}
                                 data={u}
                                 locale={locale}
                                 renderItemExtend={renderItemExtend}/>);

        });
        return renderedAccountList;
    };


    renderEmptyAccountTips=()=>{
        var locale = this.state.locale;
        return (
            <div className="empty-tips" onClick={this.makeSearchInputFocus}>
                <div className="empty-icon"></div>
                <div className="empty-text">{locale['baba_add_contact']}</div>
            </div>
        );
    };

    render() {
        var that = this;
        var state = that.state;
        var locale = state.locale;
        var {selectType,className,userAccountList,renderItemExtend} = that.props;
        var renderedAccountList = this.renderUserAccountList(that,userAccountList,renderItemExtend,locale);
        return (
            <div className={`ContactList ActionArea ${className}`}>

                <div style={showStyle(selectType===SELECT_TYPE_SINGLE || selectType===SELECT_TYPE_MULTI)}>
                    <SelectedAndSearch placeholder={locale['Search']}
                                       ref="SelectedAndSearch"
                                       selectedAccountsSize={state.selectedAccountsSize}
                                       isAccountSelected={that.isAccountSelected}
                                       userAccountList={userAccountList}
                                       onRemoveSelectedItem={that.onRemoveSelectedItem}
                                       searchText = {state.searchText}
                                       onSearcherChange={that.onSearcherChange}
                                       onSearcherEnterKey={that.onSearcherEnterKey}/>
                </div>

                {
                    renderedAccountList.length === 0 ?
                        this.renderEmptyAccountTips() :
                        <div className="userList">
                            {renderedAccountList}
                        </div>
                }
            </div>
        );
    }

}
