import React, {PropTypes} from 'react';

import './Button.less';

export default class Button extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        loading: PropTypes.bool,
        children: PropTypes.node,
        onClick:PropTypes.func
    };

    static defaultProps = {
        className: 'button-simple',
        loading: false,
        onClick:function(){}
    };

    render() {
        //{loading && <Loading delay={0}/>}
        const {className, children,onClick} = this.props;
        return (
            <button className={`soma-btn button ${className}`} onClick={onClick}>
                {children}
            </button>
        );
    }
}
