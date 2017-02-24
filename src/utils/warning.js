export default function warning(msg, {onlyDev = false} = {}) {
    if (!onlyDev || __DEV__) {
        console.error(msg);
        try {
            throw new Error(msg);
        } catch (e) {
            // pass
        }
    }
}

export function breakingError(msg, {onlyDev = false} = {}) {
    if (!onlyDev || __DEV__) {
        throw new Error(msg);
    }
}
