import {createCommand} from '../../utils/command';
import RecentEmojiStore from '../stores/RecentEmojiStore';

export const saveRecentEmojiListCmd = createCommand(function (data) {
    return new Promise(function(resolve){
        setTimeout(function(){
            RecentEmojiStore.saveRecentEmojiList(data);
            resolve();
        },10);
    });
});