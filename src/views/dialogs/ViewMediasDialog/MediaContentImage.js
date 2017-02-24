import React,{PropTypes} from 'react';
import MediaContentBase from './MediaContentBase';
//import BlueLoading from '../../../components/loading/BlueLoading';
//import {hideStyle} from '../../../utils/JSXRenderUtils';
//import ViewMediasHeader  from './ViewMediasHeader';
import {getMediaSize} from '../../../utils/functions';
import isString from 'lodash/isString';
import './ViewMediasItem.less';

export default class MediaContentImage extends MediaContentBase {

    static propTypes = {
        ...MediaContentBase.propTypes,
        width: PropTypes.number,
        height: PropTypes.number,
        fileUrlOrBlobUrl: PropTypes.string,
        thumbUrl: PropTypes.string
    };


    getImageSize(sWidth,sHeight) {
        if(!sHeight || !sWidth){
            return {};
        }

        var maxContentSize = this.getMaxContentSize();
        var maxWidth = maxContentSize.width;
        var maxHeight = maxContentSize.height;

        return getMediaSize(maxWidth,maxHeight,sWidth,sHeight);
    }

    render() {
        var {fileUrlOrBlobUrl,thumbUrl,width,height} =  this.props;
        var displayUrl = isString(fileUrlOrBlobUrl) ? fileUrlOrBlobUrl : thumbUrl;
        return (
            <img className="media" src={displayUrl} style={this.getImageSize(width,height)}/>
        );
    }
}