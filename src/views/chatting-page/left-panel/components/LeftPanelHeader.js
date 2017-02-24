import React, {PropTypes} from 'react';
import PureRenderComponent from '../../../../components/PureRenderComponent';
import LeftPanelManager from '../LeftPanelManager';
import './LeftPanelHeader.less';

export default class LeftPanelHeader extends PureRenderComponent {

    static propTypes = {
        title: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);
    }


    onGoBack(){
        LeftPanelManager.popPanel();
    }

    render() {
        var that = this;
        var {title} = that.props;
        return (
            <div className="LeftPanelHeader">
                <div className="title" >
                    <div className="action" onClick={that.onGoBack.bind(that)}></div>
                    <div className="text">{title}</div>
                </div>
            </div>
        );
    }

}