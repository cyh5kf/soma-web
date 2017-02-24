import {updateLocale, LocaleTypeApp, LocaleTypeAntdCalendar} from './../../components/exposeLocale';
import moment from 'moment';
import find from 'lodash/find';
import defaults from 'lodash/defaults';
import MomentCustomLocale from '../../locales/moment-custom-locale';

// jyf: TODO: 测试用，默认用英文补全其他语言的本地化
import en_US from '../../locales/en';
function applyDefaultLocale(localeObj) {
    defaults(localeObj, en_US.localeSettings);
}

function getLang() {
    return navigator.language || navigator.userLanguage;
}

function getLanguage(_language) {
    const languages = ['ar', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'fa', 'fi', 'fr', 'he', 'hi', 'hr', 'hu',
        'id', 'it', 'ja', 'ko', 'ms', 'nb', 'nl', 'pl', 'pt', 'ro', 'ru', 'sk', 'th', 'tr', 'uk', 'vi', 'zh'];

    const targetLang = ( _language || getLang() ).toLowerCase();

    var getLanguages = () => find(languages, lang => {
        return targetLang.startsWith(lang.toLowerCase());
    });
    
    return getLanguages();
}


function setLocale(_language) {

    var soma_web_language_type = null;

    return new Promise((resolve) => {
        const onLocaleObjLoaded = ({localeSettings, antdCalendarLocale, momentLocaleName}) => {
            setTimeout(function () {
                moment.updateLocale(momentLocaleName, MomentCustomLocale[momentLocaleName]);

                //保留字段
                localeSettings['soma_web_language_type'] = soma_web_language_type;

                window.gLocaleSettings = localeSettings;

                applyDefaultLocale(window.gLocaleSettings);

                updateLocale(LocaleTypeApp, window.gLocaleSettings);
                updateLocale(LocaleTypeAntdCalendar, antdCalendarLocale);

                resolve();
            }, 0);
        };


        soma_web_language_type = getLanguage(_language);

        switch (soma_web_language_type) {
            case 'ar': require(['../../locales/ar'], onLocaleObjLoaded); break;
            case 'ca': require(['../../locales/ca'], onLocaleObjLoaded); break;
            case 'cs': require(['../../locales/cs'], onLocaleObjLoaded); break;
            case 'da': require(['../../locales/da'], onLocaleObjLoaded); break;
            case 'de': require(['../../locales/de'], onLocaleObjLoaded); break;
            case 'el': require(['../../locales/el'], onLocaleObjLoaded); break;
            case 'en': require(['../../locales/en'], onLocaleObjLoaded); break;
            case 'es': require(['../../locales/es'], onLocaleObjLoaded); break;
            case 'fa': require(['../../locales/fa'], onLocaleObjLoaded); break;
            case 'fi': require(['../../locales/fi'], onLocaleObjLoaded); break;
            case 'fr': require(['../../locales/fr'], onLocaleObjLoaded); break;
            case 'he': require(['../../locales/he'], onLocaleObjLoaded); break;
            case 'hi': require(['../../locales/hi'], onLocaleObjLoaded); break;
            case 'hr': require(['../../locales/hr'], onLocaleObjLoaded); break;
            case 'hu': require(['../../locales/hu'], onLocaleObjLoaded); break;
            case 'id': require(['../../locales/id'], onLocaleObjLoaded); break;
            case 'it': require(['../../locales/it'], onLocaleObjLoaded); break;
            case 'ja': require(['../../locales/ja'], onLocaleObjLoaded); break;
            case 'ko': require(['../../locales/ko'], onLocaleObjLoaded); break;
            case 'ms': require(['../../locales/ms'], onLocaleObjLoaded); break;
            case 'nb': require(['../../locales/nb'], onLocaleObjLoaded); break;
            case 'nl': require(['../../locales/nl'], onLocaleObjLoaded); break;
            case 'pl': require(['../../locales/pl'], onLocaleObjLoaded); break;
            case 'pt': require(['../../locales/pt'], onLocaleObjLoaded); break;
            case 'ro': require(['../../locales/ro'], onLocaleObjLoaded); break;
            case 'ru': require(['../../locales/ru'], onLocaleObjLoaded); break;
            case 'sk': require(['../../locales/sk'], onLocaleObjLoaded); break;
            case 'th': require(['../../locales/th'], onLocaleObjLoaded); break;
            case 'tr': require(['../../locales/tr'], onLocaleObjLoaded); break;
            case 'uk': require(['../../locales/uk'], onLocaleObjLoaded); break;
            case 'vi': require(['../../locales/vi'], onLocaleObjLoaded); break;
            case 'zh': require(['../../locales/zh'], onLocaleObjLoaded); break;
            default: require(['../../locales/en'], onLocaleObjLoaded); break;
        }
    });
}

export default {
    load: function(language) {
        //language = 'ar';
        return setLocale(language);
    },
    getLanguage:getLanguage
}
