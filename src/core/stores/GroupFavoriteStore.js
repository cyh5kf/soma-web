// import immutable from 'immutable';
import EventBus from '../../utils/EventBus';
import {createImmutableSchemaData, mergeImmutableSchemaData} from '../../utils/schema';
import {GroupFavoriteSchema,GroupFavoriteListSchema} from '../schemas/GroupFavoriteSchemas';
import {ESessionType} from '../protos/protos';
import SocketManager, {SOCKET_EVENTS} from '../socket/SocketManager';
import protos from '../protos/protos';
import SessionsStore from './SessionsStore';
import LoginStore from './LoginStore';

export const GROUP_FAVORITE_EVENTS = {
    GROUP_FAVORITE_STORE_CHANGE:'GROUP_FAVORITE_STORE_CHANGE'
};


/**
 * 用户设置信息
 */
class GroupFavoriteStore extends EventBus {

    constructor() {
        super(...arguments);
        this.clear();
        SocketManager.on(SOCKET_EVENTS.ON_RPC_NOTIFY, this._handleRpcNotify);
    }

    clear(){
        this._groupFavoriteListStore = null;
    }

    onSaveGroupFavoriteList(groupList){
        var groupListData = groupList;
        if (!groupList || groupList.length === 0) {
            groupListData = [];
        }
        this._groupFavoriteListStore = createImmutableSchemaData(GroupFavoriteListSchema,groupListData);
        this.emit(GROUP_FAVORITE_EVENTS.GROUP_FAVORITE_STORE_CHANGE);
    }

    addGroupToFavorite(session){
        var groupFav = {
            gid: session.sessionId,
            name: session.sessionName,
            avatar: session.sessionLogo
        };
        this._groupFavoriteListStore = this._groupFavoriteListStore.push(createImmutableSchemaData(GroupFavoriteSchema,groupFav));
        this.emit(GROUP_FAVORITE_EVENTS.GROUP_FAVORITE_STORE_CHANGE);
    }

    removeGroupFromFavorite(gid){
        this._groupFavoriteListStore = this._groupFavoriteListStore.filterNot(x => (gid.indexOf(x.gid)!==-1)  );
        this.emit(GROUP_FAVORITE_EVENTS.GROUP_FAVORITE_STORE_CHANGE);
    }

    getGroupFavoriteList() {
        return this._groupFavoriteListStore;
    }


    //用户收藏监听推送
    _handleRpcNotify = async rpcMsg => {
        if (rpcMsg.method === 'MsgNtf') {
            const msgNtf = rpcMsg.param.data;
            const sessiontype = msgNtf.sessiontype;
            const SelfNotifyType = protos.SelfNotifyType;

            if (sessiontype === ESessionType.ESessionType_SELF_NOTIFY) {
                const selfNtf = msgNtf.data;
                const gid = selfNtf.request_data.gid;
                switch (selfNtf.notify_type) {
                    case SelfNotifyType.SELF_NOTIFY_TYPE_ADD_GROUP_TO_FAVORITE:  //添加收藏群组
                        var groupInfo = {};
                        var  sessions = SessionsStore.getSessionInfos();
                        sessions.forEach(function (session, i) {
                            if(gid === session.sessionId) {
                                groupInfo = session;
                            }
                        });
                        if(!groupInfo) {
                            const response = await SocketManager.rpcRequest('grpproxy.getGroupInfo', {
                                uid: LoginStore.getUserInfo().uid,
                                gid: gid
                            });
                            groupInfo = response.param.groupFullInfo;
                        }
                        this.addGroupToFavorite(groupInfo);
                        break;
                    case SelfNotifyType.SELF_NOTIFY_TYPE_REMOVE_GROUP_FROM_FAVORITE:  //删除收藏群组
                        this.removeGroupFromFavorite(gid);
                        break;

                }
                this.emit(GROUP_FAVORITE_EVENTS.GROUP_FAVORITE_STORE_CHANGE);


            }
        }
    }


}

export default new GroupFavoriteStore();
