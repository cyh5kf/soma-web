let focus = true;

window.addEventListener('focus', () => {
    focus = true;
});

window.addEventListener('blur', () => {
    focus = false;
});

export default function isWindowFocus() {
   return focus;
}
