import EventBus from './../../utils/EventBus';

var GlobalEventBus = new EventBus();

export const GLOBAL_EVENTS = {
    ON_LEFT_PANEL_PUSH: 'ON_LEFT_PANEL_PUSH',
    ON_LEFT_PANEL_POP: 'ON_LEFT_PANEL_POP',
    ON_RIGHT_PANEL_PUSH: 'ON_RIGHT_PANEL_PUSH',
    ON_RIGHT_PANEL_POP: 'ON_RIGHT_PANEL_POP',
    FOCUS_MSG_INPUT:'FOCUS_MSG_INPUT'
};

export default GlobalEventBus;