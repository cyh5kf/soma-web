import React from 'react';
import ReactDOM from 'react-dom';
import {classNames} from '../../utils/JSXRenderUtils';
import RenderToBody from '../RenderToBody';
import Animator from '../AnimatorInAndOut';
import LocaleConfig from '../../core/locale-config/LocaleConfig';
//import {showAlert, removeAllAlerts} from '../popups/alert';
//import EnumKeyCode from '../../utils/enums/EnumKeyCode';
import warning from '../../utils/warning';

import './dialog.less';

export default class Dialog extends React.Component {

    constructor(props) {
        super(...arguments);
        this.state = {show:props.defaultShow};
    }

    static propTypes = {
        name: React.PropTypes.string,
        title: React.PropTypes.string,
        desc: React.PropTypes.string,
        cancelLabel: React.PropTypes.string,
        confirmLabel: React.PropTypes.string,
        className: React.PropTypes.string,
        defaultShow: React.PropTypes.bool,
        onClose: React.PropTypes.func,
        children: React.PropTypes.node,
        closeOnESC: React.PropTypes.bool,
        closeOnMaskClick: React.PropTypes.bool,
        hiddenHeader: React.PropTypes.bool,
        hiddenFooter: React.PropTypes.bool
    };

    static defaultProps = {
        name: '',
        defaultShow: true,
        closeOnESC: true,
        closeOnMaskClick: false
    };

    static openDialog(ClosableComponent, props = {}) {
        const originOnClose = props.onClose;
        let placeholder = document.createElement('span');
        props = {
            ...props,
            onClose: () => {
                originOnClose && originOnClose();
                setTimeout(() => {
                    ReactDOM.unmountComponentAtNode(placeholder);
                    placeholder = null;
                }, 600);
            }
        };

        if (__DEV__) {
            if (!ClosableComponent.propTypes || !ClosableComponent.propTypes.onClose) {
                const _name = ClosableComponent.displayName || ClosableComponent.name || 'anonymous';
                warning(`Dialog.openDialog 传入的Component必须接受"onClose"属性, 但是Component(${_name})并没有显示指定 propTypes.onClose, 请确保正确使用!`);
            }
        }

        ReactDOM.render(<ClosableComponent {...props}/>, placeholder);
    }

    className = '';


    open(){
        this.setState({show:true});
        this.onShow();
    }

    onShow() {
        // 在弹出框显示时调用
    }

    close(){
        this.setState({show:false});
        this.props.onClose && this.props.onClose();
    }

    toggle(){
        if (this.state.show) {
            this.close();
        } else {
            this.open();
        }
    }

    confirm(){

    }

    //onAlert(message, obj){
    //    showAlert(message, obj);
    //}
    //
    //cancelAlert(){
    //    removeAllAlerts();
    //}

    renderHeaderTitle() {
        return this.props.title;
    }

    renderHeader(){
        return <div className={this.props.hiddenHeader?"header hidden":"header"}>
            <div className="eim-deprecated btn_close AutoFocusInput" onClick={this.close.bind(this)}></div>
            <div className="title"><span className="eim-deprecated icon"></span>{this.renderHeaderTitle()}</div>
            <div className={this.props.desc?"session_desc":"hidden"}>{this.props.desc}</div>
        </div>;
    }

    renderCancelLabel() {
        return this.props.cancelLabel;
    }

    renderConfirmLabel() {
        return this.props.confirmLabel;
    }

    renderContent(){
        return this.props.children;
    }

    renderFooter(){
        return <div className="footer-content">
            <input type="button" className="cancel" value={this.renderCancelLabel()} onClick={e => this.close(e)}/>
            <input type="button" className="confirm" value={this.renderConfirmLabel()} onClick={e=>this.confirm(e)}/>
        </div>;
    }

    onDocumentKeyDown = (e) => {
        //if (e.keyCode === EnumKeyCode.ESC && this.state.show) {
        //    this.close();
        //}
    };


    onMaskClick = (e) => {
        var m = this.refs['mask-node'];
        if (this.props.closeOnMaskClick && e.target === m) {
            this.close();
        }
    }

    componentWillMount() {
        if (this.state.show) {
            this.onShow();
        }
        if (this.props.closeOnESC) {
            document.addEventListener('keydown', this.onDocumentKeyDown);
        }
    }

    componentWillUnmount() {
        if (this.props.closeOnESC) {
            document.removeEventListener('keydown', this.onDocumentKeyDown);
        }
    }

    render(){

        var locale = window.gLocaleSettings || {};
        var soma_web_language_type = locale['soma_web_language_type'] || LocaleConfig.getLanguage();


        return (
            <RenderToBody>
                <Animator className={`dialog-animator soma_web_language_${soma_web_language_type}`}>
                    {!!this.state.show && (
                        <span ref="mask-node" className={classNames("dialog-mask",this.props.name,this.props.className,this.className)} onClick={this.onMaskClick}>
                            <div className="ActionArea dialog-entity">
                                {this.renderHeader()}
                                <div className="content">
                                    {this.renderContent()}
                                </div>
                                <div className={this.props.hiddenFooter?"footer hidden":"footer"}>
                                    {this.renderFooter()}
                                </div>
                            </div>
                        </span>
                    )}
                </Animator>
            </RenderToBody>
        );
    }

}
