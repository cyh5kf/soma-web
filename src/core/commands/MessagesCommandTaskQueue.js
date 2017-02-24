import {TaskQueue} from '../core-utils/TaskQueue';
import LoginStore from '../stores/LoginStore';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import forEach from 'lodash/forEach';
import SocketManager from '../socket/SocketManager';
import {getMaxValueFromList} from '../../utils/functions';


const markGroupSessionReadRequest = function (sessionId, myUid, maxsrvtime) {
    return SocketManager.rpcRequest('grpproxy.markGroupRead', {
        uid: myUid,
        gid: sessionId,
        maxsrvtime: maxsrvtime
    });
};


const markP2PSessionReadRequest = function (sessionId, myUid, maxsrvtime) {
    return SocketManager.rpcRequest('msgproxy2.markP2PRead', {
        uid: myUid,
        peer_uid: sessionId,
        maxsrvtime: maxsrvtime
    });
};


const ackBatchReceivedDelRequest = function (toUidArray,msgIdArray,msgSrvTimeArray) {
    return SocketManager.rpcRequest('msgproxy2.AckBatchReceivedDel', {
        uid: LoginStore.getUserInfo().uid,
        touid: toUidArray,//[toUid],
        msgid: msgIdArray,//[msgId],
        msgsrvtime: msgSrvTimeArray//[msgSrvTimeStr]
    });
};


const LAST_SESSION_MAX_SRV_TIME = {};
const markSessionReadQueueRunner = function (that, requestFunc) {
    var allTask = that.getAllTask(); //[{sessionId, maxMsgSrvTime}]
    if (allTask.length > 0) {
        that.clearTask();
        var sessionId_taskList_map = groupBy(allTask, "sessionId"); //
        var sessionId_maxsrvtime_map = mapValues(sessionId_taskList_map, function (taskList) {
            var maxMsgSrvTime = getMaxValueFromList(taskList, "maxMsgSrvTime", 0);
            return maxMsgSrvTime;
        });
        var myUid = LoginStore.getUserInfo().uid;
        forEach(sessionId_maxsrvtime_map, function (maxMsgSrvTime, sessionId) {
            if (maxMsgSrvTime) {
                if (!LAST_SESSION_MAX_SRV_TIME[sessionId] || LAST_SESSION_MAX_SRV_TIME[sessionId] < maxMsgSrvTime) {
                    requestFunc(sessionId, myUid, '' + maxMsgSrvTime);
                    LAST_SESSION_MAX_SRV_TIME[sessionId] = maxMsgSrvTime;
                }
            }
        });
    }
};


export const markP2PSessionReadTaskQueue = new TaskQueue(function (that) {
    markSessionReadQueueRunner(that, markP2PSessionReadRequest);
}, 1000);


export const markGroupSessionReadTaskQueue = new TaskQueue(function (that) {
    markSessionReadQueueRunner(that, markGroupSessionReadRequest);
}, 1000);


export const msgAckDelCmdTaskQueue = new TaskQueue(function (that) {
    var allTask = that.getAllTask(); //[{msgId, msgSrvTimeStr, toUid}]
    if (allTask.length > 0) {
        that.clearTask();

        var toUidArray = [];
        var msgIdArray = [];
        var msgSrvTimeArray = [];

        forEach(allTask,function({msgId, msgSrvTimeStr, toUid}){
            toUidArray.push(toUid);
            msgIdArray.push(msgId);
            msgSrvTimeArray.push(msgSrvTimeStr);
        });

        ackBatchReceivedDelRequest(toUidArray,msgIdArray,msgSrvTimeArray);
    }
}, 10000);

