import immutable from 'immutable';
import {cmdEventBus} from '../../utils/command';
import {createEventBus} from '../../utils/EventBus';

let pendingCmds = immutable.Map();

const PendingCommandsStore = createEventBus({
    getPendingCmds() {
        return pendingCmds;
    },
    updatePendingCmds({cmd, keys, pending}) {
        keys.forEach(key => {
            pendingCmds = pendingCmds.setIn([cmd._name, key], pending);
        });
        this.emit('change');
    }
});

cmdEventBus.addCmdPendingListener(({cmd, keys, pending}) => PendingCommandsStore.updatePendingCmds({cmd, keys, pending}));

export default PendingCommandsStore;
