import EventBus from '../../utils/EventBus';
import uniq from 'lodash/uniq';
import LoginStore from './LoginStore';

function getLocalStorageKey(uid){
    return "EmojifyResourceRecentEmojiList_" + uid;
}


function getLocalStorageRecentEmoji(uid) {
    var m = localStorage.getItem(getLocalStorageKey(uid));
    if (m && m.length > 0) {
        var oldRecentList = JSON.parse(m);
        return oldRecentList;
    }
    return [];
}

function saveRecentEmojiList(recentEmojiList,uid) {
    recentEmojiList = uniq(recentEmojiList);
    var oldRecentList = getLocalStorageRecentEmoji(uid);
    var newRecentList = recentEmojiList.concat(oldRecentList);
    newRecentList = uniq(newRecentList);
    var newJSONString = JSON.stringify(newRecentList);
    localStorage.setItem(getLocalStorageKey(uid), newJSONString);
    return newRecentList;
}


export const RECENT_EMOJI_EVENTS = {
    CHANGE_RECENT_EMOJI: 'CHANGE_RECENT_EMOJI'
};

function getLoginUserUid(){
    return LoginStore.getUserInfo()['uid'];
}

class RecentEmojiStore extends EventBus {

    constructor() {
        super(...arguments);
        this.clear();
    }

    clear(){
        this._recentEmojiList = null;
    }

    saveRecentEmojiList(recentEmojiList) {
        var uid = getLoginUserUid();
        this._recentEmojiList = saveRecentEmojiList(recentEmojiList,uid);
        this.emit(RECENT_EMOJI_EVENTS.CHANGE_RECENT_EMOJI);
    }

    getRecentEmojiList(){
        if(!this._recentEmojiList){
            var uid = getLoginUserUid();
            this._recentEmojiList = getLocalStorageRecentEmoji(uid) || [];
        }
        return this._recentEmojiList;
    }
}

export default new RecentEmojiStore();
