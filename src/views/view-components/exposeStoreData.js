import isFunction from  'lodash/isFunction';
import {COMMON_EVENTS} from '../../utils/EventBus';

/**
 * Usage:
 *  - exposeStoreData([ [Store, event, handler], [Store, handler](忽略默认'change'事件) ])
 * Example:
    @expose([
        [
            LoginStore,  // store
            'change',    // store event name
            () => {      // listener, 返回state
                return {
                    userInfo: LoginStore.getImmutableUserInfo()
                };
            }
        ]
    ])
 */
export default listenerConfigs => BaseComponent => {
    return class ExposeStoreData extends BaseComponent {
        static displayName = BaseComponent.displayName || BaseComponent.name;

        constructor() {
            super(...arguments);
            this._listenerConfigs = listenerConfigs.map(([store, eventName, handler]) => {
                if (!handler && isFunction(eventName)) {
                    handler = eventName;
                    eventName = COMMON_EVENTS.ON_CHANGE;
                }

                return [
                    store,
                    eventName,
                    () => {
                        const newState = handler();
                        if (newState) {
                            this.setState(newState);
                        }
                    }
                ]
            });
        }

        componentWillMount() {
            if (super.componentWillMount) {
                super.componentWillMount(...arguments);
            }

            this._listenerConfigs.forEach(([store, eventName, handler]) => {
                handler();
                store.addEventListener(eventName, handler);
            });
        }

        componentWillUnmount() {
            if (super.componentWillUnmount) {
                super.componentWillUnmount(...arguments);
            }

            this._listenerConfigs.forEach(([store, eventName, handler]) => {
                store.removeEventListener(eventName, handler);
            });
        }

    }
}
