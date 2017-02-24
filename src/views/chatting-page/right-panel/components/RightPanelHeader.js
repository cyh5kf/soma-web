import React, {PropTypes} from 'react';
import focusMsgInput from '../../../../core/core-utils/focusMsgInput';
import PureRenderComponent from '../../../../components/PureRenderComponent';
import RightPanelManager from '../RightPanelManager';
import './RightPanelHeader.less';

export default class RightPanelHeader extends PureRenderComponent {

    static propTypes = {
        title: PropTypes.string.isRequired,
        icon: PropTypes.string
    };

    constructor(props) {
        super(props);
    }


    onClickContactItem = ()=> {
        RightPanelManager.popPanel();
        focusMsgInput();
    };

    render() {
        var that = this;
        var {title,icon,children} = that.props;
        var iconClassName = icon === 'back' ? 'ic_back_white' : 'ic_delete_white';
        return (
            <div className="RightPanelHeader">
                <div className="close" onClick={that.onClickContactItem}>
                    <div className={iconClassName}></div>
                </div>
                <div className="title">{title}</div>
                <div className="children">{children}</div>
            </div>
        );
    }

}