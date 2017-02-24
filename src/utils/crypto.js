/* global Buffer, sodium */
import aesjs from 'aes-js';
import binaryUtils from './binaryUtils';


function bufferToArrayBuffer(buffer) {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export class ECC {
    /**@type Uint8Array */
    _publicKey = null;
    /**@type Uint8Array */
    _privateKey = null;
    constructor({publicKey = null, privateKey = null} = {}) {
        if (publicKey && privateKey) {
            this._publicKey = new Uint8Array(publicKey);
            this._privateKey = new Uint8Array(privateKey);
        } else {
            const keyPair = sodium.crypto_box_keypair();
            this._publicKey = keyPair.publicKey;
            this._privateKey = keyPair.privateKey;
        }
    }

    /**@return {Array.<int>} 32位数组*/
    getPublicKey() {
        return [].slice.call(this._publicKey);
    }

    /**@return {Array.<int>} 32位数组*/
    getPrivateKey() {
        return [].slice.call(this._privateKey);
    }

    /**@param {Array.<int>} publicKey 32位数组
     *
     * @return {Array.<int>} 32位数组 */
    deriveShareKey(publicKey) {
        return [].slice.call(sodium.crypto_scalarmult(this._privateKey, new Uint8Array(publicKey)));
    }
}


export const DEFAULT_AES_IVKEY_STRING = '0102030405060708';
export const DEFAULT_AES_IVKEY = binaryUtils.stringToArray(DEFAULT_AES_IVKEY_STRING);

/**@param {ArrayBuffer} dataBytes
 * @param {Array.<int>} key 32位数组
 * @param {Array.<int>} ivKey 16位数组
 *
 * @return {ArrayBuffer} */
export function aesEncryptMessage(dataBytes, key, ivKey = DEFAULT_AES_IVKEY) {
    const keyBuf = new Buffer(key),
        ivKeyBuf = new Buffer(ivKey),
        dataSize = dataBytes.byteLength,
        aesDataBufSize = Math.ceil((4 + dataSize) / 16) * 16,
        aesDataBuf = new Buffer(aesDataBufSize),
        aesCbc = new aesjs.ModeOfOperation.cbc(keyBuf, ivKeyBuf);
    aesDataBuf.writeInt32BE(dataSize, 0);
    (new Buffer(dataBytes)).copy(aesDataBuf, 4);
    return bufferToArrayBuffer(aesCbc.encrypt(aesDataBuf));
}

/**@param {ArrayBuffer} encryptedBytes
 * @param {Array.<int>} key 32位数组
 * @param {Array.<int>} ivKey 16位数组
 *
 * @return {ArrayBuffer} */
export function aesDecrypt(encryptedBytes, key, ivKey) {
    const keyBuf = new Buffer(key),
        ivKeyBuf = new Buffer(ivKey),
        aesCbc = new aesjs.ModeOfOperation.cbc(keyBuf, ivKeyBuf),
        decryptedAesBuf = aesCbc.decrypt(new Buffer(encryptedBytes));
    return bufferToArrayBuffer(decryptedAesBuf);
}

/**@param {ArrayBuffer} encryptedDataBytes
 * @param {Array.<int>} key 32位数组
 * @param {Array.<int>} ivKey 16位数组
 *
 * @return {ArrayBuffer} */
export function aesDecryptMessage(encryptedDataBytes, key, ivKey) {
    const decryptedAesBuf = new Buffer(aesDecrypt(encryptedDataBytes, key, ivKey)),
        dataSize = decryptedAesBuf.readInt32BE(0);
    return bufferToArrayBuffer(decryptedAesBuf.slice(4, dataSize + 4));
}

/**
 * 使用AES加密字符串
 * @param dataString 要加密的字符串
 * @param {Array.<int>} key 32位数组
 * @param {Array.<int>} ivKey 16位数组
 */
export function aesEncryptString(dataString, key, ivKey = DEFAULT_AES_IVKEY){
    var dataArrayBuffer = binaryUtils.stringToArrayBuffer(dataString);
    var dataArrayBuffer2 = aesEncryptMessage(dataArrayBuffer, key, ivKey);
    var dataString2 = binaryUtils.arrayBufferToString(dataArrayBuffer2);
    return dataString2;
}