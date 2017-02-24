
////上传域名
//const UPLOAD_HOST = "http://ups-beta.soma.im";
////下载域名
//const DOWNLOAD_HOST = "http://rds-beta.soma.im";


/**
 * 上传头像图片
 * @param imgBlob BLOB类型二进制数据
 * @returns {Promise}
 */
export const uploadAvatar = function (imgBlob) {

    const HOST_ORIGIN = window.location.origin;

    return new Promise(function (resolve, reject) {

        var xhr = new XMLHttpRequest();
        var uploadStart = function () {
            var successfulCallBack = function (e) {
                var responseText = e.target.responseText;
                var resp = JSON.parse(responseText);//{code:200,msg:'ok',success:true,file_path:'https://169.54.23.188/perm/4dede4197f824d549c730ad12c619ff1.jpg'}
                var file_path = resp.file_path || '';
                //var urlInfo = StringUtils.parseURL(file_path);
                //var imgUrl = HOST_ORIGIN + urlInfo.path;
                file_path = file_path.replace(/^https:/,'http:');
                resolve({
                    imgUrl: file_path
                });
            };
            xhr.addEventListener("load", successfulCallBack, false); // 处理上传完成
        };

        xhr.addEventListener("loadstart", uploadStart, false); // 处理上传完成
        var failCallBack = function () {
            reject();
        };
        xhr.addEventListener("error", failCallBack, false); // 处理上传失败
        xhr.addEventListener("abort", failCallBack, false); // 处理取消上传

        var formData = new FormData();
        formData.append('file', imgBlob);

        xhr.upload.onprogress = function (e) {
            //var percentComplete = e.loaded / e.total;
            //console.log('percentComplete',percentComplete);
        };

        //xhr.open('post', 'http://ups-beta.soma.im/upload/file5/upload/article.json?type=image');
        xhr.open('post', `${HOST_ORIGIN}/upload/file5/upload/article.json?type=image`);
        //xhr.open('post', `http://beta.soma.im/upload/file5/upload/article.json?type=image`);
        xhr.send(formData);
    });
};