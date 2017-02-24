import React from 'react'
import gGlobalEventBus,{GLOBAL_EVENTS} from '../../../core/dispatcher/GlobalEventBus';
import CreateGroupSession from './CreateGroupSession/CreateGroupSession';
import CreateSingleSession from './CreateSingleSession/CreateSingleSession';
import focusMsgInput from '../../../core/core-utils/focusMsgInput'
import SettingComposer from './Settings/SettingComposer';

function pushPanelInstance(panelInstance,isSingleton,panelKey) {
    gGlobalEventBus.emit(GLOBAL_EVENTS.ON_LEFT_PANEL_PUSH, {panelInstance,isSingleton,panelKey});
}


export const PANEL_KEY = {

    /**
     * 创建单聊会话
     */
    CREATE_SINGLE_SESSION: 1,

    /**
     * 创建群组会话
     */
    CREATE_GROUP_SESSION: 2,

    /**
     * 创建设置
     */
    SETTINGS: 3

};


export default class LeftPanelManager {



    /**
     * 在左侧面板中显示一个Panel
     * @param panelKey
     * @param args
     */
    static pushPanel(panelKey, args) {
        args = args || {};
        if (panelKey === PANEL_KEY.CREATE_SINGLE_SESSION) {
            pushPanelInstance(<CreateSingleSession {...args} />,true,panelKey);
        } else if (panelKey === PANEL_KEY.CREATE_GROUP_SESSION) {
            pushPanelInstance(<CreateGroupSession  {...args} />,true,panelKey);
        } else if (panelKey === PANEL_KEY.SETTINGS) {
            pushPanelInstance(<SettingComposer   {...args} />,true,panelKey);
        }
        else {
            console.error('error panel key ! ', panelKey, args);
        }
    }





    /**
     * 在左侧面板中隐藏当前显示的Panel
     */
    static popPanel() {
        gGlobalEventBus.emit(GLOBAL_EVENTS.ON_LEFT_PANEL_POP, null);
        focusMsgInput();
    }


    /**
     * 在左侧面板中隐藏当前显示的Panel
     */
    static clearAllPanel() {
        gGlobalEventBus.emit(GLOBAL_EVENTS.ON_LEFT_PANEL_POP, 'clearAllPanel');
        focusMsgInput();
    }


}