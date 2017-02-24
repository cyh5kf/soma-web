import immutable from 'immutable';
import PendingCommandsStore from '../../core/stores/PendingCommandsStore';

const KEY_ANY = '_anyone_';
function isPending(cmd, key = KEY_ANY) {
    if (key !== KEY_ANY) {
        return !!this.getIn([cmd._name, key]);
    } else {
        return this.get(cmd._name).some(pending => pending);
    }
}

const augmentPendingCmds = pendingCmds => {
    pendingCmds.isPending = isPending;
    return pendingCmds;
};

// 暴露 this.state.pendingCmds.isPending(cmd, [cmdKey]) 方法, 用于判断cmd是否进行中
export default cmds => BaseComponent => {
    return class CmdPending extends BaseComponent {
        static displayName = BaseComponent.displayName || BaseComponent.name;

        updatePendingCmds = () => {
            const allPendingCmds = PendingCommandsStore.getPendingCmds();
            let {pendingCmds = immutable.Map()} = this.state || {};
            cmds.forEach(cmd => {
                pendingCmds = pendingCmds.set(cmd._name, allPendingCmds.get(cmd._name) || immutable.Map());
            });
            this.setState({
                pendingCmds: augmentPendingCmds(pendingCmds)
            });
        };

        componentWillMount() {
            if (super.componentWillMount) {
                super.componentWillMount(...arguments);
            }
            this.updatePendingCmds();
            PendingCommandsStore.addEventListener('change', this.updatePendingCmds);
        }

        componentWillUnmount() {
            if (super.componentWillUnmount) {
                super.componentWillUnmount(...arguments);
            }
            PendingCommandsStore.removeEventListener('change', this.updatePendingCmds);
        }
    }
};
