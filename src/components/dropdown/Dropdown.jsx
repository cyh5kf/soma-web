import React, {PropTypes} from 'react';
import {findDOMNode} from 'react-dom';
import PureRenderComponent from '../PureRenderComponent';
import Popper from '../popper/Popper';
import warning from '../../utils/warning';

// 提供一个按钮, 点击时弹出指定弹出框
export default class Dropdown extends PureRenderComponent {

    static propTypes = {
        anchorElement: PropTypes.node,
        children: PropTypes.node.isRequired, // popover content
        popoverPlacement: Popper.propTypes.placement,
        opacityStyle:PropTypes.bool,
        onSelect: PropTypes.func, // 传递弹出框的 onSelect 函数 (如果有), 并在触发时关闭弹出框
        onMouseEnter: PropTypes.func,
        onMouseLeave: PropTypes.func,
        className: PropTypes.string,
        poperClassName: PropTypes.string
    }
    static defaultProps = {
        placement: Popper.defaultProps.placement
    }

    getPopperTarget = () => findDOMNode(this)

    handlePopperRootClose = () => this.setState({showPopper: false})

    handleAnchorClick = () => {
        this.setState({
            showPopper: !this.state.showPopper
        });
        //this.props.parent.OpenOpacity();
    };

    handlePopperOnSelect = (...args) => {
        this.props.onSelect(...args);
        this.setState({
            showPopper: false
        });
    };

    setShowPopper = (showPopper)=> {
        this.setState({showPopper: showPopper});
    };


    componentWillMount() {
        this.setState({
            showPopper: false
        });
    }

    onMouseEnter=()=>{
        var onMouseEnter = this.props.onMouseEnter;
        onMouseEnter && onMouseEnter();
    };

    onMouseLeave=()=>{
      var onMouseLeave = this.props.onMouseLeave;
        onMouseLeave && onMouseLeave();
    };

    render() {
        let {anchorElement, popoverPlacement, children, onSelect, className = '', opacityStyle,poperClassName} = this.props,
            {showPopper} = this.state;
        if(showPopper === false) {
            opacityStyle = false;
        }
        if (onSelect) {
            children = React.Children.map(children, child => {
                if (__DEV__ && child.props.onSelect && child.props.onSelect !== child.type.defaultProps.onSelect) {
                    warning('Dropdown: 子组件已有 onSelect 属性, 将被覆盖!');
                }
                return React.cloneElement(child, {
                    onSelect: this.handlePopperOnSelect
                });
            });
        }

        return (
            <div className={`eim-dropdown ${className} ${showPopper ? 'open' : ''}`} style={opacityStyle? {opacity: 0.2}: {}}  onClick={this.handleAnchorClick}>
                {anchorElement}

                {showPopper && (
                    <Popper target={this.getPopperTarget}
                            onMouseEnter={this.onMouseEnter}
                            onMouseLeave={this.onMouseLeave}
                            className={poperClassName||''}
                            placement={popoverPlacement}
                            onRootClose={this.handlePopperRootClose} >
                        {children}
                    </Popper>
                )}
            </div>
        );
    }
}
