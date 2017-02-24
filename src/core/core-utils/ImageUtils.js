import binaryUtils from '../../utils/binaryUtils';

const canvas = document.createElement('canvas');
const canvasContext = canvas.getContext('2d');

function createImageThumbDataUrl(img, width = 15, height = 15) {
    canvas.width = width;
    canvas.height = height;
    canvasContext.clearRect(0, 0, width, height);
    canvasContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);
    var imageData = canvas.toDataURL('image/png');
    return imageData;
}


export function getImageFileInfo(file,fileInfo) {

    return binaryUtils.blobToDataURL(file)

        .then((dataUrl)=> {

            return new Promise((resolve)=> {

                var img = new Image();
                img.src = dataUrl;
                if (img.complete) {

                    resolve({
                        thumbDataUrl: createImageThumbDataUrl(img),
                        dataUrl:createImageThumbDataUrl(img,img.width,img.height),
                        width: img.width,
                        height: img.height
                    });
                } else {
                    img.onload = function () {
                        resolve({
                            thumbDataUrl: createImageThumbDataUrl(img),
                            dataUrl:createImageThumbDataUrl(img,img.width,img.height),
                            width: img.width,
                            height: img.height
                        });
                    };
                }
            });

        }).then(({width,height,thumbDataUrl,dataUrl})=> {

            var {size,name} = file;
            var nameArr = name.split('.');
            var nameExt = nameArr[nameArr.length - 1];

            return {
                fileDataUrl:dataUrl,
                thumbDataUrl: thumbDataUrl,
                imgWidth: width,
                imgHeight: height,
                fileSize: size,
                ext: nameExt
            }

        });


}