import React,{PropTypes} from 'react'
import PureRenderComponent from '../../../components/PureRenderComponent';
import './ContactListItem.less';
import './CommonListItem.less';


export default class CommonListItem extends PureRenderComponent {

    render() {
        var {icon,content,onClick,className} = this.props;
        className = className || '';
        return (
            <div className={`CommonListItem ${className}`} onClick={onClick}>
                <div className="itemIcon">
                    {icon}
                </div>
                <div className="itemContent">
                    {content}
                </div>
            </div>
        );
    }

}
