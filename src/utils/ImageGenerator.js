const canvas = document.createElement('canvas'),
    ctxt = canvas.getContext('2d');

export function text2image(text, {width = 192, height = width, bgColor = '#cdcdcd', fontColor='#fff', fontSize = 80, fontFamily = '"Roboto", sans-serif, "Helvetica Neue"'} = {}) {
    canvas.width = width;
    canvas.height = height;
    ctxt.font = `${fontSize}px ${fontFamily}`;
    ctxt.clearRect(0, 0, width, height);
    if (bgColor) {
        ctxt.fillStyle = bgColor;
        ctxt.fillRect(0, 0, width, height);
    }
    ctxt.fillStyle = fontColor;
    ctxt.textBaseline = 'middle';
    ctxt.textAlign = 'center';
    ctxt.fillText(text, width / 2, height / 2);
    return canvas.toDataURL();
}
