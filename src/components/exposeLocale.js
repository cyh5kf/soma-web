import {createEventBus} from '../utils/EventBus';

function getSlice(obj, keys = []) {
    keys = keys.concat();
    while (keys.length) {
        obj = obj[keys.shift()];
    }
    return obj;
}

const localeEventBus = createEventBus();
const localesMap = {};

export function getLocale(localeType = LocaleTypeApp) {
    const localeData = localesMap[localeType];
    if (!localeData) {
        throw new Error('指定的Locale类型不存在: ' + localeType);
    }
    return localeData;
}

export const LocaleTypeApp = 'appLocale';
export const LocaleTypeAntdCalendar = 'antdCalendarLocale';
export function updateLocale(localeType, localeData) {
    localesMap[localeType] = localeData;
    localeEventBus.emit('change');
}


/**@param {Array.<string>} sliceKeys 指定本地化设置的路径, 示例: ['INDEX', 'enterpriselink']
 * @param {boolean} antdCalendarLocale 是否传递 rc-calendar 的本地化设置*/
export default (sliceKeys = [], {
    antdCalendarLocale = false
} = {}) => BaseComponent => {

    return class ExposeLocale extends BaseComponent {
        static displayName = BaseComponent.displayName || BaseComponent.name;

        initLocale = () => {
            const localeState = {
                locale: getSlice(getLocale(LocaleTypeApp), sliceKeys)
            };
            if (antdCalendarLocale) {
                localeState.antdCalendarLocale = getLocale(LocaleTypeAntdCalendar);
            }
            this.setState(localeState);
        };

        componentWillMount() {
            if (super.componentWillMount) {
                super.componentWillMount(...arguments);
            }
            this.initLocale();
            localeEventBus.addEventListener('change', this.initLocale);
        }

        componentWillUnmount() {
            if (super.componentWillUnmount) {
                super.componentWillUnmount(...arguments);
            }
            localeEventBus.removeEventListener('change', this.initLocale);
        }
    };
}
