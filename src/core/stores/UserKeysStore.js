import EventBus from '../../utils/EventBus';
import binaryUtils from '../../utils/binaryUtils';
import LoginStore from './LoginStore';

class UserKeysStore extends EventBus {
    constructor() {
        super(...arguments);
        this.clear();
    }

    clear() {
        this._userKeyMap = {};
        this._eccPkToAesKeyMap = {};
    }

    updateUserKeys(userKeys/**@type UserKeyListSchema*/) {
        userKeys.forEach(userKey => {
            this._userKeyMap[userKey.uid] = userKey;
        });
    }

    getUserKey(uid) {
        return this._userKeyMap[uid];
    }

    getAesKeyByPublicKey(publicKey) {
        const ecc = LoginStore.getEcc(),
            pkStr = binaryUtils.arrayToString(publicKey);
        if (!this._eccPkToAesKeyMap[pkStr]) {
            this._eccPkToAesKeyMap[pkStr] = ecc.deriveShareKey(publicKey);
        }
        return this._eccPkToAesKeyMap[pkStr];
    }
}

export default new UserKeysStore();
