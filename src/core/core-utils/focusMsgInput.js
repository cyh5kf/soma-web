import gGlobalEventBus,{GLOBAL_EVENTS} from '../dispatcher/GlobalEventBus';
import $ from 'webpack-zepto';

function focusMsgInput(args){
    gGlobalEventBus.emit(GLOBAL_EVENTS.FOCUS_MSG_INPUT, args);
}
//让光标聚焦到输入框
export default focusMsgInput;




export function focusMsgInputIfNotInAction(rootDom){
    $(rootDom).on('click',function(e){
        var target = e.target;
        var $target = $(target);
        var $actionable = $target.closest('.ActionArea');
        var isInput = $target.is('input');
        var isActionArea = $target.is('.ActionArea');
        if(isInput || isActionArea){
            //do nothing
        }

        else if($actionable && $actionable.length > 0){
            var isAutoFocusInput = $target.is('.AutoFocusInput');
            var $AutoFocusInput = $target.closest('.AutoFocusInput');
            if(($AutoFocusInput && $AutoFocusInput.length > 0) || isAutoFocusInput){
                focusMsgInput();
            }else {
                //do nothing
            }

        }else {
            focusMsgInput();
        }
    });
}