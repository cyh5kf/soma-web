function getExtension(fileUrl) {
    const lastDotIdx = fileUrl.lastIndexOf('.');
    if (lastDotIdx !== -1) {
        return fileUrl.substr(lastDotIdx + 1);
    } else {
        return null;
    }
}

const audioPh = document.createElement('audio');
const videoPh = document.createElement('video');

export default {
    getExtension: getExtension,

    isAudioFormatSupported(fileUrl) {
        const ext = getExtension(fileUrl);
        return ext === 'amr' || audioPh.canPlayType(`audio/${ext}`) !== '';
    },

    isVideoFormatSupported(fileUrl) {
        return videoPh.canPlayType(`video/${getExtension(fileUrl)}`) !== '';
    }
}
