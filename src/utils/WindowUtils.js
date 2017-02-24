import debounce from 'lodash/debounce'
import EventBus from './EventBus';

const EVENT_WINDOW_RESIZE = 'EVENT_WINDOW_RESIZE';
class WindowUtils{
    constructor() {
        var eventBus = this.eventBus = new EventBus();
        window.onresize = debounce(function(){
            eventBus.emit(EVENT_WINDOW_RESIZE);
        }, 300);
    }

    onWindowResize(listener){
        this.eventBus.on(EVENT_WINDOW_RESIZE,listener);
    }

    offWindowResize(listener){
        this.eventBus.off(EVENT_WINDOW_RESIZE,listener);
    }
}


export default new WindowUtils();
