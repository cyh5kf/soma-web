import warning from './warning';

function _setCache(key, val) {
    if (__DEV__ && Object.hasOwnProperty(key)) {
        warning(`_setCache: key (${key}) 已经存在，设置不会生效`);
        return val;
    }
    
    this[key] = val;
    this._cacheKeys.push(key);

    if (this._cacheKeys.size > this._limit) {
        const removedKeys = this._cachedKeys.splice(0, Math.floor(this._limit / 2));
        removedKeys.forEach(removedKey => {
            delete this[removedKey];
        });
    }

    return val;
}

function _getCache(key) {
    return this[key];
}

export function buildCacheManager({limit = 5000} = {}) {
    const cacheManager = {
        _limit: limit,
        _cacheKeys: [],
        set: _setCache,
        get: _getCache
    };

    return cacheManager;
}
