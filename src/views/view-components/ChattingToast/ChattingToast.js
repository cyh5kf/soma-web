import React, {PropTypes} from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import './ChattingToast.less';


export default class ChattingToast extends PureRenderComponent {

    constructor(props) {
        super(props);
        this.state = {
            isViewToast: "",
            isHide: ""
        };
    }

    componentDidMount() {
        let that = this;
        setTimeout(function () {
            that.close();
        }, 3000)
    }

    close(){
        this.setState({isViewToast: "closeToast"});
        var that = this;
        setTimeout(function () {
            that.setState({isHide: "hide"});
        }, 1500);
    }

    render() {
        var {locale} = this.props;
        var {isViewToast, isHide} = this.state;

        return (
            <div className={`chatting-toast ${isViewToast} ${isHide}`}>
                <div className="toast-content">
                    <div className="warn-icon"></div>
                    <p className="toast-text">For a greater experience, we recommend using the Google Chrome browser to access SOMA Web.</p>
                </div>
                <div className="close-icon" onClick={this.close.bind(this)}></div>
            </div>
        );
    }

}
