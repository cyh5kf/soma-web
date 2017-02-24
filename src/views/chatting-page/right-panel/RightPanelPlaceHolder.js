import React from 'react'
import PureRenderComponent from '../../../components/PureRenderComponent';
import {classNames} from '../../../utils/JSXRenderUtils';
import gGlobalEventBus,{GLOBAL_EVENTS} from '../../../core/dispatcher/GlobalEventBus';
import SessionsStore,{SESSIONS_EVENTS} from '../../../core/stores/SessionsStore';
import './RightPanelPlaceHolder.less';

function createPanelWrapper(panel, isPanelActive, panelKey) {
    return {
        panel: panel,
        isPanelActive: isPanelActive,
        panelKey: panelKey
    }
}

const ANIMATOR_DURATION = 200;

export default class RightPanelPlaceHolder extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            isShow:false,
            panelStack: []
        };
    }

    componentDidMount() {
        this._onPushPanel = this.onPushPanel.bind(this);
        this._onPopPanel = this.onPopPanel.bind(this);
        this._onSelectedSessionChange = this.onSelectedSessionChange.bind(this);
        gGlobalEventBus.addEventListener(GLOBAL_EVENTS.ON_RIGHT_PANEL_PUSH, this._onPushPanel);
        gGlobalEventBus.addEventListener(GLOBAL_EVENTS.ON_RIGHT_PANEL_POP, this._onPopPanel);
        SessionsStore.addEventListener(SESSIONS_EVENTS.SEL_SESSION_CHANGE, this._onSelectedSessionChange)
    }


    componentWillUnmount() {
        gGlobalEventBus.removeEventListener(GLOBAL_EVENTS.ON_RIGHT_PANEL_PUSH, this._onPushPanel);
        gGlobalEventBus.removeEventListener(GLOBAL_EVENTS.ON_RIGHT_PANEL_POP, this._onPopPanel);
        SessionsStore.removeEventListener(SESSIONS_EVENTS.SEL_SESSION_CHANGE, this._onSelectedSessionChange);
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

    calculateShow(nextCount,callback){
        var that = this;
        window.setTimeout(function () {
            that.setState({isShow: nextCount > 0});
            callback && callback();
        }, 0);
    }

    onPushPanel(nextPanel) {
        var that = this;
        var {panelInstance,isSingleton,panelKey} = nextPanel;

        if (isSingleton && that.isPanelInstanceShow(panelKey)) {
            return;
        }

        var panelStack = [].concat(that.state.panelStack);
        panelStack.push(createPanelWrapper(panelInstance, true, panelKey));
        that.setState({panelStack: panelStack});
        this.calculateShow(panelStack.length);
    }

    onPopPanel(params) {
        var that = this;
        if (params === 'clearAllPanel') {
            that.setState({panelStack: [],isShow:false});
            return;
        }

        var panelStack = [].concat(that.state.panelStack);
        var topPanel = panelStack[panelStack.length - 1];
        topPanel.isPanelActive = false; //先执行隐藏动画
        that.setState({panelStack: panelStack});

        that.calculateShow(panelStack.length - 1,function(){
            window.setTimeout(function () {
                panelStack = [].concat(that.state.panelStack);
                panelStack.pop();
                that.setState({panelStack: panelStack});
            }, ANIMATOR_DURATION);
        });
    }

    //当选中的会话发生改变
    onSelectedSessionChange() {
        //清除掉右侧所有的Panel
        this.onPopPanel("clearAllPanel");
    }

    render() {

        var that = this;
        var state = that.state;
        var isShow = state.isShow;
        var panelStack = state.panelStack || [];
        return (
            <div className={classNames({"RightPanelPlaceHolder":true,"active":isShow})} >
                <div className="PanelList">
                    {
                        panelStack.map(function (panelWrapper, i) {
                            var style = {
                                "zIndex": (10 + i)
                            };
                            var {panel} = panelWrapper;
                            return (
                                <div className="PanelWrapper" style={style} key={i}>
                                    {panel}
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        );
    }

}