import React, {PropTypes} from 'react';
import PureRenderComponent from '../PureRenderComponent';

import './BlueLoading.less';

//一个蓝色的Loading
export default class BlueLoading extends PureRenderComponent {

    static propTypes = {
        className: PropTypes.string, //额外定制的样式
        style: PropTypes.object, //额外定制的样式
        size: PropTypes.number
    };

    static defaultProps = {
        className: '',
        size:80,
        style:{}
    };

    render() {
        const {className,size,style} = this.props;

        const mergedStyle = {
            width: size,
            height: size
        };

        Object.assign(mergedStyle, style);

        return (
            <div className={`comp-blue-loading ${className}`} style={mergedStyle}>
            </div>
        );
    }
}
