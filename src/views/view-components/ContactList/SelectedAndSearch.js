import React, {PropTypes} from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import ReactPropTypes from '../../../core/ReactPropTypes';
import {FriendAccountListSchema} from '../../../core/schemas/UserAccountSchemas';
import GsearchBox from '../../../components/searchbox/GsearchBox';
import SearchBox from '../../../components/searchbox/SearchBox';
import AccountAvatar from '../AccountAvatar/AccountAvatar';
import './SelectedAndSearch.less';

/**
 * 联系人列表中已经被选中的联系人.
 */
export default class SelectedAndSearch extends PureRenderComponent {


    static propTypes = {
        placeholder: PropTypes.string.isRequired,
        userAccountList: ReactPropTypes.ofSchema(FriendAccountListSchema),
        isAccountSelected: PropTypes.func.isRequired,
        onRemoveSelectedItem: PropTypes.func.isRequired,
        onSearcherChange: PropTypes.func.isRequired,
        onSearcherEnterKey: PropTypes.func.isRequired,
        selectedAccountsSize: PropTypes.number.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            isSearchFocus:false
        };
    }

    onRemoveSelectedItem(user) {
        var {onRemoveSelectedItem} = this.props;
        onRemoveSelectedItem(user);
    }

    componentDidUpdate() {
        var that = this;
        var selectedAndSearchDOM = that.refs['SelectedAndSearch'];
        selectedAndSearchDOM.scrollTop = 1000000;
    }


    onSearcherFocus = ()=>{
        this.setState({
            isSearchFocus:true
        });
    };


    quitGlobalSearch = ()=> {
        this.setState({
            isSearchFocus: false
        });
        this.props.onSearcherChange(null,'');
    }

    onSearcherChange = (e)=> {
        var value = e.target.value;
        //this.setState({searchText: value});
        this.props.onSearcherChange(null,value);
    };


    onClearSearchText=()=> {
        //this.setState({searchText: ''});
        this.props.onSearcherChange(null,'');
    };


    onBlurSearchInput = ()=> {
        let searchText = this.props.searchText;
        if(!searchText) {
            this.setState({ isSearchFocus: false});
        }
    };

    makeInputFocus =()=>{
        setTimeout(()=>{
            var selectedAndSearchDOM = this.refs['SelectedAndSearch'];
            var input = selectedAndSearchDOM.querySelector('input');
            input.focus();
        },10);
    };

    onGSearchKeyDown =({keyCode})=> {
        var that = this;
        //按下退格键
        if (keyCode === 8) {

            let searchText = that.props.searchText || '';
            let {userAccountList,isAccountSelected} = that.props;

            if (searchText.length === 0) {
                //找到最后一个选中的人
                var lastSelectedUser = null;
                userAccountList.forEach((u)=> {
                    if (isAccountSelected(u)) {
                        lastSelectedUser = u;
                    }
                });

                //移除最后一个选中的人
                if (lastSelectedUser) {
                    that.onRemoveSelectedItem(lastSelectedUser);
                }

                this.setState({isSearchFocus: true});
                this.makeInputFocus();
            }
        }
    };

    render() {
        var that = this;
        var {isSearchFocus} = that.state;
        var {placeholder,userAccountList,isAccountSelected,selectedAccountsSize,searchText, onSearcherChange, onSearcherEnterKey} = that.props;
        var isSelectedEmpty = selectedAccountsSize === 0;

        var isShowGSearchBox = isSearchFocus|| !isSelectedEmpty;

        return (
            <div className={`SelectedAndSearch isShowGSearchBox_${isShowGSearchBox} isSelectedEmpty_${isSelectedEmpty}`} ref="SelectedAndSearch">
                <div className={`topSpace_${isSelectedEmpty}`}></div>
                <div className="selectItemList">
                    {
                        userAccountList.map(function (u) {
                            if (!isAccountSelected(u)) {
                                return;
                            }
                            var uid = u.uid;
                            var avatar = u.avatar;
                            return (
                                <div key={uid} className="selectItem">
                                    <AccountAvatar name={u.name} avatar={avatar}/>
                                    <span className="nickname">{u.name}</span>
                                    <div className="remove" onClick={that.onRemoveSelectedItem.bind(that,u)}>
                                        <div className="removeIcon"></div>
                                    </div>
                                </div>
                            );
                        })
                    }
                    <div className="clear"></div>
                </div>


                {
                    (isShowGSearchBox)?
                        <GsearchBox searchText={searchText} parent={that} /> :
                        <div className="recent-search">
                            <SearchBox placeholder={placeholder} onFocus={that.onSearcherFocus}/>
                        </div>
                }

            </div>
        );
    }

}
