import {compile, compileEnum, compileAnyOf} from '../../utils/schema';
import {UserAccountListSchema} from './UserAccountSchemas';
import {MessageSchema} from './MessageSchemas';
import {WebSessionType} from '../protos/protos';

const SessionCommonSrc = {
    sessionId: 'string', // 单聊: 对方uid; 群聊: gid
    sessionType: 'number', // protos.WebSessionType
    sessionName: 'string',
    sessionLogo: 'string',

    unreadMsgCount: 'number',
    lastMessage: MessageSchema,

    __options: {
        notRequired: ['lastMessage']
    }
};

const GroupSessionCommonSrc = {
    sessionType: compileEnum([WebSessionType.WEB_SESSION_TYPE_GROUP]),
    memberCount: 'number',
    isDetailPulled: 'boolean',
    notInGroup: 'boolean' // 自己不在群内
};

export const SessionSchema = compileAnyOf([
    compile({
        ...SessionCommonSrc,
        sessionType: compileEnum([WebSessionType.WEB_SESSION_TYPE_P2P])
    }),
    compile({
        ...SessionCommonSrc,
        ...GroupSessionCommonSrc,
        isDetailPulled: compileEnum([false])
    }),
    compile({
        ...SessionCommonSrc,
        ...GroupSessionCommonSrc,
        isDetailPulled: compileEnum([true]),
        members: UserAccountListSchema,
        managerUids: ['string']
    })
]);

export const SessionListSchema = compile([SessionSchema]);
