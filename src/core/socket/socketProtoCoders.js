import mapValues from 'lodash/mapValues';
import isEqual from 'lodash/isEqual';
import binaryUtils from '../../utils/binaryUtils';
import {aesEncryptMessage, aesDecryptMessage} from '../../utils/crypto';
import {breakingError} from '../../utils/warning';
import {ensureUserEccKeysCmd, refetchUserEccKeysCmd} from '../commands/UsersCommands';
import UserKeysStore from '../stores/UserKeysStore';
import LoginStore from '../stores/LoginStore';
import protos, {encodeProto, decodeProto} from '../protos/protos';

function transformProtoToFunc(coders) {
    const isProto = val => val && val.decode64;
    return mapValues(coders, coder => {
        const {encodeRequest, decodeResponse} = coder;
        if (isProto(encodeRequest)) {
            coder.encodeRequest = function (data) {
                return encodeProto(encodeRequest, data);
            };
        }
        if (isProto(decodeResponse)) {
            coder.decodeResponse = function (bytes) {
                return decodeProto(decodeResponse, bytes);
            }
        }
        return coder;
    });
}

function getMsgDataPB(chatSubItemType) {
    const {EChatSubItemType, EGroupMsgType} = protos;
    switch (chatSubItemType) {
        // 消息内容事件
        case EChatSubItemType.EChatSubItemType_Plain_Text:
            return protos.IMChatTextItemPB;
        case EChatSubItemType.EChatSubItemType_Image:
            return protos.IMChatImageItemPB;
        case EChatSubItemType.EChatSubItemType_OrigImage:
            return protos.IMChatOrigImageItemPB;
        case EChatSubItemType.EChatSubItemType_Audio:
            return protos.IMChatAudioItemPB;
        case EChatSubItemType.EChatSubItemType_ShortVideo:
            return protos.IMChatShortVideoItemPB;
        case EChatSubItemType.EChatSubItemType_Location:
            return protos.IMChatLocationItemPB;
        case EChatSubItemType.EChatSubItemType_ContactCard:
            return protos.IMChatContactCardItemPB;


        // 群聊事件
        case EGroupMsgType.EGroupMsgType_GroupCreate:
            return protos.GroupCreateMsgPB;
        case EGroupMsgType.EGroupMsgType_MemberEnter:
            return protos.GroupMemberEnterMsgPB;
        case EGroupMsgType.EGroupMsgType_MemberLeave:
            return protos.GroupMemberLeaveMsgPB;
        case EGroupMsgType.EGroupMsgType_ModifyInfo:
            return protos.GroupRenameMsgPB;
        case EGroupMsgType.EGroupMsgType_AvatarChange:
            return protos.GroupAvatarMsgPB;
        case EGroupMsgType.EGroupMsgType_LeaderChange:
            return protos.GroupLeaderMsgPB;
        default:
            breakingError(`getMsgDataPB: 未知的消息类型: ${chatSubItemType}`);
            return null;
    }
}

function encodeMsgDataPB(chatSubItemType, data) {
    if (chatSubItemType === protos.EChatSubItemType.EChatSubItemType_Text) {
        return binaryUtils.stringToArrayBuffer(data);
    } else {
        return encodeProto(getMsgDataPB(chatSubItemType), data);
    }
}

function decodeMsgDataPB(chatSubItemType, dataBytes) {
    if (chatSubItemType === protos.EChatSubItemType.EChatSubItemType_Text) {
        return binaryUtils.arrayBufferToString(dataBytes);
    } else {
        return decodeProto(getMsgDataPB(chatSubItemType), dataBytes);
    }
}

