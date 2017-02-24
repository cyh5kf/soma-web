import React,{PropTypes} from 'react';
import PureRenderComponent from '../../../components/PureRenderComponent';
import BlueLoading from '../../../components/loading/BlueLoading';
import {hideStyle} from '../../../utils/JSXRenderUtils';
import ViewMediasHeader  from './ViewMediasHeader';
import MediaContentImage from './MediaContentImage';
import MediaContentVideo from './MediaContentVideo';
import isString from 'lodash/isString';
import './ViewMediasItem.less';

export default class ViewMediasItem extends PureRenderComponent {

    static propTypes = {
        onClickClose: PropTypes.func.isRequired,
        media: PropTypes.object.isRequired,// {renderComponent,ownerAvatar,ownerName,createTime,width,height,type,url,thumbUrl}
        isShow: PropTypes.bool.isRequired,
        isShowForward:PropTypes.bool.isRequired,
        isShowDownload:PropTypes.bool.isRequired
    };



    renderContent({fileUrlOrBlobUrl,thumbUrl,width,height,type,getFileUrlOrBlobUrl,renderComponent}){
        if(type==='image'){
            return (
                <MediaContentImage
                    width={width}
                    height={height}
                    thumbUrl={thumbUrl}
                    getFileUrlOrBlobUrl={getFileUrlOrBlobUrl}
                    fileUrlOrBlobUrl={fileUrlOrBlobUrl} />);
        }

        else if (type==='video'){
            return <MediaContentVideo width={width}
                                      height={height}
                                      thumbUrl={thumbUrl}
                                      getFileUrlOrBlobUrl={getFileUrlOrBlobUrl}
                                      fileUrlOrBlobUrl={fileUrlOrBlobUrl} />
        }

        else if (type==="component"){
            return renderComponent();
        }

    }



    getIsLoading(){

        var {media} = this.props;
        var {fileUrlOrBlobUrl,type} = media;
        if (type === "component") {
            return false;
        }

        return !isString(fileUrlOrBlobUrl);
    }




    render() {

        var {media,isShow,onClickClose,isShowDownload,isShowForward} = this.props;

        if (!isShow) {
            return null;
        }

        var isLoading = this.getIsLoading();

        return (
            <div className="view-medias-item">

                <ViewMediasHeader media={media}
                                  onClickClose={onClickClose}
                                  isShowDownload={isShowDownload}
                                  isShowForward={isShowForward}/>

                <div className={`media-wrapper media-loading-${isLoading}`}>
                    {this.renderContent(media)}
                    <BlueLoading size={100}></BlueLoading>
                </div>

            </div>
        );
    }
}