import React,{PropTypes} from 'react'
import PureRenderComponent from '../PureRenderComponent';
import './AccountAvatar.less';


function getThumbUrl (url, width, heigth) {
    if(!url){
        return "";
    }
    try {
        var index = url.lastIndexOf('.');
        if (index <= 0) return url;
        return url.substr(0, index) + "_" + width + "x" + heigth + url.substr(index);
    }catch (e){
        return url;
    }
}

export function getAvatarThumbUrl(avatarUrl, size = 80) {
    if (!avatarUrl) {
        return '';
    }

    if (avatarUrl.indexOf('/perm/') > 0) {
        return getThumbUrl(avatarUrl, size, size);
    }

    return avatarUrl;
}


/**
 * 联系人头像
 * 如果有头像显示头像,如果没有头像,把名字的首字母当做头像.
 */
export default class AccountAvatar extends PureRenderComponent {

    static propTypes = {
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string,
        size: PropTypes.number,
        className: PropTypes.string,
        onClick: PropTypes.func,
        isVip: PropTypes.bool
    };

    constructor(props) {
        super(...arguments);
        this.state = {
            isImageError:false
        };
    }

    onClick = ()=> {
        if (this.props.onClick) {
            var data = this.props.data;
            this.props.onClick(data);
        }
    };

    onLoadError=()=>{
        this.setState({isImageError: true});
    };

    componentWillReceiveProps(nextProps) {
        var avatar1 = nextProps.avatar;
        var avatar0 = this.props.avatar;
        if (avatar0 !== avatar1) {
            //头像地址发生变化后,清除Error标记.
            this.setState({isImageError: false});
        }
    }

    render() {
        var that = this;
        var {isImageError} = that.state;
        var {avatar,name,className,size,isVip} = that.props;
        className = className || '';
        size = size || 50;

        if (avatar && !isImageError) {
            var avatarThumb = getAvatarThumbUrl(avatar,size);

            return (
                <div className={`accountAvatar as-img ${className}`} style={{backgroundImage: `url(${avatarThumb})`}} onClick={this.onClick} onError={that.onLoadError}>
                    {isVip && <div className={`vipIcon ${className}`}></div>}
                </div>
            )
        }
        else {
            var charAvatar = name.charAt(0);

            return (
                <div className={`accountAvatar as-char ${className}`} onClick={this.onClick} >
                    {charAvatar}
                    {isVip && <div className={`vipIcon ${className}`}></div>}
                </div>
        )
        }
    }

}