async function decodeWebNotifyInnerPB(webNtf) {
    const msgNtf = webNtf.data = decodeProto(protos.MessageNtfPB, webNtf.data),
        msgNtfData = msgNtf.data,
        msgNtfType = msgNtf.sessiontype,
        ESessionType = protos.ESessionType;

    switch (msgNtfType) {
        case ESessionType.ESessionType_P2P:
        case ESessionType.ESessionType_P2PAck: {
            const p2pMsgNtf = msgNtf.data = decodeProto(protos.P2PMessageNotify, msgNtfData);

            if (msgNtfType === ESessionType.ESessionType_P2P) {
                if (p2pMsgNtf.type !== protos.EChatSubItemType.EChatSubItemType_TYPING) {
                    const myInfo = LoginStore.getUserInfo();
                    if (myInfo.loginVersion !== p2pMsgNtf.eccversion) {
                        // 版本不匹配, 保留 msg.data 为 ArrayBuffer 类型, 代表密钥失效, 不能解析
                    } else {
                        const aesKey = UserKeysStore.getAesKeyByPublicKey(binaryUtils.arrayBufferToArray(p2pMsgNtf.publickey));
                        p2pMsgNtf.data = decodeMsgDataPB(p2pMsgNtf.type, aesDecryptMessage(
                            p2pMsgNtf.data,
                            aesKey,
                            binaryUtils.stringToArray(p2pMsgNtf.aesivkey)
                        ));
                    }
                }
            }
            break;
        }

        case ESessionType.ESessionType_GroupChat: {
            const groupMsgNtf = msgNtf.data = decodeProto(protos.GroupMessageNotify, msgNtfData);
            groupMsgNtf.data = decodeMsgDataPB(groupMsgNtf.type, groupMsgNtf.data);
            break;
        }

        case ESessionType.ESessionType_SELF_NOTIFY: {
            const selfNtf = msgNtf.data = decodeProto(protos.SelfNotifyPB, msgNtfData),
                SelfNotifyType = protos.SelfNotifyType;
            switch (selfNtf.notify_type) {
                case SelfNotifyType.SELF_NOTIFY_TYPE_SEND_P2P_MESSAGE: {
                    selfNtf.request_data = decodeProto(protos.SendP2PMessageRequest, selfNtf.request_data);
                    const expectHisEccVersion = selfNtf.request_data.eccversion,
                        toUid = selfNtf.request_data.touid;
                    await ensureUserEccKeysCmd([toUid]);
                    let toUserKeyInfo = UserKeysStore.getUserKey(toUid);
                    let {publickey,type} = selfNtf.request_data;
                    if (type !== 21 && type !== 29) {
                        //对于打电话消息忽略掉imchatmsg.proto

                        if (!isEqual(binaryUtils.arrayBufferToArray(publickey), LoginStore.getUserInfo().loginPublicKey.toJS())) {
                            breakingError(__DEV__ ? '个人公钥不匹配' : 'Login Expired! Please re-login.');
                        }
                        if (toUserKeyInfo.eccVersion !== expectHisEccVersion) {
                            // 如果是已有版本太老, 尝试更新
                            if (Number(toUserKeyInfo.eccVersion) < Number(expectHisEccVersion)) {
                                await refetchUserEccKeysCmd([toUid]);
                                toUserKeyInfo = UserKeysStore.getUserKey(toUid);
                            }
                        }
                        // 如果版本仍然不匹配, 放弃解码
                        if (toUserKeyInfo.eccVersion === expectHisEccVersion) {
                            selfNtf.request_data.data = decodeMsgDataPB(selfNtf.request_data.type, aesDecryptMessage(
                                selfNtf.request_data.data,
                                toUserKeyInfo.sharedAesKey.toJS(),
                                binaryUtils.stringToArray(selfNtf.request_data.aesivkey)
                            ));
                            selfNtf.response_data = decodeProto(protos.SendP2PMessageResponse, selfNtf.response_data);
                        }

                    }
                    break;
                }
                //case SelfNotifyType.SELF_NOTIFY_TYPE_ACK_RECEIVED_DEL_MESSAGE:
                //    selfNtf.request_data = decodeProto(protos.AckReceivedDelMessageRequest, selfNtf.request_data);
                //    selfNtf.response_data = decodeProto(protos.AckReceivedDelMessageResponse, selfNtf.response_data);
                //    break;
                //case SelfNotifyType.SELF_NOTIFY_TYPE_ACK_BATCH_RECEIVED_DEL_MESSAGE:
                //    selfNtf.request_data = decodeProto(protos.AckReceivedDelOffMessageListRequest, selfNtf.request_data);
                //    selfNtf.response_data = decodeProto(protos.AckReceivedDelOffMessageListResponse, selfNtf.response_data);
                //    break;
                case SelfNotifyType.SELF_NOTIFY_TYPE_SEND_GROUP_MESSAGE:
                    selfNtf.request_data = decodeProto(protos.SendGroupMessageRequest, selfNtf.request_data);
                    selfNtf.request_data.data = decodeMsgDataPB(selfNtf.request_data.type, selfNtf.request_data.data);
                    selfNtf.response_data = decodeProto(protos.SendGroupMessageResponse, selfNtf.response_data);
                    break;

                case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_NAME:
                    selfNtf.request_data = decodeProto(protos.UpdateNameRequest, selfNtf.request_data);
                    selfNtf.response_data = decodeProto(protos.UpdateNameResponse, selfNtf.response_data);
                    break;
                case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_AVATAR:
                    selfNtf.request_data = decodeProto(protos.UpdateAvatarRequest, selfNtf.request_data);
                    selfNtf.response_data = decodeProto(protos.UpdateAvatarResponse, selfNtf.response_data);
                    break;
                case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_WHATSUP:
                    selfNtf.request_data = decodeProto(protos.UpdateWhatsUpRequest, selfNtf.request_data);
                    selfNtf.response_data = decodeProto(protos.UpdateWhatsUpResponse, selfNtf.response_data);
                    break;
                case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_MUTE:
                    selfNtf.request_data = decodeProto(protos.UpdateUserMuteRequest, selfNtf.request_data);
                    selfNtf.response_data = decodeProto(protos.UpdateUserMuteResponse, selfNtf.response_data);
                    break;
                case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_HAVE_READ_PRIVACY:
                    selfNtf.request_data = decodeProto(protos.UpdateHaveReadPrivacyRequest, selfNtf.request_data);
                    selfNtf.response_data = decodeProto(protos.UpdateHaveReadPrivacyResponse, selfNtf.response_data);
                    break;
                case SelfNotifyType.SELF_NOTIFY_TYPE_UPDATE_USER_GROUP_MUTE:
                    selfNtf.request_data = decodeProto(protos.MarkSilentRequest, selfNtf.request_data);
                    selfNtf.response_data = decodeProto(protos.MarkSilentResponse, selfNtf.response_data);
                    break;

                case SelfNotifyType.SELF_NOTIFY_TYPE_ADD_GROUP_TO_FAVORITE:
                    selfNtf.request_data = decodeProto(protos.AddGroupToFavoriteRequest, selfNtf.request_data);
                    selfNtf.response_data = decodeProto(protos.AddGroupToFavoriteResponse, selfNtf.response_data);
                    break;
                case SelfNotifyType.SELF_NOTIFY_TYPE_REMOVE_GROUP_FROM_FAVORITE:
                    selfNtf.request_data = decodeProto(protos.RemoveGroupFromFavoriteRequest, selfNtf.request_data);
                    selfNtf.response_data = decodeProto(protos.RemoveGroupFromFavoriteResponse, selfNtf.response_data);
                    break;

                case SelfNotifyType.SELF_NOTIFY_TYPE_MARK_P2P_READ:
                    selfNtf.request_data = decodeProto(protos.MarkP2PReadRequest, selfNtf.request_data);
                    selfNtf.response_data = decodeProto(protos.MarkP2PReadResponse, selfNtf.response_data);
                    break;

                case SelfNotifyType.SELF_NOTIFY_TYPE_MARK_GROUP_READ:
                    selfNtf.request_data = decodeProto(protos.MarkGroupReadRequest, selfNtf.request_data);
                    selfNtf.response_data = decodeProto(protos.MarkGroupReadResponse, selfNtf.response_data);
                    break;

            }
            break;
        }

        case ESessionType.ESessionType_FriendMsg:{
            //sessiontype为 ESessionType.ESessionType_FriendMsg = 3; //好友相关消息,data为 ContactNtf
            msgNtf.data = decodeProto(protos.ContactNtf, msgNtfData);
            break;
        }

        default:
            breakingError(`MsgNtf: 未知的推送类型: ${msgNtf.sessiontype}`);
    }

    return webNtf;
}


