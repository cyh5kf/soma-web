import React, {PropTypes} from 'react';
import './UploadButton.less';

export default class UploadButton extends React.Component {

    static propTypes = {
        accept : PropTypes.string.isRequired,
        className: PropTypes.string.isRequired,
        onSelect: PropTypes.func.isRequired,
        children: PropTypes.element
    };

    static defaultProps = {
        className: ''
    };


    constructor(props) {
        super(props);
        this.state = {
        };
    }


    _onChange=(event)=>{

        if (this.props.onSelect) {
            this.props.onSelect(event);
            setTimeout(()=> {
                var fileSelector = this.refs['fileSelector'];
                fileSelector.value = "";
            }, 10)
        }

    };

    _onClick =()=>{
        var fileSelector = this.refs['fileSelector'];
        fileSelector.click();
    };

    render() {
        var {className,children,accept} = this.props;
        return (
            <div className={`comp-UploadButton ${className}`} onClick={this._onClick}>
                <input ref="fileSelector" className="fileSelector" type="file" onChange={this._onChange} accept={accept} />
                {children}
            </div>
        );
    }
}
