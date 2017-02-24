import immutable from 'immutable';
import EventBus from '../../utils/EventBus';
import {createImmutableSchemaData,mergeImmutableSchemaData} from '../../utils/schema';
import {forEach} from '../../utils/functions';
import {UserAccountSchema} from '../schemas/UserAccountSchemas';
import {ESessionType} from '../protos/protos';
import SocketManager, {SOCKET_EVENTS} from '../socket/SocketManager';


export const USER_ACCOUNT_EVENTS = {
    USER_ACCOUNT_STORE_CHANGE:'USER_ACCOUNT_STORE_CHANGE'
};


/**
 * 所有用户信息的合集,包含了所有的好友信息,也包含了一些非好友信息.
 */
class UserAccountStore extends EventBus {

    constructor() {
        super(...arguments);
        this.clear();
        SocketManager.on(SOCKET_EVENTS.ON_RPC_NOTIFY, this._handleRpcNotify);
    }

    clear(){
        this._userAccountStore = {}; //key:uid, value:UserAccountSchema
    }

    onSaveUserAccountList(userAccountList, isMyFriend = false) {
        if (!userAccountList || userAccountList.length === 0) {
            return;
        }
        var _userAccountStore = this._userAccountStore;
        var changeAccountUidList = [];
        userAccountList.forEach(function (userAccount) {
            var uid = userAccount.uid;

            if (isMyFriend) {
                userAccount['nameAsFriend'] = userAccount['name'];
            }

            var oldUserAccount = _userAccountStore[uid];
            if (oldUserAccount) {
                userAccount['isMyFriend'] = oldUserAccount['isMyFriend'] || isMyFriend;
                _userAccountStore[uid] = mergeImmutableSchemaData(UserAccountSchema, oldUserAccount, userAccount);
            } else {
                userAccount['isMyFriend'] = userAccount['isMyFriend'] || isMyFriend;
                _userAccountStore[uid] = createImmutableSchemaData(UserAccountSchema, userAccount);
            }

            changeAccountUidList.push(uid);
        });

        this.emitChangeEvent(changeAccountUidList);
    }

    //标记某人不是我的好友
    markNotMyFriend(uidList){
        var _userAccountStore = this._userAccountStore;
        var changeAccountUidList = [];
        forEach(uidList, function (uid) {
            var oldUserAccount = _userAccountStore[uid];
            if (oldUserAccount) {
                _userAccountStore[uid] = mergeImmutableSchemaData(UserAccountSchema, oldUserAccount, {
                    isMyFriend: false,
                    nameAsFriend: null
                });
                changeAccountUidList.push(uid);
            }
        });
        this.emitChangeEvent(changeAccountUidList);
    }

    onSaveUserLastSeenKVsList(userLastSeenKVsList) {

        var _userAccountStore = this._userAccountStore || {};

        var changeAccountUidList = [];
        for (var i = 0; i < userLastSeenKVsList.length; i++) {
            var userLastSeen = userLastSeenKVsList[i];
            var uid = userLastSeen['uid'];
            var oldData = _userAccountStore[uid];
            if (oldData) {

                var newData = mergeImmutableSchemaData(UserAccountSchema, oldData, {
                    lastSeenOnline: userLastSeen['online'],
                    lastSeenTime: userLastSeen['lastSeenTime'],
                    lastSeenAllowShow: userLastSeen['allowShow']
                });

                _userAccountStore[uid] = newData;
                if (oldData !== newData) {
                    changeAccountUidList.push(uid);
                }
            }
        }

        this.emitChangeEvent(changeAccountUidList);

    }

    emitChangeEvent(changeAccountUidList){

        if (changeAccountUidList && changeAccountUidList.length > 0) {

            var userAccountStore = this._userAccountStore || {};
            this._userAccountStore = Object.assign({},userAccountStore); //模拟Immutable

            this.emit(USER_ACCOUNT_EVENTS.USER_ACCOUNT_STORE_CHANGE, {
                changeUids: changeAccountUidList,
                userAccounts: userAccountStore
            });
        }
    }

    getUserAccountMap(){
        return this._userAccountStore;
    }

    getUserAccountUidList(){
        return Object.keys(this._userAccountStore || {});
    }

    getUserAccount(uid) {
        return this._userAccountStore[uid];
    }

    getUserAccountList(uids) {
        return immutable.List(uids.map(uid => this.getUserAccount(uid)));
    }

    _handleRpcNotify = (rpcMsg) => {

        if (rpcMsg.method === 'MsgNtf') {
            const msgNtf = rpcMsg.param.data;
            const sessiontype = msgNtf.sessiontype;
            //好友相关消息
            if (sessiontype === ESessionType.ESessionType_FriendMsg) {
                const contactNtf = msgNtf.data;
                const {matchUser,deleteUser} = contactNtf;

                //删除好友
                if (deleteUser) {
                    this.markNotMyFriend([deleteUser]);
                }

                //新增的好友
                if(matchUser && matchUser.length > 0){
                    this.onSaveUserAccountList(matchUser,true);
                }
            }
        }

        if (rpcMsg.method === 'UserActiveStatusChangeNtf') {
            console.log("UserActiveStatusChangeNtf::",rpcMsg);
        }
    }

}

export default new UserAccountStore();
