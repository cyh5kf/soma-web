import isArrayBuffer from 'lodash/isArrayBuffer';
import {createCommand} from '../../utils/command';
import {createImmutableSchemaData} from '../../utils/schema';
import binaryUtils from '../../utils/binaryUtils';
import {UserKeyListSchema} from '../schemas/UserKeysSchemas';
import SocketManager from '../socket/SocketManager';
import LoginStore from '../stores/LoginStore';
import UserKeysStore from '../stores/UserKeysStore';
import UserAccountStore from '../stores/UserAccountStore';

export const updateUserEccKeysCmd = createCommand(function (eccKeyInfos/**@type {Array.<{uid: string, eccPK: ArrayBuffer|Array.<number>, eccVersion: string}>}*/) {
    const ecc = LoginStore.getEcc();
    UserKeysStore.updateUserKeys(createImmutableSchemaData(UserKeyListSchema, eccKeyInfos.map(keyInfo => {
        let {eccPK} = keyInfo;
        eccPK = isArrayBuffer(eccPK) ? binaryUtils.arrayBufferToArray(eccPK) : eccPK;
        return {
            uid: keyInfo.uid,
            eccVersion: keyInfo.eccVersion,
            eccPK: eccPK,
            sharedAesKey: ecc.deriveShareKey(eccPK)
        }
    })));
});

export const refetchUserEccKeysCmd = createCommand(function (uids) {
    return SocketManager.rpcRequest('accountproxy.getBatchUserEcc', {
        uid: LoginStore.getUserInfo().uid,
        touids: uids
    }).then(response => {
        updateUserEccKeysCmd(response.param.userEccPBList.map(userKey => {
            return {
                uid: userKey.uid,
                eccVersion: userKey.version,
                eccPK: userKey.pubkeypem
            };
        }));
    });
});

export const ensureUserEccKeysCmd = createCommand(function (uids) {
    const missingUids = uids.filter(uid => !UserKeysStore.getUserKey(uid));
    return missingUids.length === 0 ? Promise.resolve() : refetchUserEccKeysCmd(missingUids);
});




/**
 * 确保该uid所代表的账户信息已经存在UserAccountStore中.
 */
export const ensureUserAccountsCmd = createCommand(function (uidList,forceRequest = false) {
    uidList = uidList || [];
    uidList = uidList.toJS ? uidList.toJS() : uidList;

    var missingUids = uidList;
    if (!forceRequest) {
        missingUids = uidList.filter(uid => !UserAccountStore.getUserAccount(uid));
        if (missingUids.length === 0) {
            return Promise.resolve();
        }
    }

    return  SocketManager.rpcRequest('accountproxy.getSimpleBabaAccountList', {
        uid: LoginStore.getUserInfo().uid,
        friendUids: missingUids
    }).then(response => {
        var param = response.param;
        if (param.ret === 0) {
            var profiles = param.profiles || [];
            UserAccountStore.onSaveUserAccountList(profiles,false);
        }
        return response;
    }).then((response)=>{
        getBatchUserLastSeenCmd(missingUids);
        return response;
    });

});


export const getBatchUserLastSeenCmd = createCommand(function (targetUids,isSaveStore = true) {

    if (!targetUids || targetUids.length === 0) {
        return Promise.resolve();
    }

    return SocketManager.rpcRequest('useractiveproxy.getBatchUserLastSeen', {
        uid: LoginStore.getUserInfo().uid,
        targetUids: targetUids
    }).then(response => {
        if(isSaveStore){
            var param = response.param;
            if (param.ret === 0) {
                var userLastSeenKVs = param.userLastSeenKVs || [];
                UserAccountStore.onSaveUserLastSeenKVsList(userLastSeenKVs);
            }
        }
        return response;
    });

});


export const updateAllUserLastSeenCmd = createCommand(function () {
    var uidList = UserAccountStore.getUserAccountUidList();
    return getBatchUserLastSeenCmd(uidList);
});