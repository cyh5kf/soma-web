import React,{PropTypes} from 'react'
import PureRenderComponent from '../../../components/PureRenderComponent';
import AccountAvatar from '../AccountAvatar/AccountAvatar';
import EnumStatusType from '../../../core/enums/EnumStatusType';
import EnumSessionType from '../../../core/enums/EnumSessionType';
import {formatSessionName} from '../../../core/core-utils/SessionUtils';
import {getUserDisplayName} from '../../../core/core-utils/UserUtils';
import './ViewListItem.less';
import SessionLastMsg from '../session-last-msg/SessionLastMsg';

/**
 * 联系人列表
 */
export default class ViewListItem extends PureRenderComponent {

    static propTypes = {
        locale: PropTypes.object.isRequired
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

    getStatusText({whatsUpType,sysWhatsUpNum,customWhatsUpContent},locale){
        if (whatsUpType === 0) {
            return locale[EnumStatusType[sysWhatsUpNum]];
        } else {
            return customWhatsUpContent;
        }
    }

    handleSessionClick = (e) => {
        this.props.action.handleSessionClick(e);
    };

    onClickContactItem = (e) => {
        this.props.action.onClickContactItem(e);
    };

    renderLastMessage() {
        const {userInfo: {uid: myUid}, data, locale} = this.props;
        return <SessionLastMsg isGlobalSearch={true} loginUid={myUid} session={data} locale={locale}/>;
    }

    //高亮显示匹配字符
    highLight = (sessionName, searchText) => {
        if (!searchText) {
            //没有输入搜索条件,不需要搜索.
            return sessionName;
        }

        var sessionLocalName = sessionName.toLocaleLowerCase();
        var searchLocalText = searchText.toLocaleLowerCase();
        var matchResult = sessionLocalName.split(searchLocalText).join(`<span class="markBlue">${searchLocalText}</span>`);

        return matchResult;
    }

    getDiffTypeItem=()=> {
        let that = this;
        var {data, locale, searchType, searchText} = that.props;

        switch (searchType) {
            case "chatsList":
                let {sessionId, sessionName, sessionLogo, sessionType, matchObject, isVip, isNotInSessions,userAccountMap} = data;

                //P2P聊天中,如果不是我的好友,显示对方手机号,如果对方没有设置头像,头像显示成一个加号
                var p2pUserAccount = userAccountMap && userAccountMap[sessionId]; //只有P2P会话才有用
                var displaySessionName = formatSessionName({sessionName,sessionType},p2pUserAccount);
                return (
                    <div data-session-id={sessionId} data-session-type={sessionType} onClick={(e)=>this.handleSessionClick(e)}>
                        <AccountAvatar className="AlobalSearch-avatar" isVip={isVip} name={displaySessionName} avatar={sessionLogo}/>
                        <div className="info-body">
                            <div className="info-name">
                                {sessionType === EnumSessionType.GROUP_SESSION? (<div className="icon_group" ></div>): null}
                                {matchObject === "matchName"?
                                    <div className="accountName" dangerouslySetInnerHTML={{__html:this.highLight(displaySessionName, searchText)}}></div>:
                                    <div className="accountName">{displaySessionName}</div>
                                }
                            </div>
                            <div className="last_msg">
                                {!isNotInSessions && this.renderLastMessage()}
                            </div>
                        </div>
                    </div>
                )
                break;
            case "contactsList":
                var statusText = that.getStatusText(data, locale);
                var {uid, matchObject, name, avatar, isVip} = data;
                var userDisplayName = getUserDisplayName(data);

                return (
                    <div data-uid={uid} onClick={(e)=>this.onClickContactItem(e)}>
                        <AccountAvatar className="AlobalSearch-avatar" isVip={isVip} name={userDisplayName} avatar={avatar}/>
                        <div className="info-body">
                            {matchObject === "matchName"?
                                <div className="accountName" dangerouslySetInnerHTML={{__html:this.highLight(userDisplayName, searchText)}}></div>:
                                <div className="accountName">{userDisplayName}</div>
                            }
                            <div className="customWhatsUpContent">{statusText}</div>
                        </div>
                    </div>
                )
                break;
            case "groupList":
                var {sessionId, sessionName, sessionLogo, sessionType, memberCount} = data;

                return (
                    <div data-session-id={sessionId} data-session-type={sessionType} onClick={(e)=>this.handleSessionClick(e)}>
                        <AccountAvatar name={sessionName} avatar={sessionLogo}/>
                        <div className="info-body">
                            <div className="info-name">
                                {sessionType === EnumSessionType.GROUP_SESSION? (<div className="icon_group" ></div>): null}
                                <div className="accountName" dangerouslySetInnerHTML={{__html:this.highLight(sessionName, searchText)}}></div>
                            </div>
                            <div className="memberCount">{memberCount} {locale['baba_group_groupmem']}</div>
                        </div>
                    </div>
                )
                break;
        }
    }



    render() {
        var that = this;

        return (
            <div className="ViewListItem">
                {that.getDiffTypeItem()}
            </div>
        );
    }

}
