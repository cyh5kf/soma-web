import React, {PropTypes} from 'react';


var stopEvent = function (e) {
    if(e && e.preventDefault){
        e.preventDefault();
    }
};

export default class PhotoPickerCropper extends React.Component {

    static propTypes = {
        className: PropTypes.string.isRequired,
        sourceImageURL: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired
    };

    //{sourceImageURL:'',size:80}
    constructor(props) {
        super(props);
        var {size} = props;
        this.mouseData = {
            ratio: 1,
            dragable: false,
            mouseX: 0,
            mouseY: 0
        };

        this.state = {
            pw: 0,
            ph: 0,
            w: size,
            h: size
        };
        this.image = null;
    }


    componentWillMount() {
        var props = this.props;
        var sourceImageURL = props.sourceImageURL;
        this.loadSourceImage(sourceImageURL);
    }

    componentWillReceiveProps(nextProps) {
        var sourceImageURL = nextProps.sourceImageURL;
        this.loadSourceImage(sourceImageURL);
    }


    loadSourceImage =(sourceImageURL)=>{
        var that = this;
        var {size} = this.props;
        var image = new Image();
        image.src = sourceImageURL;
        image.onload = function () {
            var {width,height} = image;
            var scale;
            if (width > height) {
                scale = width / size;
                height = height / scale;
                width = size;
            } else {
                scale = height / size;
                width = width / scale;
                height = size;
            }
            that.mouseData.ratio = (1/scale);

            that.setState({
                w: width,
                h: height,
                pw: (size - width)/2,
                ph: (size - height)/2
            });
        };
        this.image = image;
    };


    onMouseDown = (e)=> {
        stopEvent(e);
        var mouseData = this.mouseData;
        mouseData.dragable = true;
        mouseData.mouseX = e.clientX;
        mouseData.mouseY = e.clientY;
    };

    onMouseMove = (e)=> {
        stopEvent(e);
        var mouseData = this.mouseData;
        if (mouseData.dragable) {
            var x = e.clientX - mouseData.mouseX;
            var y = e.clientY - mouseData.mouseY;

            var {pw,ph} = this.state;
            pw = (pw + x);
            ph = (ph + y);

            Object.assign(this.state,{pw:pw,ph:ph});

            mouseData.mouseX = e.clientX;
            mouseData.mouseY = e.clientY;
            this.setState({pw:pw, ph:ph});
        }
    };

    onMouseUp = (e)=> {
        stopEvent(e);
        var mouseData = this.mouseData;
        mouseData.dragable = false;
    };


    zoomIn = ()=> {
        this.mouseData.ratio = this.mouseData.ratio* 1.1;
        this.setBackgroundSize();
    };

    zoomOut = ()=> {
        this.mouseData.ratio = this.mouseData.ratio * 0.9;
        this.setBackgroundSize();
    };

    setBackgroundSize = ()=> {
        var image = this.image;
        var ratio = this.mouseData.ratio;
        this.setState({
            w: image.width * ratio,
            h: image.height * ratio
        });
    };


    getCanvasSizeScale = (width,height)=>{
        var size = this.props.size;
        var canvasSize,scale;
        canvasSize = height > width ? width : height;
        scale = canvasSize / size;
        return {
            scale:scale,
            canvasSize:canvasSize
        }
    };


    getDataURL = ()=> {
        var size = this.props.size;
        var {pw,ph,w,h} = this.state;
        var ratio = this.mouseData.ratio;
        //var dx = pw / ratio;
        //var dy = ph / ratio;
        console.log(ratio);

        var sourceHeight = parseInt(this.image.height);
        var sourceWidth = parseInt(this.image.width);

        var canvas = document.createElement("canvas");
        var {canvasSize,scale} = this.getCanvasSizeScale(sourceWidth,sourceHeight);
        var dx = parseInt(pw * scale);
        var dy = parseInt(ph * scale);

        var scaleC = canvasSize / size;
        var cW =  w * scaleC;
        var cH =  h * scaleC;

        canvas.width = canvasSize;
        canvas.height = canvasSize;
        var context = canvas.getContext("2d");
        context.drawImage(this.image, 0, 0, parseInt(sourceWidth), parseInt(sourceHeight), dx, dy, parseInt(cW), parseInt(cH));
        var imageData = canvas.toDataURL('image/png');
        return imageData;
    };


    getBlob = ()=> {
        var imageData = this.getDataURL();
        var b64 = imageData.replace('data:image/png;base64,', '');
        var binary = atob(b64);
        var array = [];
        for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/png'});
    };


    render() {
        var {sourceImageURL,className,size} = this.props;
        var {w,h,pw,ph} = this.state;
        var bgStyle = {
            'width':size,
            'height':size,
            'backgroundSize': `${w}px ${h}px`,
            'backgroundPosition': `${pw}px ${ph}px`,
            'backgroundRepeat': 'no-repeat'
        };

        if (sourceImageURL) {
            bgStyle['backgroundImage'] = `url(${sourceImageURL})`;
        } else {
            bgStyle['backgroundColor'] = `#EEEEEE`;
        }

        return (
            <div style={bgStyle}
                 className={className}
                 onMouseDown={this.onMouseDown}
                 onMouseMove={this.onMouseMove}
                 onMouseUp={this.onMouseUp}></div>
        )
    }

}