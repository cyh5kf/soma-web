import EventBus from '../../utils/EventBus';

var isBeta = window.location.hostname.indexOf('beta') >= 0;// "beta.soma.im";
var defaulGroupMaxMembers = isBeta ? 10 : 500;

class SomaConfigStore extends EventBus {

    constructor() {
        super(...arguments);
        this.somaConfig = {
            'group.max.members': defaulGroupMaxMembers
        };
    }

    getGroupMaxMembers() {
        return this.somaConfig['group.max.members'] || defaulGroupMaxMembers;
    }

    onSaveConfig(configs){
        this.somaConfig = configs || {};
    }

}


export default new SomaConfigStore();