// encodeRequest: 接收 Object, 返回 ArrayBuffer
// decodeResponse: 接收 ArrayBuffer, 返回 Object
// 返回值可以是异步Promise
export default transformProtoToFunc({
    // jyf: TODO: 临时存在, 模拟app扫码登录
    'weblogin.webLoginCheck': {
        encodeRequest: protos.WebLoginCheckRequest,
        decodeResponse: protos.WebLoginCheckResponse
    },
    'weblogin.webLoginConfirm': {
        encodeRequest: protos.WebLoginConfirmRequest,
        decodeResponse: protos.WebLoginConfirmResponse
    },

    'weblogin.updateMobStat': {
        encodeRequest: protos.UpdateMobStatRequest,
        decodeResponse: protos.UpdateMobStatResponse
    },

    'accountproxy.updateUserEcc': {
        encodeRequest: protos.UpdateUserEccRequest,
        decodeResponse: protos.UpdateUserEccResponse
    },

    'websession.getWebSessionList': {
        encodeRequest: protos.GetWebSessionListRequest,
        decodeResponse(bytes) {
            const data = decodeProto(protos.GetWebSessionListResponse, bytes);
            data.session.forEach(session => {
                const SessionInfoPB = session.type === protos.WebSessionType.WEB_SESSION_TYPE_P2P ? protos.WebP2pSessionInfoPB : protos.WebGroupSessionInfoPB;
                session.session_info = decodeProto(SessionInfoPB, session.session_info);
            });
            return data;
        }
    },
    'websession.deleteWebSession': {
        encodeRequest: protos.DeleteWebSessionRequest,
        decodeResponse: protos.DeleteWebSessionResponse
    },


    // login
    'loginKey': {
        decodeResponse: bytes => binaryUtils.arrayBufferToString(bytes)
    },
    'LoginUserNtf': {
        decodeResponse: protos.WebLoginUserInfoPB
    },
    'LoginTokenNtf': {
        decodeResponse: protos.WebLoginTokenInfoPB
    },

    'LogoutNtf': {
        decodeResponse: protos.WebLogoutPB
    },

    // account
    'accountproxy.getBatchUserEcc': {
        encodeRequest: protos.GetBatchUserEccRequest,
        decodeResponse: protos.GetBatchUserEccResponse
    },
    // account
    'accountproxy.updateUserMute': {
        encodeRequest: protos.UpdateUserMuteRequest,
        decodeResponse: protos.UpdateUserMuteResponse
    },

    // settings
    'accountproxy.getWebUserSettings': {
        encodeRequest: protos.GetWebUserSettingsRequest,
        decodeResponse: protos.GetWebUserSettingsReponse
    },

    'accountproxy.updateName': {
        encodeRequest: protos.UpdateNameRequest,
        decodeResponse: protos.UpdateNameResponse
    },

    'accountproxy.updateWhatsUp': {
        encodeRequest: protos.UpdateWhatsUpRequest,
        decodeResponse: protos.UpdateWhatsUpResponse
    },

    'accountproxy.updateWebNotification': {
        encodeRequest: protos.UpdateWebNotificationRequest,
        decodeResponse: protos.UpdateWebNotificationResponse
    },

    'accountproxy.updateWebSound': {
        encodeRequest: protos.UpdateWebSoundRequest,
        decodeResponse: protos.UpdateWebSoundResponse
    },

    'accountproxy.updateAvatar': {
        encodeRequest: protos.UpdateAvatarRequest,
        decodeResponse: protos.UpdateAvatarResponse
    },


    // groupFavorite
    'accountproxy.getFavoriteGroupList': {
        encodeRequest: protos.GetFavoriteGroupListRequest,
        decodeResponse: protos.GetFavoriteGroupListResponse
    },

    'accountproxy.addGroupToFavorite': {
        encodeRequest: protos.AddGroupToFavoriteRequest,
        decodeResponse: protos.AddGroupToFavoriteResponse
    },

    'accountproxy.removeGroupFromFavorite': {
        encodeRequest: protos.RemoveGroupFromFavoriteRequest,
        decodeResponse: protos.RemoveGroupFromFavoriteResponse
    },


    // message
    'msgproxy2.SendP2P': {
        async encodeRequest(data) {
            await ensureUserEccKeysCmd([data.touid]);
            const msgData = data.data,
                aesKey = UserKeysStore.getUserKey(data.touid).sharedAesKey.toJS(),
                encryptedDataBytes = aesEncryptMessage(
                    encodeMsgDataPB(data.type, msgData),
                    aesKey,
                    binaryUtils.stringToArray(data.aesivkey)
                );
            return encodeProto(protos.SendP2PMessageRequest, {
                ...data,
                data: encryptedDataBytes
            });
        },
        decodeResponse: protos.SendP2PMessageResponse
    },
    'msgproxy2.AckReceiveds': {
        encodeRequest: protos.AckReceivedsP2POffMessageRequest,
        decodeResponse: protos.AckReceivedsP2POffMessageResponse
    },
    'msgproxy2.AckBatchReceivedDel': {
        encodeRequest: protos.AckReceivedDelOffMessageListRequest,
        decodeResponse: protos.AckReceivedDelOffMessageListResponse
    },

    'msgproxy2.markP2PRead': {
        encodeRequest: protos.MarkP2PReadRequest,
        decodeResponse: protos.MarkP2PReadResponse
    },

    'grpproxy.sendGroupMessage': {
        encodeRequest(data) {
            return encodeProto(protos.SendGroupMessageRequest, {
                ...data,
                data: encodeMsgDataPB(data.type, data.data)
            });
        },
        decodeResponse: protos.SendGroupMessageResponse
    },

    // message notify
    'MsgNtf': {
        async decodeResponse(bytes) {
            const webNtf = decodeProto(protos.WebNotifyPB, bytes);
            return await decodeWebNotifyInnerPB(webNtf);
        }
    },

    'UserActiveStatusChangeNtf':{
        decodeResponse: protos.UserActiveStatusChangeNotify
    },

    // group
    'grpproxy.createGroup': {
        encodeRequest: protos.CreateGroupRequest,
        decodeResponse: protos.CreateGroupResponse
    },
    'grpproxy.getGroupInfo': {
        encodeRequest: protos.GetGroupInfoRequest,
        decodeResponse: protos.GetGroupInfoResponse
    },
    'grpproxy.addGroupUser': {
        encodeRequest: protos.AddGroupUserRequest,
        decodeResponse: protos.AddGroupUserResponse
    },
    'grpproxy.removeUser': {
        encodeRequest: protos.RemoveUserRequest,
        decodeResponse: protos.RemoveUserResponse
    },
    'grpproxy.groupRename': {
        encodeRequest: protos.GroupRenameRequest,
        decodeResponse: protos.GroupRenameResponse
    },
    'grpproxy.updateGroupAvatar': {
        encodeRequest: protos.UpdateGroupAvatarRequest,
        decodeResponse: protos.UpdateGroupAvatarResponse
    },
    'grpproxy.markSilent': {
        encodeRequest: protos.MarkSilentRequest,
        decodeResponse: protos.MarkSilentResponse
    },
    'grpproxy.setManager': {
        encodeRequest: protos.SetManagerRequest,
        decodeResponse: protos.SetManagerResponse
    },

    'grpproxy.markGroupRead': {
        encodeRequest: protos.MarkGroupReadRequest,
        decodeResponse: protos.MarkGroupReadResponse
    },



    //获取好友UID
    'friendsproxy.getFriendList':{
        encodeRequest: protos.GetFriendListRequest,
        decodeResponse: protos.GetFriendListResponse
    },

    //获取BlockList
    'friendsproxy.getBlockList':{
        encodeRequest: protos.GetBlockListRequest,
        decodeResponse: protos.GetBlockListResponse
    },


    //根据号码获取用户信息
    'friendsproxy.getMatchUsers':{

        encodeRequest: function (data) {//protos.GetMatchUsersRequest,
            var GetMatchUserParamBytes = encodeProto(protos.GetMatchUserParam, data.data);
            return encodeProto(protos.GetMatchUsersRequest, {
                ...data,
                data: GetMatchUserParamBytes
            });
        },

        decodeResponse: function (data) {//protos.GetMatchUsersResponse
            var result = decodeProto(protos.GetMatchUsersResponse, data);
            var matchUserListPBBytes = result.data;
            var matchUserListPBObject = decodeProto(protos.MatchUserListPB, matchUserListPBBytes);
            result.data = matchUserListPBObject;
            return result;
        }

    },

    //获取好友的账号信息
    'accountproxy.getSimpleBabaAccountList':{
        encodeRequest: protos.GetSimpleBabaAccountListRequest,
        decodeResponse: protos.GetSimpleBabaAccountListResponse
    },


    // 离线事件
    'webnotifyproxy.ackWebNotify': {
        encodeRequest: protos.AckWebNotifyRequest,
        decodeResponse: protos.AckWebNotifyResponse
    },
    'webnotifyproxy.syncWebNotify': {
        encodeRequest: protos.SyncWebNotifyRequest,
        async decodeResponse(bytes) {
            const responseData = decodeProto(protos.SyncWebNotifyResponse, bytes),
                webNotifies = responseData.notify;
            for (let i = 0, len = webNotifies.length; i < len; i++) {
                await decodeWebNotifyInnerPB(webNotifies[i]);
            }
            return responseData;
        }
    },


    //批量获取用户LastSeen状态
    'useractiveproxy.getBatchUserLastSeen':{
        encodeRequest: protos.GetBatchUserLastSeenRequest,
        decodeResponse: protos.GetBatchUserLastSeenResponse
    }

});
