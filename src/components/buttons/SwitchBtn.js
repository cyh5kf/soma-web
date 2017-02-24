import React,{PropTypes} from 'react'
import {classNames} from '../../utils/JSXRenderUtils';
import './SwitchBtn.less';


/**
 * DEMO : <SwitchBtn isOpen={state.isBlockUser} onClick={that.onClickSwitchBtn.bind(that,'isBlockUser')} />
 */

function SwitchBtn(props){
    var isOpen = props.isOpen;
    var btnClass = classNames({
        "soma-btn":true,
        "switch-btn":true,
        "isOpen":isOpen
    });
    return (
        <div className={btnClass} onClick={props.onClick}>
            <div className="switch-circle"></div>
        </div>
    );
}

SwitchBtn.propTypes = {
    isOpen:PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired
};

export default SwitchBtn;
