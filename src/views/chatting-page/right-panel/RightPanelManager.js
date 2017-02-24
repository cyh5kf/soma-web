import React from 'react'
import gGlobalEventBus,{GLOBAL_EVENTS} from '../../../core/dispatcher/GlobalEventBus';
import ViewSessionInfo from './ViewSessionInfo/ViewSessionInfo';
import ViewGroupInfo from './ViewGroupInfo/ViewGroupInfo';
import ViewGroupInfoAllMember from './ViewGroupInfo/ViewGroupInfoAllMember';

function pushPanelInstance(panelInstance, isSingleton, panelKey) {
    gGlobalEventBus.emit(GLOBAL_EVENTS.ON_RIGHT_PANEL_PUSH, {panelInstance, isSingleton, panelKey});
}


export const RIGHT_PANEL_KEY = {

    /**
     * 查看会话信息
     */
    VIEW_SESSION_INFO: 1,

    /**
     * 查看群聊会话信息
     */
    VIEW_GROUP_INFO: 2,

    /**
     * 查看群聊会话信息_显示所有群成员
     */
    VIEW_GROUP_INFO_ALL_MEMBER: 2.1

};


export default class RightPanelManager {


    /**
     * 在右侧面板中显示一个Panel
     * @param panelKey
     * @param args
     */
    static pushPanel(panelKey, args) {
        args = args || {};
        if (panelKey === RIGHT_PANEL_KEY.VIEW_SESSION_INFO) {
            pushPanelInstance(<ViewSessionInfo {...args} />, true, panelKey);
        }
        else if (panelKey === RIGHT_PANEL_KEY.VIEW_GROUP_INFO) {
            pushPanelInstance(<ViewGroupInfo {...args} />, true, panelKey);
        }
        else if (panelKey === RIGHT_PANEL_KEY.VIEW_GROUP_INFO_ALL_MEMBER) {
            pushPanelInstance(<ViewGroupInfoAllMember {...args} />, true, panelKey);
        }
        else {
            console.error('error panel key ! ', panelKey, args);
        }
    }


    /**
     * 在左侧面板中隐藏当前显示的Panel
     */
    static popPanel() {
        gGlobalEventBus.emit(GLOBAL_EVENTS.ON_RIGHT_PANEL_POP, null);
    }


    /**
     * 在左侧面板中隐藏当前显示的Panel
     */
    static clearAllPanel() {
        gGlobalEventBus.emit(GLOBAL_EVENTS.ON_RIGHT_PANEL_POP, 'clearAllPanel');
    }


}