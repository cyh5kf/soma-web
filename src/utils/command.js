import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import uniqueId from 'lodash/uniqueId';
import some from 'lodash/some';
import {createEventBus} from './EventBus';

const KEY_ANY = '_anyone_';
const defaultGetCmdKey = () => KEY_ANY;

export const cmdEventBus = createEventBus({
    emitCmdPendingChange(cmd, keys, pending) {
        this.emit('pendingChange', {
            cmd,
            keys,
            pending
        });
    },
    addCmdPendingListener(listener) {
        this.addEventListener('pendingChange', listener);
    },
    removeCmdPendingListener(listener) {
        this.removeEventListener('pendingChange', listener);
    }
});

/**
 * 设置命令正在进行中
 * @param {Array.<string>} [keys] 用以区别此命令的不同使用, 比如删除选项时, 选项的id区别了不同选项的删除操作
 * @returns {Function} finished 用以设置该命令已结束的函数
 */
function setPending(keys = [ KEY_ANY ]) {
    keys.forEach(key => {
        this._pendingKeyCounts[key] = (this._pendingKeyCounts[key] || 0) + 1;
    });

    cmdEventBus.emitCmdPendingChange(this, keys, true);

    return () => {
        this.setFinished(keys);
    };
}

function setFinished(keys = [ KEY_ANY ]) {
    const needEmitKeys = [];
    keys.forEach(key => {
        const resultCount = this._pendingKeyCounts[key] - 1;
        if (resultCount <= 0) {
            delete this._pendingKeyCounts[key];
            needEmitKeys.push(key);
        } else {
            this._pendingKeyCounts[key] = resultCount;
        }
    });
    cmdEventBus.emitCmdPendingChange(this, needEmitKeys, false);
}


function isPending(key = KEY_ANY) {
    if (key === KEY_ANY) {
        return some(this._pendingKeyCounts, count => !!count);
    } else {
        return !!this._pendingKeyCounts[key];
    }
}


/**
 * @param {function} fnExec 命令执行函数
 * @param {string} [name] 命令名称, 可选, 用以debug信息
 * @param {function} [getCmdKey] 可选, 接收与 fnExec 同样的参数, 返回此次cmd调用的key, 用以区分此cmd的其他调用(默认返回相同key)
 * 示例:

// 创建命令
const queryUserCommand = createCommand(function (options) {
    // 如需记录命令"执行中"状态, 需返回 Promise
    return $.ajax('/query_user').then(() => {
        // ...任意操作...

        // 操作完成, 设置命令状态
        finish();
    )};
}, {
    name: 'user.queryUserCommand',
    getCmdKey: options => options.uid
});

// 使用命令
queryUserCommand({uid: '123'});

// 查看命令是否进行中
queryUserCommand.isPending(); // 查看命令是否有任一调用进行中
queryUserCommand.isPending('123'); // 查看key为'123'的命令调用是否进行中

 */
export function createCommand(fnExec, {name = uniqueId('cmd_'), getCmdKey = defaultGetCmdKey} = {}) {
    function command() {
        //console.log('#CMD: ', command._name, '#Args: ', [options]);
        const result = fnExec.apply(this, arguments);

        if (result && isFunction(result.then)) { // 对 Promise 记录命令执行中状态
            const cmdKey = getCmdKey(...arguments);
            const finish = command.setPending(isArray(cmdKey) ? cmdKey : [ cmdKey ]);
            return Promise.resolve(result).finally(finish);
        } else {
            return Promise.resolve(result);
        }
    }

    command._name = uniqueId('cmd_');

    command._pendingKeyCounts = {};
    command.setPending = setPending;
    command.setFinished = setFinished;
    command.isPending = isPending;

    return command;
}
