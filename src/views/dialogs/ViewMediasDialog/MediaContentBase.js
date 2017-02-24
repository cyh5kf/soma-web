import React,{PropTypes} from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
//import BlueLoading from '../../../components/loading/BlueLoading';
//import {hideStyle} from '../../../utils/JSXRenderUtils';
//import ViewMediasHeader  from './ViewMediasHeader';
import WindowUtils from '../../../utils/WindowUtils';
import isString from 'lodash/isString';
import './ViewMediasItem.less';

export default class MediaContentBase extends PureRenderComponent {

    static propTypes = {
        fileUrlOrBlobUrl: PropTypes.string,
        getFileUrlOrBlobUrl: PropTypes.func.isRequired
    };


    getMaxContentSize() {
        var clientWidth = window.document.body.clientWidth;
        var clientHeight = window.document.body.clientHeight;
        var width = clientWidth - 50 - 30 - 20 - 20;
        var height = clientHeight - 60 - 108 - 20;
        return {width, height};
    }

    constructor(props) {
        super(props);
        this.state = {resizeVersion: 0};
    }

    componentDidMount() {
        if (!this.props.fileUrlOrBlobUrl) {
            this.props.getFileUrlOrBlobUrl();
        }

        WindowUtils.onWindowResize(this.onWindowResize);
    }

    componentWillUnmount() {
        if (super.componentWillUnmount) {
            super.componentWillUnmount();
        }
        WindowUtils.offWindowResize(this.onWindowResize);
    }

    onWindowResize = ()=> {
        var resizeVersion = this.state.resizeVersion || 0;
        this.setState({resizeVersion: resizeVersion + 1});
    };

}