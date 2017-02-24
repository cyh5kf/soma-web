import warning from '../utils/warning';

/**@param {Array.<{key, delay=2000, fromPropKey=null, fromStateKey=null}>} delayedStateConfigs
 * 将prop或state的值延迟设置到另一个state值上
 * 注: 组件初次渲染时延迟的state没有值，请注意考虑此情况
 * 示例: exposeDelayedState([{key: 'delayedOffline', delay: 3000, fromPropKey: 'offline'}]) */
export default (delayedStateConfigs) => BaseComponent => {
    return class ExposeLocale extends BaseComponent {
        static displayName = BaseComponent.displayName || BaseComponent.name;

        _delayedStateMap = {}

        onGetPropsAndState(nextProps, nextState) {
            delayedStateConfigs.forEach(({key, delay = 2000, fromPropKey = null, fromStateKey = null}) => {
                if (__DEV__ && (!key || (!fromPropKey && !fromStateKey) || (fromPropKey && fromStateKey))) {
                    warning(`exposeDelayedState: 配置 ${key} 错误: key必须存在，且 fromPropKey/fromPropKey 参数有且只能有一个`);
                    return;
                }
                const newValue = fromPropKey ? nextProps[fromPropKey] : nextState[fromStateKey],
                    data = this._delayedStateMap[key] = this._delayedStateMap[key] || {};
                if (data.value !== newValue || !data.timer) {
                    data.value = newValue;
                    data.timer && clearTimeout(data.timer);
                    data.timer = setTimeout(() => this.setState({[key]: data.value}), delay);
                }
            });
        }

        componentWillMount() {
            if (super.componentWillMount) {
                super.componentWillMount(...arguments);
            }
            this.onGetPropsAndState(this.props, this.state);
        }

        componentWillUpdate(nextProps, nextState) {
            if (super.componentWillUpdate) {
                super.componentWillUpdate(...arguments);
            }
            this.onGetPropsAndState(nextProps, nextState);
        }
    };
}
