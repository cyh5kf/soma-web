import binaryUtils from './binaryUtils';

function _toDataUrl(dataBytes, mimeType) {
    return `data:${mimeType};base64,${binaryUtils.arrayBufferToBase64(dataBytes)}`;
}

export function toImageDataUrl(dataBytes, ext) {
    return _toDataUrl(dataBytes, `image/${ext}`);
}

export function toAudioDataUrl(dataBytes, ext) {
    const mimeType = `audio/${ext}`;
    return _toDataUrl(dataBytes, mimeType);
}

export function toVideoDataUrl(dataBytes, ext) {
    const mimeType = `video/${ext}`;
    return _toDataUrl(dataBytes, mimeType);
}
