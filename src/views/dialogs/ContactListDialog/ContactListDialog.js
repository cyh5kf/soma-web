import React, {PropTypes} from 'react';
import ModelDialog from '../../../components/dialog/ModelDialog';
import ReactPropTypes from '../../../core/ReactPropTypes';
import {FriendAccountListSchema} from '../../../core/schemas/UserAccountSchemas';
import ContactList from '../../view-components/ContactList/ContactList';
import {hideStyle} from '../../../utils/JSXRenderUtils';
import CreateGroupButton from '../../view-components/CreateGroupButton/CreateGroupButton';
import exposeLocale from '../../../components/exposeLocale';

import './ContactListDialog.less';

@exposeLocale()
export default class ContactListDialogComposer extends ModelDialog {

    constructor() {
        super(...arguments);
        this.className += ' dlg-ContactListDialog';
        this.state = {
            show: true,
            isShowCreateButton: false,
            isLoading: false,
            isError: false,
            errorMsg: ''
        };
    }

    static propTypes = {
        ...ModelDialog.propTypes,
        title: PropTypes.string.isRequired,
        selectType: PropTypes.number.isRequired,
        onMemberSelectFinished:PropTypes.func.isRequired,
        userAccountList: ReactPropTypes.ofSchema(FriendAccountListSchema)
    };

    static defaultProps = {
        closeOnMaskClick: true
    };

    onClickContactItem = ()=> {};

    onClickCloseBtn = ()=> {
        this.close();
    };

    onMemberSelectFinished =()=>{
        this.displayErrorMsg(false);
        var contactList = this.refs['contactList'];
        var selectedUids = contactList.getSelectedAccountsUid();
        var onMemberSelectFinished = this.props.onMemberSelectFinished;
        onMemberSelectFinished && onMemberSelectFinished(selectedUids,this);
    };

    displayErrorMsg = (isError, errorMsg = '')=> {
        this.setState({isError: isError, errorMsg: errorMsg});
    };

    displayLoading = (isLoading)=> {
        this.setState({isLoading: isLoading});
    };


    /**
     * 选中或取消一个联系人
     */
    onToggleAccountSelected=(data)=>{
        this.displayErrorMsg(false);
        var {selectedAccountsSize} = data;
        var isShowCreateButton = selectedAccountsSize > 0 ;
        this.setState({isShowCreateButton:isShowCreateButton});
    };

    renderContent() {
        var that = this;
        var {title,selectType,userAccountList} = that.props;
        var {isShowCreateButton,isLoading,isError,errorMsg} = that.state;

        return (
            <div className="ContactListDialog">
                <div className="error-msg" style={hideStyle(!isError)}>
                    <span className="ic_info_outline_orange"></span>
                    <span className="text">{errorMsg}</span>
                </div>
                <div className="ContactListDialogHeader">
                    <div className="closeBtn AutoFocusInput" onClick={that.onClickCloseBtn}></div>
                    <div className="titleText">{title}</div>
                </div>

                <ContactList ref="contactList"
                             userAccountList={userAccountList}
                             onToggleAccountSelected={that.onToggleAccountSelected}
                             onClickContactItem={that.onClickContactItem}
                             selectType={selectType} />

                <CreateGroupButton onClick={that.onMemberSelectFinished} isShow={isShowCreateButton} isLoading={isLoading}/>
            </div>
        );
    }

}
