import {compile} from '../../utils/schema';

export const UserKeySchema = compile({
    uid: 'string',
    eccVersion: 'string',
    eccPK: ['number'],
    sharedAesKey: ['number']
});

export const UserKeyListSchema = compile([UserKeySchema]);
