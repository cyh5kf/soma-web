export default function createChainableTypeChecker(validate) {
    function checkType(isRequired, props, propName, componentName, location, propFullName) {
        componentName = componentName || '<<anonymous>>';
        propFullName = propFullName || propName;
        if (props[propName] == null) {
            if (isRequired) {
                return new Error('Required ' + location + ' `' + propFullName + '` was not specified in ' + ('`' + componentName + '`.'));
            }
            return null;
        } else {
            return validate(props, propName, componentName, location, propFullName);
        }
    }

    var chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
}

