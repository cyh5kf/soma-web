import forEach from 'lodash/forEach';
import EventBus from '../../utils/EventBus';
import {createImmutableSchemaData,mergeImmutableSchemaData} from '../../utils/schema';
import {getUidFromAnyList} from '../../core/core-utils/UserUtils';
import {FriendAccountListSchema,FriendAccountSchema} from '../schemas/UserAccountSchemas';
import {ESessionType} from '../protos/protos';
import SocketManager, {SOCKET_EVENTS} from '../socket/SocketManager';
import {pushOrMergeElement} from '../../utils/immutableUtils';
import LoginStore from './LoginStore';


export const FRIEND_ACCOUNT_EVENTS = {
    ACCOUNT_LIST_CHANGE: 'ACCOUNT_LIST_CHANGE'
};


var browserLanguage = (navigator.language || navigator.browserLanguage).toLowerCase();
//var isLanguageZh = browserLanguage.indexOf('zh') > -1;
//var isLanguageEn = browserLanguage.indexOf('en') > -1;
var isLanguageAr = browserLanguage.indexOf('ar') > -1;

function isNumber(c) {
    return /[0-9]/.test(c);
}

function isEnglishChar(c) {
    return /[a-zA-Z]/.test(c);
}

function isArChar(c) {
    return /[\u0600-\u06FF]/.test(c);
}

function compareChar(cA, cB) {
    if (cA === cB) {
        return 0;
    }
    if (cB === undefined) {
        return 1;
    }

    if (cA === '+') {
        return -1;
    }
    if (cB === '+') {
        return 1;
    }

    //数字符号放在最前面
    if (isNumber(cA) || isNumber(cB)) {
        return cA.charCodeAt(0) - cB.charCodeAt(0);
    }

    //阿拉伯语,阿拉伯字母表优先
    if (isLanguageAr) {
        //1 0
        if (isArChar(cA) && !isArChar(cB)) {
            return -1;
        }
        //0 1
        if (!isArChar(cA) && isArChar(cB)) {
            return 1;
        }
        //0 0 , 1 1
        return cA.charCodeAt(0) - cB.charCodeAt(0);
    }else {

        //默认,英语/中文,英语字母表优先
        //1 0
        if (isEnglishChar(cA) && !isEnglishChar(cB)) {
            return -1;
        }
        //0 1
        if (!isEnglishChar(cA) && isEnglishChar(cB)) {
            return 1;
        }
        //0 0 , 1 1
        return cA.charCodeAt(0) - cB.charCodeAt(0);

    }

}

function sortFriendAccountList(friendAccountList) {
    if (!friendAccountList) {
        return friendAccountList;
    }

    return friendAccountList.sort(function (a, b) {
        var nameA = a.name || a.uid;//+86123132232323232
        var nameB = b.name || b.uid;//+86123132343423

        if (nameA === nameB) {
            return 0;
        }

        for (var i = 0; i < nameA.length; i++) {
            var cA = nameA[i];
            var cB = nameB[i];
            var mm = compareChar(cA, cB);
            if (mm !== 0) {
                return mm;
            }
        }

        if (nameB.length > nameA.length) {
            return -1;
        }

        return 0;

    });
}


function makeNameFriend(accountList){
    for (var i = 0; i < accountList.length; i++) {
        var accountObject = accountList[i];
        accountObject['nameAsFriend'] = accountObject["name"];
    }
}


function emitChangeEvent(that){
    that.emit(FRIEND_ACCOUNT_EVENTS.ACCOUNT_LIST_CHANGE);
}

class FriendAccountStore extends EventBus {

    constructor() {
        super(...arguments);
        this.clear();
        SocketManager.on(SOCKET_EVENTS.ON_RPC_NOTIFY, this._handleRpcNotify);
    }

    clear(){
        this._friendAccountList = createImmutableSchemaData(FriendAccountListSchema, []);
    }

    onSaveAccountList(accountList) {
        makeNameFriend(accountList);
        this._friendAccountList = createImmutableSchemaData(FriendAccountListSchema, accountList);
        this._sortAndRejectMe();
        emitChangeEvent(this);
    }

    getFriendAccountList() {
        return this._friendAccountList;
    }

    getFrientAccountUidList(){
        return getUidFromAnyList(this._friendAccountList);
    }

    getFriendAccount(uid) {
        return this._friendAccountList.find(friend => friend.uid === uid);
    }

    /**
     * 排除掉一些uid
     * @param uids 普通js数组
     * @returns {*}
     */
    getFriendAccountListWithOut(uids) {
        return this._friendAccountList.filterNot(friend => (uids.indexOf(friend.uid) !== -1));
    }

    _sortAndRejectMe() {
        var myUid = LoginStore.getUid();
        this._friendAccountList = sortFriendAccountList(this._friendAccountList.filterNot(function (friend) {
            return friend.uid === myUid;
        }));
    }


    margeFriendAccount(newFriendAccountList){

        makeNameFriend(newFriendAccountList);

        var _friendAccountList = this._friendAccountList;

        var createFunction = function (obj) {
            return createImmutableSchemaData(FriendAccountSchema, obj);
        };
        var mergeFunction = function (oldObject, addObject) {
            return mergeImmutableSchemaData(FriendAccountSchema, oldObject, addObject);
        };

        this._friendAccountList = pushOrMergeElement(_friendAccountList, newFriendAccountList, 'uid', mergeFunction, createFunction);
        return this._friendAccountList;
    }

    _handleRpcNotify = async rpcMsg => {
        if (rpcMsg.method === 'MsgNtf') {
            const msgNtf = rpcMsg.param.data;
            const sessiontype = msgNtf.sessiontype;

            //好友相关消息
            if (sessiontype === ESessionType.ESessionType_FriendMsg) {
                const contactNtf = msgNtf.data;
                const {matchUser,deleteUser} = contactNtf;

                //删除的好友
                if (deleteUser) {
                    this._friendAccountList = this._friendAccountList.filterNot(function (account) {
                        return deleteUser === account.uid;
                    });
                    this._sortAndRejectMe();
                    emitChangeEvent(this);
                }

                //新增的好友
                if (matchUser && matchUser.length > 0) {
                    this._friendAccountList = this.margeFriendAccount(matchUser);
                    this._sortAndRejectMe();
                    emitChangeEvent(this);
                }
            }
        }
    }
}

export default new FriendAccountStore();
