import {aesEncryptString,aesEncryptMessage} from '../../utils/crypto';
import binaryUtils from '../../utils/binaryUtils';
import {createCommand} from '../../utils/command';
import LoginStore from '../stores/LoginStore';
import UserKeysStore from '../stores/UserKeysStore';


function sendXhrRequest(formData) {

    return new Promise(function (resolve, reject) {

        var xhr = new XMLHttpRequest();

        var successfulCallBack = function (e) {
            resolve({
                fileUrl: ""
            });
        };
        var failCallBack = function () {
            reject();
        };

        var uploadStart = function (e) {
            console.log(e)
        };

        xhr.addEventListener("load", successfulCallBack, false); // 处理上传完成
        xhr.addEventListener("loadstart", uploadStart, false); // 处理上传完成
        xhr.addEventListener("error", failCallBack, false); // 处理上传失败
        xhr.addEventListener("abort", failCallBack, false); // 处理取消上传
        xhr.upload.onprogress = function (evt) {
        };
        const HOST_ORIGIN = window.location.origin;
        xhr.open('post', `${HOST_ORIGIN}/upload/file3/upload/upSend.json`);
        //xhr.open('post', `http://ups-beta.soma.im/upload/file3/upload/upSend.json`);
        xhr.send(formData);

    });
}


function buildFormData(fileBlob, file, toUid, fileAesKey, aes256Key) {

    var loginUserInfo = LoginStore.getUserInfo();
    var loginUid = loginUserInfo.uid;
    var loginToken = loginUserInfo.token;
    var aestoken = loginToken;

    var {lastModified,lastModifiedDate,name,size,type} = file;

    var reqdataObject = {
        "aeskey": aes256Key,//和外层的aes256Key是同一个值
        "method": "upload",//--一般是"upload",或者是"query"
        "offset": 0,//数据长度的起点
        "length": size,//--数据长度
        "userId": loginUid,
        "devicetype": 0,//  ---只能是0或者1,0:ios,1:android
        "env": 1,//环境，取1，2，3
        "uploadType": "image",
        "token": loginToken,//用户登录用token
        "fk": "",
        "fileSize": size,
        "orgFileSize": size,
        "clientTime": Date.now(),
        "uuid": "" + Date.now(),//一个文件的分次上传用相同的uuid
        "md5": "11111",
        "fileMd5": "11111",
        "mediaAesKey": fileAesKey,
        "isLastBlock": true,
        "languagecode": "zh",
        "avatarType": 0,
        "chatType": 0,
        "msgType": 0,
        "toId": toUid,
        "msgId": 1312320,
        "fromNick": "ddd",
        "orgHeight": 100,
        "orgWidth": 50,
        "playDuration": 0,
        "width": 100,
        "height": 50,
        "voicemailid": "",
        "updateuseravatar": "false"
    };


    var reqdataJson = JSON.stringify(reqdataObject);
    var reqdataString = aesEncryptString(reqdataJson, aes256Key);

    var dataObject = {
        "aestoken": aestoken, //--客户端秘钥用服务器公钥加密再base64
        "pukmd5": "70d6aa4ec4ecb60315d5cbcc61499996", // 暂时Web跟IOS用的同样的. --固定值，ios的有ios的，android有android的，服务器会校验是否与服务器的匹配
        "reqdata": reqdataString,//--用客户端秘钥对数据进行AES256以后得到的值
        "token": aestoken,//--先从这边拿，拿不到再去aestoken里面拿，拿到的值为aesToken
        "devicetype": "0" //--只能取0和1，0：ios，1：android
    };

    var dataString = JSON.stringify(dataObject);

    var formData = new FormData();
    formData.append('mdata2', fileBlob);
    formData.append('data', dataString);
    formData.append('data2', "123");

    return formData;
}


function aesEncryptFileContent(file, fileAesKey) {
    return new Promise(function (resolve) {
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
            var sourceURLData = e.target.result;
            var sourceArrayBuffer = binaryUtils.stringToArrayBuffer(sourceURLData);
            var cryptArrayBugger = aesEncryptMessage(sourceArrayBuffer, fileAesKey);
            resolve(cryptArrayBugger);
        };
        if (file) {
            fileReader.readAsDataURL(file);
        }
    })
}


export const uploadChatFileCmd = createCommand(function (file, toUid) {

    //P2P发送时,sharedAesKey是根据两个人的公钥私钥算出来的.
    //var aes256Key = UserKeysStore.getUserKey(toUid).sharedAesKey.toJS();

    var fileAesKey = binaryUtils.stringToArray("01020304050607080102030405060708");

    return Promise.resolve()
        .then(()=> {
            var cryptArrayBugger = aesEncryptFileContent(file, fileAesKey);
            var fileBlob = new Blob([cryptArrayBugger]);
            return fileBlob;
        })
        .then((fileBlob)=> {
            return buildFormData(fileBlob, file, toUid, fileAesKey, fileAesKey);
        })
        .then((formData)=> {
            return sendXhrRequest(formData);
        });
});


