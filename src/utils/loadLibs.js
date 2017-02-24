const loadedLibMap = {};
// 加载指定url的js库, 不会重复加载
function loadLib(libSrc) {
    if (loadedLibMap[libSrc] != null) {
        return loadedLibMap[libSrc] ? Promise.resolve() : Promise.reject(`Failed to load source: ${libSrc}`);
    } else {
        let scriptNode = document.querySelector(`[src="${libSrc}"]`);
        if (!scriptNode) {
            scriptNode = document.createElement('script');
            scriptNode.src = libSrc;
            document.head.appendChild(scriptNode);
        }
        return new Promise((resolve, reject) => {
            const onload = () => {
                    scriptNode.removeEventListener('load', onload);
                    loadedLibMap[libSrc] = true;
                    resolve();
                },
                onerror = () => {
                    scriptNode.removeEventListener('error', onerror);
                    loadedLibMap[libSrc] = false;
                    reject(`Failed to load source: ${libSrc}`);
                };
            scriptNode.addEventListener('load', onload);
            scriptNode.addEventListener('error', onerror);
        });
    }
}


export function loadAMRLib() {
    return Promise.all([
        loadLib('/static/3rd-party/pcmdata.min.js'),
        loadLib('/static/3rd-party/amrnb.min.js')
    ]);
}


export function loadEmojiLib() {

    if (window.EmojiConvertor) {
        return Promise.resolve();
    }

    return Promise.all([
        loadLib('/static/3rd-party/emoji.js')
    ]);
}