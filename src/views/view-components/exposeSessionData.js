import isEmpty from 'lodash/isEmpty';
import warning from '../../utils/warning';
import SessionsStore, {SINGLE_SESSION_EVENTS} from '../../core/stores/SessionsStore';
import {WebSessionType} from '../../core/protos/protos';
import {queryGroupInfoCmd} from '../../core/commands/SessionsCommands';

// 导出会话相关数据
// 要求 props: sessionId
export default ({sessionInfo = false, messages = false}) => BaseComponent => {
    const displayName = BaseComponent.displayName || BaseComponent.name;
    if (!BaseComponent.propTypes.sessionId) {
        warning(`ExposeChannelData: 目标对象 ${displayName} 并未定义 sessionId props!`);
    }

    return class ExposeChannelData extends BaseComponent {
        static displayName = displayName;

        _updateSessionData(sessionId) {
            const session = sessionId && SessionsStore.getSession(sessionId),
                newState = {};
            if (sessionInfo) {
                newState.sessionInfo = session && session.sessionInfo || null;
                if (newState.sessionInfo && newState.sessionInfo.sessionType === WebSessionType.WEB_SESSION_TYPE_GROUP && !newState.sessionInfo.isDetailPulled) {
                    !queryGroupInfoCmd.isPending(sessionId) && queryGroupInfoCmd(sessionId);
                }
            }
            if (messages) {
                newState.messages = session && session.messages || null;
            }

            if (!isEmpty(newState)) {
                this.setState(newState);
            }
        }

        _handleSingleSessionDataChange = ({sessionId}) => {
            if (this.props.sessionId === sessionId) {
                this._updateSessionData(sessionId);
            }
        }

        componentWillReceiveProps(nextProps) {
            if (super.componentWillReceiveProps) {
                super.componentWillReceiveProps(...arguments);
            }
            if (nextProps.sessionId !== this.props.sessionId) {
                this._updateSessionData(nextProps.sessionId);
            }
        }

        componentWillMount() {
            if (super.componentWillMount) {
                super.componentWillMount(...arguments);
            }

            this._updateSessionData(this.props.sessionId);
            SessionsStore.on(SINGLE_SESSION_EVENTS.SESSION_INFO_CHANGE, this._handleSingleSessionDataChange);
            SessionsStore.on(SINGLE_SESSION_EVENTS.MESSAGES_CHANGE, this._handleSingleSessionDataChange);
        }

        componentWillUnmount() {
            if (super.componentWillUnmount) {
                super.componentWillUnmount(...arguments);
            }

            SessionsStore.off(SINGLE_SESSION_EVENTS.SESSION_INFO_CHANGE, this._handleSingleSessionDataChange);
            SessionsStore.off(SINGLE_SESSION_EVENTS.MESSAGES_CHANGE, this._handleSingleSessionDataChange);
        }

    }
}
