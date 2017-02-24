import React, { PropTypes } from 'react';
import {findDOMNode} from 'react-dom';
import RawPopper from 'popper.js';
import RootCloseWrapper from 'react-overlays/lib/RootCloseWrapper';
import PureRenderComponent from '../PureRenderComponent';
import RenderToBody from '../RenderToBody';

import './Popper.less';

const PLACEMENT_BASE = ['top', 'bottom', 'left', 'right'],
    PLACEMENT_EXTRA = ['start', 'end'],
    AVAILABLE_PLACEMENTS = PLACEMENT_BASE.reduce((result, placementBase) => {
        result.push(placementBase);
        PLACEMENT_EXTRA.forEach(placementExtra => result.push(placementBase + '-' + placementExtra));
        return result;
    }, []);

// 可定位的弹出框
export default class Popper extends PureRenderComponent {
    static propTypes = {
        className: PropTypes.string,
        placement: PropTypes.oneOf(AVAILABLE_PLACEMENTS), // 'top/bottom/left/right' + '/-start/-end'
        target: PropTypes.func.isRequired,
        children: PropTypes.node.isRequired,
        onRootClose: PropTypes.func, // 点击弹窗以外的区域时触发, 同 react-bootstrap Overlay.rootClose
        onMouseEnter: PropTypes.func,
        onMouseLeave: PropTypes.func
    };

    static defaultProps = {
        placement: 'bottom-start'
    };

    constructor(props) {
        super(props);
        this.state = {};
    }

    handleWheelCapture = e => {
        // 弹框时阻止其他地方的滚动
        const popperNode = findDOMNode(this.refs['popper']);
        if (popperNode && !popperNode.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    componentDidMount() {
        const {target} = this.props;
        this.popper = new RawPopper(target(), findDOMNode(this.refs['popper']), {
            placement: this.props.placement || 'bottom-start',
            // 移除 applyStyle 禁用样式应用
            // 移除 keepTogether 组织弹出框与ref定位节点同步导致溢出界面
            modifiersIgnored: ['applyStyle', 'keepTogether']
        });
        this.popper.onUpdate(data => {
            this.setState({data});
        });

        window.addEventListener('wheel', this.handleWheelCapture, true);
    }

    componentWillUnmount() {
        this.popper && this.popper.destroy();
        this.raf && window.cancelAnimationFrame(this.raf);
        window.removeEventListener('wheel', this.handleWheelCapture);
    }

    getPopperStyle(data) {
        if (!data) { return {}; }
        const left = Math.round(data.offsets.popper.left);
        const top = Math.round(data.offsets.popper.top);
        return {
            position: data.offsets.popper.position,
            top: `${top}px`,
            left: `${left}px`
        };
    }

    getTransformOrigin(placement) {
        let transformOriginX = null,
            transformOriginY = null;
        const placementMap = placement.split('-').reduce((result, pl) => {
            result[pl] = true;
            return result;
        }, {});
        if (placementMap['top'] || placementMap['bottom']) {
            transformOriginX = placementMap['start'] ? 'left' : (placementMap['end'] ? 'right' : 'center');
            transformOriginY = placementMap['top'] ? 'bottom' : 'top';
        } else {
            transformOriginX = placementMap['left'] ? 'right' : 'left';
            transformOriginY = placementMap['start'] ? 'top' : (placementMap['end'] ? 'bottom' : 'center');
        }
        return `${transformOriginX} ${transformOriginY} 0px`;
    }

    onMouseEnter = ()=> {
        var onMouseEnter = this.props.onMouseEnter;
        onMouseEnter && onMouseEnter();
    };

    onMouseLeave = ()=> {
        var onMouseLeave = this.props.onMouseLeave;
        onMouseLeave && onMouseLeave();
    };

    render() {
        const { className = '', children, onRootClose } = this.props,
            {data} = this.state,
            placement = data ? data.placement : this.props.placement;
        const content = (
                <div ref='popper'
                     onMouseEnter={this.onMouseEnter}
                     onMouseLeave={this.onMouseLeave}
                     className={`popper ${className} ${data ? 'style-applied' : ''} ${placement.replace('-', ' ')}`}
                     style={this.getPopperStyle(this.state.data)}>
                    <span className="popper-content" style={{transformOrigin: this.getTransformOrigin(placement)}}>
                        {children}
                    </span>
                </div>
            );
        return (
            <RenderToBody>
                {!onRootClose ? content : <RootCloseWrapper onRootClose={onRootClose}>{content}</RootCloseWrapper>}
            </RenderToBody>
        );
    }
}
