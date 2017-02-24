import {createCommand} from '../../utils/command';
import SocketManager from '../socket/SocketManager';
import LoginStore from '../stores/LoginStore';
import GroupFavoriteStore from '../stores/GroupFavoriteStore';


//添加群组到收藏列表里
export const addGroupToFavoriteCmd = createCommand(function(session) {

    return SocketManager.rpcRequest('accountproxy.addGroupToFavorite', {
        uid: LoginStore.getUserInfo().uid,
        gid: session.sessionId
    }).then(response =>{
        var param = response.param;
        if(param.ret === 0){
            GroupFavoriteStore.addGroupToFavorite(session);
        }

    });

});

//从收藏列表里删除群组
export const removeGroupFromFavoriteCmd = createCommand(function(gid) {

    return SocketManager.rpcRequest('accountproxy.removeGroupFromFavorite', {
        uid: LoginStore.getUserInfo().uid,
        gid: gid
    }).then(response =>{
        var param = response.param;
        if(param.ret === 0){
            GroupFavoriteStore.removeGroupFromFavorite(gid);
        }

    });

});

//获取收藏列表
export const getGroupFavoriteListCmd = createCommand(function() {

    return SocketManager.rpcRequest('accountproxy.getFavoriteGroupList', {
        uid: LoginStore.getUserInfo().uid
    }).then(response =>{
        var param = response.param;
        if(param.ret === 0){
            var favoriteGroup = param.favoriteGroup || [];
            GroupFavoriteStore.onSaveGroupFavoriteList(favoriteGroup);
        }
    });

});