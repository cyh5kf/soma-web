/* eslint-env node */
// 将文本格式的本地化文件转换为前端使用的js模块文件。(文本行格式为: < "<key>" = "<value>"; > )
var os = require('os'),
    path = require('path'),
    fse = require('fs-extra'),
    _ = require('lodash'),
    jsonStableStringify = require('json-stable-stringify'),
    yargs = require('yargs');

var argv = yargs
    .describe('source-dir', 'Directory of source locale text files')
    .describe('source-file', 'File path of source locale text file')
    .describe('locale', 'Target locale (when specify --source-file option)')
    .help('h')
    .argv;

var ROOT = path.resolve(__dirname, '..'),
    LOCALES_DIR = path.resolve(ROOT, 'src/locales/app-locales');

var RE_LOCALE_TYPE = /Localizable_(\w+)/;
// 从文件名中提取语言类型 (如: Localizable_zh.strings => "zh")
function extractLocaleType(inputTextFileName) {
    var match = inputTextFileName.match(RE_LOCALE_TYPE);
    if (match) {
        return match[1];
    } else {
        throw new Error('extractLocaleType: 解析语言失败: ' + inputTextFileName);
    }
}

var RE_INVALID_QUOTE = /([^\\])"/g;
function parseValue(val) {
    val = val.replace('\\U200E', '\\u200E');
    val = val.slice(1, val.length - 1);
    return eval('"' + val.replace(RE_INVALID_QUOTE, '$1\\"') + '"');
}
function generateLocaleModule(inputTextFile, localeType) {
    var inputContent = fse.readFileSync(inputTextFile, 'utf8'),
        outputJsFile = path.resolve(LOCALES_DIR, localeType + '.js'),
        outputResult = {};
    inputContent.split(os.EOL).forEach(line => {
        line = line.trim();
        if (line && line !== '{' && line !== '}') {
            var parts = line.split('=');
            if (parts.length === 2) {
                try {
                    var key = _.trim(parts[0].trim(), '"'),
                        val = parseValue(_.trim(parts[1].trim(), ';'));
                    outputResult[key] = val;
                } catch (e) {
                    console.warn('Warning: # generateLocaleModule: 本地化解析失败 "' + localeType + '" : ' + line);
                    console.error(e);
                }
            } else {
                console.warn('Warning: # generateLocaleModule: 本地化解析失败 "' + localeType + '" : ' + line);
            }
        }
    });
    fse.writeFileSync(outputJsFile, 'export default ' + jsonStableStringify(outputResult, {space: 4}));
}

if (argv['source-dir']) {
    var fileNames = fse.readdirSync(argv['source-dir']);
    fileNames.forEach(filename => {
        var localeType = extractLocaleType(filename),
            filepath = path.resolve(argv['source-dir'], filename);
        generateLocaleModule(filepath, localeType);
    });
} else if (argv['source-file'] && argv['locale']) {
    generateLocaleModule(argv['source-file'], argv['locale']);
} else {
    console.error('参数错误!');
    yargs.showHelp();
}
