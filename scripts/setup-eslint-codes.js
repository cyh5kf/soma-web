/* eslint-env node */
var fse = require('fs-extra'),
    path = require('path');

fse.copySync(
    path.join(__dirname, 'eslint-modified-codes', 'Components.js'),
    path.join(__dirname, '..', 'node_modules', 'eslint-plugin-react', 'lib', 'util', 'Components.js'),
    {
        clobber: true
    }
);
