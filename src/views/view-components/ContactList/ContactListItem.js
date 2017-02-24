import React,{PropTypes} from 'react'
import ReactPropTypes from '../../../core/ReactPropTypes';
import PureRenderComponent from '../../../components/PureRenderComponent';
import {UserAccountSchema} from '../../../core/schemas/UserAccountSchemas';
import AccountAvatar from '../AccountAvatar/AccountAvatar';
import EnumStatusType from '../../../core/enums/EnumStatusType';
import LoginStore from '../../../core/stores/LoginStore';
import {getUserDisplayName} from '../../../core/core-utils/UserUtils';
import './ContactListItem.less';


function getAccountNameStyle(isGroupManager,locale){
    var soma_web_language_type = locale['soma_web_language_type'];
    if (soma_web_language_type === 'es') { //西班牙语
        if (isGroupManager) {
            return {
                width: 120
            };
        }
    }
    return {};
}

/**
 * 联系人列表
 */
export default class ContactItem extends PureRenderComponent {

    static propTypes = {
        onClick: PropTypes.func.isRequired,
        locale: PropTypes.object.isRequired,
        renderItemExtend: PropTypes.func,
        data: ReactPropTypes.ofSchema(UserAccountSchema)
    };

    shouldComponentUpdate(nextProps, nextState) {
        var shouldUpdate = super.shouldComponentUpdate(nextProps,nextState);
        if(!shouldUpdate){
            var {renderItemExtend} = this.props;
            if(renderItemExtend){
                return true;
            }
        }
        return shouldUpdate;
    }

    onClickContactItem = ()=> {
        var {onClick,data} = this.props;
        onClick(data);
    };


    /**
     * 渲染扩展
     */
    renderItemExtend(){
        var {data,renderItemExtend} = this.props;
        if(renderItemExtend){
            return renderItemExtend(data) || {};
        }
        return {};
    }


    getStatusText({whatsUpType,sysWhatsUpNum,customWhatsUpContent},locale){
        if (whatsUpType === 0) {
            return locale[EnumStatusType[sysWhatsUpNum]];
        } else {
            return customWhatsUpContent;
        }
    }

    //是否是当前登录用户本人的信息
    isCurrentMe =()=>{
        var {data} = this.props;
        var myUid = LoginStore.getUserInfo().uid;
        var uid = data.uid;
        if (uid === myUid) {
            return true;
        }
    };

    render() {
        var that = this;
        var {data,locale} = that.props;
        var statusText = that.getStatusText(data, locale);
        var isMe = that.isCurrentMe() ? 'isMe' : '';
        var userDisplayName = getUserDisplayName(data);
        var accountName = isMe ? locale['baba_grpchat_me'] : userDisplayName;
        var {extendComponent,isGroupManager} = that.renderItemExtend();

        return (
            <div className={`ContactListItem CommonListItem ${isMe}`}>

                <AccountAvatar className="itemIcon" name={userDisplayName} avatar={data.avatar} isVip={data.isVip} onClick={this.onClickContactItem}/>

                <div className="itemContent" onClick={this.onClickContactItem}>
                    <div className="accountName" style={getAccountNameStyle(isGroupManager,locale)} title={accountName}>{accountName}</div>
                    <div className="customWhatsUpContent">{statusText}</div>
                </div>

                {extendComponent}
            </div>
        );
    }

}
