import React, {PropTypes} from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import './NoSearchResults.less';


export default class NoSearchResults extends PureRenderComponent {

    render() {
        var {locale} = this.props;
        return (
            <div className="empty-tips">
                <div className="empty-icon"></div>
                <div className="empty-text">{locale['searchnumber.invalidquery']}</div>
            </div>
        )
    }

}
