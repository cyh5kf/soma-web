import React, {PropTypes} from 'react';
import ReactLoading from 'react-loading';
import isNumber from 'lodash/isNumber';

import PureRenderComponent from '../PureRenderComponent';

import './Loading.less';

const toPixel = val => {
    if (isNumber(val) || !val.endsWith('px')) {
        return val.toString() + 'px';
    } else {
        return val;
    }
};

export default class Loading extends PureRenderComponent {
    static propTypes = {
        color: PropTypes.string,
        delay: PropTypes.number,
        type: PropTypes.string, // 可选值: 自定义: blue-circle, 自带: balls, bars, bubbles, cubes, cylon, spin, spinning-bubbles, spokes
        width: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.string
        ]),
        height: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.string
        ]),

        children: PropTypes.node,
        className: PropTypes.string
    };
    static defaultProps = {
        type: 'spokes',
        color: '#BCBEBE',
        delay: 500,
        width: 30,
        height: undefined // = width
    };

    componentWillMount() {
        const {delay} = this.props;
        if (delay) {
            this.setState({delayed: true});
            this._timer = setTimeout(() => {
                this.setState({delayed: false});
            }, delay);
        } else {
            this.setState({
                delay: false
            });
        }
    }

    componentWillUnmount() {
        this._timer && clearTimeout(this._timer);
    }

    render() {
        const {children, className, width, height = width, type} = this.props,
            {delayed} = this.state;
        return (
            <div className={`loading-indicator ${delayed ? 'delayed' : ''} ${className || ''}`}>
                {type === 'blue-circle' ? <div className="blue-circle-loading" style={{width: toPixel(width), height: toPixel(height)}}></div>
                    : <ReactLoading {...this.props} width={toPixel(width)} height={toPixel(height)} delay={0}/>}
                {children}
            </div>
        );
    }
}
