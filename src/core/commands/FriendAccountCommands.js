import {createCommand} from '../../utils/command';
import SocketManager from '../socket/SocketManager';
import {getUidFromAnyList} from '../core-utils/UserUtils';
import LoginStore from '../stores/LoginStore';
import FriendAccountStore from '../stores/FriendAccountStore';
import UserAccountStore from '../stores/UserAccountStore';
import map from 'lodash/map';
import _get from 'lodash/get';
import forEach from 'lodash/forEach';
import warning from '../../utils/warning';

export const queryFriendAccountListCmd = createCommand(function () {
    return SocketManager.rpcRequest('friendsproxy.getFriendList', {
        uid: LoginStore.getUserInfo().uid
    }).then(response => {
        var param = response.param;
        if(param.ret ===0){

            var friends = param.friends || [];
            FriendAccountStore.onSaveAccountList(friends);
            UserAccountStore.onSaveUserAccountList(friends, true);

            if (__DEV__ && friends.length === 0) {
                //TODO 后期需要删除
                return getSimpleBabaAccountList(['8618367103559', '423660234575', '8613668688989', '8613676468643','8618899999999'],true).then(()=>{
                    return {
                        friendAccountList: FriendAccountStore.getFriendAccountList(),
                        friendUidList: FriendAccountStore.getFrientAccountUidList()
                    };
                });
            }

            getSimpleBabaAccountList(getUidFromAnyList(friends),false);

            return {
                friendAccountList: FriendAccountStore.getFriendAccountList(),
                friendUidList: FriendAccountStore.getFrientAccountUidList()
            };

        }else {
            warning("friendsproxy.getFriendList,ret = " + param.ret);
        }
    });
});



export const getSimpleBabaAccountList = createCommand(function (friendUids,isMyFriend = false) {
    if (!friendUids || friendUids.length === 0) {
        return Promise.resolve();
    }

    return SocketManager.rpcRequest('accountproxy.getSimpleBabaAccountList', {
        uid: LoginStore.getUserInfo().uid,
        friendUids:friendUids
    }).then(response => {
        var param = response.param;
        if(param.ret ===0){
            var profiles = param.profiles || [];
            if(isMyFriend){
                FriendAccountStore.onSaveAccountList(profiles);
            }
            UserAccountStore.onSaveUserAccountList(profiles,false);
        }else {
            warning("accountproxy.getSimpleBabaAccountList,ret = " + param.ret);
        }
    });
});



export const getMatchUsersCmd = createCommand(function(phoneInfoList){

    //phoneInfoList = map(phoneInfoList, function (info) {
    //    return {
    //        phone: info.phone,
    //        name: info.name,
    //        newAddContact: true
    //    };
    //});

    return SocketManager.rpcRequest('friendsproxy.getMatchUsers', {
        uid: LoginStore.getUserInfo().uid,
        data: {
            phones: phoneInfoList//[{phone:"2332",name:"aaa",newAddContact:true}]
        }
    }).then(response => {

        var matchUserList = _get(response, 'param.data.users', []);

        var userAccountList = [];
        forEach(matchUserList, function (u) {
            if (u && u.user) {
                userAccountList.push(u.user);
            }
        });

        UserAccountStore.onSaveUserAccountList(userAccountList, false);

        return {matchUserList, userAccountList};
    });
});

