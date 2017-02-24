/**
 * 导出 .proto 文件定义的 message, 需配合使用在 "raw-loader" 之后
 */

module.exports = function (content, sourcemap) {
    this.cacheable();

    var newContent = content + '\n\n' +
        '/** INJECTED BY "proto-loader" **/\n' +
        'var __protobufjs = require("protobufjs");\n' +
        'var __protoStr = module.exports;\n' +
        'var __protoBuilder = __protobufjs.loadProto(__protoStr);\n' +
        'module.exports = __protoBuilder.build();';

    this.callback(null, newContent, sourcemap);
};
