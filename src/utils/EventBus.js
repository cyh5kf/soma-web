import EventEmitter from 'eventemitter2';
import assign from 'lodash/assign';

export const COMMON_EVENTS = {
    ON_CHANGE: 'change'
};

export default class EventBus {
    maxListeners = 30

    constructor(props) {
        assign(this, props);
        this._emitter = new EventEmitter({
            wildcard: true,
            maxListeners: this.maxListeners
        });
    }

    emit(eventName, message) {
        this._emitter.emit(eventName, message);
    }

    emitChange(message) {
        this.emit(COMMON_EVENTS.ON_CHANGE, message);
    }

    on(eventName, callback) {
        this._emitter.on(eventName, callback);
    }

    off(eventName, callback) {
        this._emitter.off(eventName, callback);
    }

    once(eventName, callback) {
        this._emitter.once(eventName, callback);
    }

    addEventListener(eventName, callback) {
        this._emitter.on(eventName, callback);
    }

    removeEventListener(eventName, callback) {
        this._emitter.off(eventName, callback);
    }

    hasEvent(eventName) {
        return this._emitter.listeners(eventName).length > 0;
    }
}

export function createEventBus(spec = {}) {
    return new EventBus(spec);
}
