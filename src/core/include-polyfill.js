// 选择性的加载 babel-polyfill
import 'regenerator-runtime/runtime';

// Promise
Promise.prototype.finally = (function () {
    return function promiseFinally(handler) {
        const execHandler = () => {
            try {
                handler();
            } catch (e) {
                setTimeout(() => {
                    throw e;
                }, 0);
            }
        };
        this.then((value) => {
            execHandler();
            return value;
        }, (reason) => {
            execHandler();
            return Promise.reject(reason);
        });

        return Promise.resolve(this);
    }
})();

