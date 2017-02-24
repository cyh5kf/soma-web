import React from 'react'
import PureRenderComponent from '../../../components/PureRenderComponent';
import LeftPanelWrapper from './components/LeftPanelWrapper';
import {showStyle} from '../../../utils/JSXRenderUtils';
import gGlobalEventBus,{GLOBAL_EVENTS} from '../../../core/dispatcher/GlobalEventBus';
import './LeftPanelPlaceHolder.less';

function createPanelWrapper(panel, isPanelActive) {
    return {
        panel: panel,
        isPanelActive: isPanelActive
    }
}

const ANIMATOR_DURATION = 200;

export default class LeftPanelPlaceHolder extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            panelStack: []
        };
    }

    componentDidMount() {
        this._onPushPanel = this.onPushPanel.bind(this);
        this._onPopPanel = this.onPopPanel.bind(this);
        gGlobalEventBus.addEventListener(GLOBAL_EVENTS.ON_LEFT_PANEL_PUSH, this._onPushPanel);
        gGlobalEventBus.addEventListener(GLOBAL_EVENTS.ON_LEFT_PANEL_POP, this._onPopPanel);
    }

    componentWillUnmount() {
        gGlobalEventBus.removeEventListener(GLOBAL_EVENTS.ON_LEFT_PANEL_PUSH, this._onPushPanel);
        gGlobalEventBus.removeEventListener(GLOBAL_EVENTS.ON_LEFT_PANEL_POP, this._onPopPanel);
    }


    isPanelInstanceShow(panelKey) {
        var panelStack = this.state.panelStack;
        for (var i = 0; i < panelStack.length; i++) {
            var obj = panelStack[i];
            var panelKey1 = obj.panelKey;
            if (panelKey1 === panelKey) {
                return true;
            }
        }
        return false;
    }

    onPushPanel(nextPanel) {
        var that = this;
        var {panelInstance,isSingleton,panelKey} = nextPanel;

        if(isSingleton && that.isPanelInstanceShow(panelKey)){
            return;
        }

        var panelStack = [].concat(that.state.panelStack);
        panelStack.push(createPanelWrapper(panelInstance, true,panelKey));
        that.setState({panelStack: panelStack});
    }

    onPopPanel(params) {
        var that = this;
        if (params === 'clearAllPanel') {
            that.setState({panelStack: []});
            return;
        }

        var panelStack = [].concat(that.state.panelStack);
        var topPanel = panelStack[panelStack.length - 1];
        topPanel.isPanelActive = false; //先执行隐藏动画
        that.setState({panelStack: panelStack});
        window.setTimeout(function () {
            panelStack = [].concat(that.state.panelStack);
            panelStack.pop();
            that.setState({panelStack: panelStack});
        }, ANIMATOR_DURATION);
    }


    render() {

        var that = this;
        var state = that.state;
        var panelStack = state.panelStack || [];
        var show = panelStack.length > 0;

        return (
            <div className="LeftPanelPlaceHolder" style={showStyle(show)}>
                <div className="PanelList">
                    {
                        panelStack.map(function (panelWrapper, i) {
                            var style = {
                                "zIndex": (10 + i)
                            };
                            var {isPanelActive,panel} = panelWrapper;
                            return (
                                <LeftPanelWrapper className="PanelWrapper"
                                                   activeClassName='active'
                                                   nextActive={isPanelActive}
                                                   style={style}
                                                   key={i}>
                                    {panel}
                                </LeftPanelWrapper>
                            );
                        })
                    }
                </div>
            </div>
        );
    }

}