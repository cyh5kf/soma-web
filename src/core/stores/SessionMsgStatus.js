function getMsgIdStatusMap(that, sessionId) {
    var sessionId_msgId_status_map = that.sessionId_msgId_status_map;
    var msgId_status_map = sessionId_msgId_status_map[sessionId];
    if (!msgId_status_map) {
        msgId_status_map = {};
        sessionId_msgId_status_map[sessionId] = msgId_status_map;
    }
    return msgId_status_map;
}

class SessionMsgStatus {
    constructor() {
        this.sessionId_msgId_status_map = {};
    }

    setMsgStatus(sessionId, msgId, status) {
        var that = this;
        var msgId_status_map = getMsgIdStatusMap(that, sessionId);
        msgId_status_map[msgId] = status;
    }

    setMsgStatusIfLess(sessionId, msgId, status) {
        var oldStatus = this.getMsgStatus(sessionId, msgId);
        if (typeof oldStatus === 'number') {
            if (oldStatus < status) {
                this.setMsgStatus(sessionId, msgId, status);
            }
        } else {
            this.setMsgStatus(sessionId, msgId, status);
        }
    }

    getMsgStatus(sessionId, msgId) {
        var that = this;
        var msgId_status_map = getMsgIdStatusMap(that, sessionId);
        return msgId_status_map[msgId];
    }

    deleteMsgStatus(sessionId, msgId) {
        var that = this;
        var msgId_status_map = getMsgIdStatusMap(that, sessionId);
        delete msgId_status_map[msgId];
    }

}


export default new SessionMsgStatus();