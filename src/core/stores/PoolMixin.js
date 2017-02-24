import StorageType from '../enums/EnumStorageType';

const sessionStorage = window.sessionStorage;
const localStorage = window.localStorage;
const PoolMixin =  {
    get: function(key, type) {
        if (type === StorageType.SESSION) {
            return sessionStorage.getItem(key);
        } else {
            return localStorage.getItem(key);
        }

    },
    set: function(key, value, type) {
        if (type === StorageType.SESSION) {
            sessionStorage.setItem(key, value);
        } else {
            localStorage.setItem(key, value);
        }
    },
    clean: function(type) {
        if (type === StorageType.SESSION) {
            sessionStorage.clear();
        } else {
            localStorage.clear();
        }
    },
    remove: function(key, type) {
        if (type === StorageType.SESSION) {
            sessionStorage.removeItem(key);
        } else {
            localStorage.removeItem(key);
        }
    },

    getJsonObject:function(key, type){
        var data = PoolMixin.get(key,type);
        if(data && data.length>0){
            return JSON.parse(data);
        }
        return null;
    },

    setJsonObject(key, value, type){
        var data = JSON.stringify(value);
        PoolMixin.set(key,data,type);
    }
};

export default PoolMixin;
