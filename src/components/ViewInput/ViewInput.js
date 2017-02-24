import React, {PropTypes} from 'react';

import './ViewInput.less';

export default class ViewInput extends React.Component {
    static propTypes = {
        value: PropTypes.string.isRequired,
        onConfirm: PropTypes.func.isRequired,
        maxLength: PropTypes.number
    };

    constructor(props) {
        super(props);
        this.state = {
            isEditing: false,
            isLoading: false,
            editingValue:props.value||''
        };
    }


    doSaveEdit =()=>{
        var that = this;
        that.setState({isEditing: false});
        const {onConfirm} = that.props;
        that.setState({isLoading: true});
        var newValue = that.state.editingValue || '';
        onConfirm(newValue.trim(), function () {
            that.setState({isLoading: false})
        });
    };

    saveEdit = (e)=> {
        if (e.keyCode === 13) {
            this.doSaveEdit();
        }
    };

    onChangeInput = (e)=> {

        var editingValue = e.target.value;
        var maxLength = this.props.maxLength;
        if (maxLength && editingValue.length > maxLength) {
            return;
        }

        this.setState({editingValue: editingValue});

    };

    onBlurInput = ()=> {
        //this.setState({isEditing:false});
        this.doSaveEdit();
    };

    onClickEditBtn = ()=> {
        const {value} = this.props;
        this.setState({isEditing:true,editingValue:value});
    };

    render() {
        const {value} = this.props;
        const {isEditing,isLoading,editingValue} = this.state;
        const that = this;

        if(isEditing){
            return (
                <div className="comp-ViewInput ActionArea isEditing">
                    <input className="list_input" type="text" value={editingValue}
                           onBlur={that.onBlurInput}
                           autoFocus={true} onKeyUp={that.saveEdit}
                           onChange={that.onChangeInput}/>
                </div>
            );
        }

        return (
            <div className="comp-ViewInput ActionArea">
                <span className="list_name">{isLoading?editingValue:value}</span>
                {
                    isLoading?<div className="ic-loading"></div>: <div className="ic-edit" onClick={that.onClickEditBtn} ></div>
                }
            </div>
        );
    }
}
