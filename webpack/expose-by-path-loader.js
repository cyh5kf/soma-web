/* eslint-env node */
/**
 * 将模块按路径名导出到全局 _dev 变量下
 */

var path = require('path'),
    SRC_DIR = path.resolve(__dirname, '..', 'src'),
    _ = require('lodash');

module.exports = function (content, sourcemap) {
    this.cacheable();
    var modulePath = path.relative(SRC_DIR, this.resourcePath),
        shortName = path.basename(modulePath).replace(/\.(js|jsx)$/, ''),
        longName = shortName + '_' + path.dirname(modulePath).replace(/[\/\\\.]/g, '_'),
        newContent = content + '\n\n' +
            '/** INJECTED BY "EXPOSE BY PATH" LOADER **/\n' +
            'global._dev = global._dev || {};\n' +
            _.template('global._dev[ !global._dev["<%= shortName %>"] ? "<%= shortName %>" : "<%= longName =>" ] = module.exports;')({
                shortName: shortName,
                longName: longName
            });

    this.callback(null, newContent, sourcemap);
};
