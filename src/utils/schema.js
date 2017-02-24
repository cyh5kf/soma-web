import {PropTypes} from 'react';
import immutable from 'immutable';
import Long from 'long';
import isNumeric from 'validator/lib/isNumeric';
import every from 'lodash/every';
import assign from 'lodash/assign';
import mapValues from 'lodash/mapValues';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isBoolean from 'lodash/isBoolean';
import find from 'lodash/find';
import forEach from 'lodash/forEach';
import omit from 'lodash/omit';
import without from 'lodash/without';
import keys from 'lodash/keys';
import values from 'lodash/values';
import createReactTypeChecker from './createReactTypeChecker';
import warning, {breakingError} from './warning';

const TYPE_NUMBER = 'number',
   TYPE_INT64 = 'int64',// "int64" 类型对应 signed Long 实例对象, 实际转换为immutable后值为"string"类型 (转换为Long: Long.fromString(int64str, false) )
   TYPE_UINT64 = 'uint64',// "uint64" 类型对应 unsigned Long 实例对象, 类同 "int64" (转换为Long: Long.fromString(int64str, true) )
   TYPE_STRING = 'string',
   TYPE_BOOLEAN = 'boolean',
   TYPE_OBJECT = 'object',
   TYPE_ARRAY = 'array',
   TYPE_BINARY = 'binary',
   // 复合类型
   TYPE_ENUM = '_enum',
   TYPE_ANYOF = '_anyOf',
   TYPE_REF = '_$ref';

const schemaIdMap = {};
function getSchemaData(schema) {
   const {$ref} = schema;
   if ($ref) {
       if (!schemaIdMap[$ref]) {
           throw new Error('Schema ID 不存在: ' + $ref);
       }
       return schemaIdMap[$ref];
   } else {
       return schema;
   }
}
function getSchemaType(schema) {
   if (schema.$ref) {
       return TYPE_REF;
   } else if (schema.anyOf) {
       return TYPE_ANYOF;
   } else if (schema.enum) {
       return TYPE_ENUM;
   } else {
       return schema.type;
   }
}
function getSchemaDefaultTitle(schema) {
   if (schema.title != null) {
       return schema.title;
   }
   const schemaType = getSchemaType(schema);
   switch (schemaType) {
       case TYPE_ANYOF:
           return `anyOf.<first: ${getSchemaDefaultTitle(schema.anyOf[0])}>`;
       case TYPE_ENUM:
           return 'enum';
       case TYPE_REF:
           return `$ref.<id: ${schema.$ref}>`;
       case TYPE_ARRAY:
           return `array.<${getSchemaDefaultTitle(schema.items)}>`;
       case TYPE_OBJECT: {
           let propKeys = keys(schema.properties);
           if (propKeys.length > 8) {
               propKeys = propKeys.slice(0, 5).concat('...');
           }
           return `object.<${propKeys.join(',')}>`;
       }
       case TYPE_NUMBER:
       case TYPE_STRING:
       case TYPE_BOOLEAN:
       case TYPE_BINARY:
           return schemaType;
   }
}


function compileSchemaMap(schemaDefinitionMap) {
   return mapValues(schemaDefinitionMap, schemaDef => compile(schemaDef));
}
function compileStringSchemaDef(strSchemaDef) {
   const [type, ...options] = strSchemaDef.split('|'),
       schema = {type: type.trim()};
   options.forEach(option => {
       const [key, val] = option.split(':');
       schema[key.trim()] = JSON.parse(val.trim());
   });
   return schema;
}

/**
编译Schema, 转换成标准的 JSON-Schema 定义 (http://json-schema.org/)
具体文档参考: https://gitlab.saay.com/eim_webfront/webfront/blob/master/Schema.md

当前已实现的 JSON-Schema 语法关键字: title, type, items, properties, required, enum, anyOf(仅对"object"类型), id, $ref
扩展的关键字:
- maybeSourceType: 指定与定义的数据类型不一样的原始数据类型, 比如 number 数据类型, 原始数据类型可能是 string. 不强制要求, 即既可以是指定的, 也可以是原类型
       - maybeSourceType 已支持转换: number <- string,  string <- number
- maybeSourceKey: 指定在object中与定义的属性名不一样的另一个可选属性名. 仅在其作为一个object属性时生效
- notRequired: 与 "required" 相反, 指定object非必须的属性, 优先级低于 "required"
- default: 当字段为 undefined 时填写的默认值 (为 null 时不填写默认值)
- dangerousDefault: bool值, 是否在使用"default"指定的默认值时提示警告
简写语法下的自定义关键字:
- __compiled: 标记此处以下的schema不再是简写语法, 而是标准 JSON-Schema 语法
- __options: 简写语法下的object参数选项关键字, 如: {__options: {required: ['[propA']}}
默认属性:
- required: object下所有属性默认必须
*/
function compile(schemaDefinition) {
   let compiledSchema = null;
   if (isString(schemaDefinition)) {
       compiledSchema = compileStringSchemaDef(schemaDefinition);
   } else if (isArray(schemaDefinition)) {
       if (schemaDefinition.length !== 1) {
           throw new Error('数组型schema缩写只能包含一个数组元素: ' + JSON.stringify(schemaDefinition));
       }
       compiledSchema = {
           type: 'array',
           items: compile(schemaDefinition[0])
       };
   } else if (isObject(schemaDefinition)) {
       if (schemaDefinition.__compiled) {
           const setupForCompiledSubSchema = subSchema => compile(assign(subSchema, {__compiled: true}));
           compiledSchema = schemaDefinition;
           compiledSchema.items && (compiledSchema.items = setupForCompiledSubSchema(compiledSchema.items));
           compiledSchema.properties && (compiledSchema.properties = mapValues(compiledSchema.properties, setupForCompiledSubSchema));
           if (compiledSchema.anyOf) {
               if (__DEV__) {
                   if (compiledSchema.anyOf.some(oneSchema => oneSchema.enum || oneSchema.$ref || oneSchema.anyOf || oneSchema.type !== TYPE_OBJECT)) {
                       breakingError('Schema.compile: "anyOf" 仅支持 "object" 类型.');
                   } else if (compiledSchema.anyOf.some(oneSchema => every(oneSchema.properties, propSchema => !propSchema.enum))) {
                       breakingError('Schema.compile: "anyOf" 类型中所有可选schema必须含有至少一个"enum"属性');
                   }
               }
               compiledSchema.anyOf = compiledSchema.anyOf.map(oneSchema => compile(assign(oneSchema, {__compiled: true})));
           }
           if (__DEV__ && compiledSchema.enum && !isArray(compiledSchema.enum)) {
               throw new Error(`Schema.compile: "enum" 值必须是数组, 实际为: ${JSON.stringify(compiledSchema.enum)}`);
           }
       } else {
           if (__DEV__ && schemaDefinition.__options && ['anyOf', '$ref', 'type', 'properties', 'enum'].some(key => schemaDefinition.__options[key])) {
               throw new Error('Schema.compile: 定义"object"类型的简写语法中指定了不允许的 "__options".');
           }
           compiledSchema = {
               ...(schemaDefinition.__options || {}),
               type: 'object',
               properties: compileSchemaMap(omit(schemaDefinition, ['__options']))
           };
       }
   } else {
       throw new Error('schema定义错误, 仅允许string/array/object: ' + JSON.stringify(schemaDefinition));
   }

   // 移除不必要的属性
   if (compiledSchema.enum || compiledSchema.$ref || compiledSchema.anyOf) {
       delete compiledSchema.type;
   }

   if (compiledSchema.title == null) {
       compiledSchema.title = getSchemaDefaultTitle(compiledSchema);
   }

   const schemaActualType = getSchemaType(compiledSchema);
   // 检查是否有object属性名冲突
   if (schemaActualType === TYPE_OBJECT) {
       const keysMap = {},
           tryAddKey = key => {
               if (keysMap[key]) {
                   breakingError(`Schema compile: key重复: ${key}`);
               }
               keysMap[key] = true;
           };
       forEach(compiledSchema.properties, (subSchema, key) => {
           tryAddKey(key);
           subSchema.maybeSourceKey && tryAddKey(subSchema.maybeSourceKey);
       });
   }

   // Schema默认属性
   // 默认object所有属性为required
   if (schemaActualType === TYPE_OBJECT && !compiledSchema.required) {
       if (compiledSchema.notRequired === "*") {
           compiledSchema.required = [];
       } else {
           compiledSchema.required = without(Object.keys(compiledSchema.properties), ...(compiledSchema.notRequired || []));
       }
       delete compiledSchema.notRequired;
   }

   // 非开发环境下, 设置object schema下的所有必填属性的默认值, 并警告提示
   if (!__DEV__) {
       if (schemaActualType === TYPE_OBJECT) {
           const requiredMap = {};
           compiledSchema.required.forEach(prop => requiredMap[prop] = true);
           forEach(compiledSchema.properties, (propSchema, propKey) => {
               if (requiredMap[propKey] && propSchema.default === undefined) {
                   switch (getSchemaType(propSchema)) {
                       case TYPE_BOOLEAN:
                           propSchema.default = false;
                           break;
                       case TYPE_NUMBER:
                           propSchema.default = 0;
                           break;
                       case TYPE_STRING:
                           propSchema.default = '';
                           break;
                       case TYPE_ARRAY:
                           propSchema.default = [];
                   }
                   if (propSchema.default !== undefined) {
                       propSchema.dangerousDefault = true;
                   }
               }
           });
       }
   }

   if (compiledSchema.id) {
       schemaIdMap[compiledSchema.id] = compiledSchema;
   }

   // 禁用 maybeSourceKey, maybeSourceType 属性
   if (__DEV__ && (compiledSchema.maybeSourceKey || compiledSchema.maybeSourceType)) {
       breakingError('这两个属性用来做兼容过渡, 新项目中不应有这样的schema定义');
   }

   compiledSchema.__compiled = true;

   return compiledSchema;
}

function compileEnum(enums) {
   return compile({
       __compiled: true,
       enum: isArray(enums) ? enums : values(enums)
   });
}

function compileAnyOf(optionSchemas) {
    return compile({
        __compiled: true,
        anyOf: optionSchemas
    });
}


function throwUnsupportedSchemaType(schemaType) {
   throw new Error(`Schema类型不支持: ${schemaType}`);
}
const validateSchemaProperties = (schemaProperties, requiredProps, data, {keyPath, _warnDangerousDefault}) => {
   const requiredMap = {};
   requiredProps.forEach(prop => requiredMap[prop] = true);
   for (let key in schemaProperties) {
       const schema = schemaProperties[key],
           maybeSourceKey = schema.maybeSourceKey,
           useSourceKey = maybeSourceKey && data[maybeSourceKey] != null,
           sliceData = useSourceKey ? data[maybeSourceKey] : data[key];
       if (!requiredMap[key] && (sliceData === null || (sliceData === undefined && schema.default === undefined))) {
           // pass
       } else {
           const err = validateAndGetError(schema, sliceData, {
               keyPath: `${keyPath}.${useSourceKey ? maybeSourceKey : key}`,
               _warnDangerousDefault
           });
           if (err) {
               return err;
           }
       }
   }
   return '';
};
// 返回错误字符串, 如果没有, 返回空
function validateAndGetError(schema, data, {keyPath = '', _warnDangerousDefault = false} = {}) {
   schema = getSchemaData(schema);
   if (schema.anyOf) {
       const errors = [],
           hasOnePass = schema.anyOf.some(oneSchema => {
               const err = validateAndGetError(oneSchema, data, {keyPath, _warnDangerousDefault});
               errors.push(err);
               return !err;
           });
       return hasOnePass ? '' : (
           `路径: "${keyPath}": "anyOf" schema均校验出错, 错误分别为:\n` +
           errors.map((err, idx) => `  ${idx+1}: ${err}\n`).join('')
       );
   } else if (schema.enum) {
       const valid = schema.enum.indexOf(data) !== -1;
       return valid ? '' : `路径: "${keyPath}": "enum"类型校验失败, 可选值为: ${JSON.stringify(schema.enum)}, 实际为: ${JSON.stringify(data)}`;
   } else {
       if (data === undefined && schema.default !== undefined) {
           data = schema.default;
           if (schema.dangerousDefault) {
               warning(`Schema.createImmutableSchemaData: 指定路径字段未填写: ${keyPath}, 默认填充了默认值`, {onlyDev: false});
           }
       }
       let valid = false;

       switch (schema.type) {
           case TYPE_INT64:
           case TYPE_UINT64:
               valid = data instanceof Long || (isString(data) && isNumeric(data));
               break;
           case TYPE_BINARY:
               valid = data instanceof Object.getPrototypeOf(Uint8Array) || data instanceof ArrayBuffer;
               break;
           case 'boolean':
               valid = isBoolean(data);
               break;
           case 'number':
               if (schema.maybeSourceType === 'string') {
                   valid = isNumber(data) || (isString(data) && data && !Number.isNaN(Number(data)));
               } else {
                   valid = isNumber(data);
               }
               break;
           case 'string':
               if (schema.maybeSourceType === 'number') {
                   valid = isString(data) || isNumber(data);
               } else {
                   valid = isString(data);
               }
               break;
           case 'array':
               if (data && isArray(data)) {
                   for (let i = 0; i < data.length; i++) {
                       const err = validateAndGetError(schema.items, data[i], {
                           keyPath: `${keyPath}[${i}]`,
                           _warnDangerousDefault
                       });
                       if (err) {
                           return err;
                       }
                   }
                   valid = true;
               }
               break;
           case 'object':
               if (data && isObject(data)) {
                   return validateSchemaProperties(schema.properties, schema.required || [], data, {
                       keyPath,
                       _warnDangerousDefault
                   });
               }
               break;
           default:
               throwUnsupportedSchemaType(schema.type);
       }

       return valid ? '' : `路径: "${keyPath}": 期望类型: ${schema.type}, 实际值为: ${JSON.stringify(data)}`;
   }
}
// 验证数据是否符合schema规范, 如果不符, 抛出异常
function ensureSchema(schema, data) {
   const err = validateAndGetError(schema, data, {_warnDangerousDefault: true});
   if (err) {
       throw new Error(`Schema 校验错误, Schema为: (${schema.title}), 错误详情: ${err}`);
   }
}

////////////////
// 以下为 schema 针对 immutable.js 的运用

function getSchemaRecord(schema) {
   if (schema.type !== 'object') {
       throw new Error(`{getSchemaRecord}: 只接受对象类型的schema, 实际类型为${schema.type}`);
   }
   if (!schema.__record) {
       const recordOptions = mapValues(schema.properties, () => null);
       schema.__record = new immutable.Record(recordOptions, `SchemaRecord[${Object.keys(recordOptions).join(',')}]`);
   }
   return schema.__record;
}
function _innerCreateImmutableSchemaData(schema, data) {
   schema = getSchemaData(schema);
   if (data === undefined && schema.default !== undefined) {
       data = schema.default;
   }
   if (data == null) {
       return null;
   }
   if (schema.enum) {
       return data;
   }
   if (schema.anyOf) {
       schema = getSchemaData(find(schema.anyOf, oneSchema => {
           return !validateAndGetError(oneSchema, data);
       }));
   }
   switch (schema.type) {
       case TYPE_NUMBER:
           return Number(data);
       case TYPE_INT64:
       case TYPE_UINT64:
           return data.toString();
       case TYPE_STRING:
           return data.toString();
       case TYPE_BINARY:
       case TYPE_BOOLEAN:
           return data;
       case TYPE_ARRAY:
           return immutable.List(data.map(item => _innerCreateImmutableSchemaData(schema.items, item)));
       case TYPE_OBJECT:
           return new (getSchemaRecord(schema))(mapValues(schema.properties, (propSchema, propKey) => {
               const maybeSourceKey = propSchema.maybeSourceKey,
                   sliceData = maybeSourceKey && data[maybeSourceKey] != null ? data[maybeSourceKey] : data[propKey];
               return _innerCreateImmutableSchemaData(propSchema, sliceData);
           }));
       default:
           throwUnsupportedSchemaType(schema.type);
   }
}
function createImmutableSchemaData(schema, data) {
   if (data == null) {
       return null;
   }
   ensureSchema(schema, data);
   return _innerCreateImmutableSchemaData(schema, data);
}


function isAnyChanged(immutableSchemaData, mergedData){
    if(!immutableSchemaData){
        return true;
    }

    var keyArray = keys(mergedData || {});
    for (var i = 0; i < keyArray.length; i++) {
        var key = keyArray[i];
        var value1 = mergedData[key];
        var value0 = immutableSchemaData[key] || (immutableSchemaData.get && immutableSchemaData.get(key));
        if (value0 !== value1) {
            return true;
        }
    }
    return false;
}


// 在已有的immutable数据上合并入新的数据
function mergeImmutableSchemaData(schema, immutableSchemaData, mergedData) {

    if(!isAnyChanged(immutableSchemaData, mergedData)){
        return immutableSchemaData;
    }

   schema = getSchemaData(schema);
   const schemaActualType = getSchemaType(schema);
   if (schemaActualType !== TYPE_OBJECT && schemaActualType !== TYPE_ANYOF) {
       throw new Error(`{mergeImmutableSchemaData}: 只接受对象和anyOf类型的schema, 实际类型为${schemaActualType}`);
   }
   return createImmutableSchemaData(schema, assign(
       immutableSchemaData.toJS(),
       mergedData
   ));
}

// return boolean
const validateImmutableSchemaData = (schema, immutableData) => {
   if (schema.anyOf) {
       return schema.anyOf.some(oneSchema => {
           return validateImmutableSchemaData(oneSchema, immutableData);
       });
   } else {
       switch (schema.type) {
           case TYPE_OBJECT: return immutableData instanceof getSchemaRecord(schema);
           case TYPE_ARRAY: return immutableData instanceof immutable.List && immutableData.every(item => validateImmutableSchemaData(schema.items, item));
           default: throwUnsupportedSchemaType(schema.type);
       }
   }
};
const ReactPropTypes = {
   ...PropTypes,
   ofSchema: (schema, {isImmutable = true} = {}) => createReactTypeChecker((props, propName, componentName, location, propFullName) => {
       const propValue = props[propName];
       if (isImmutable ? !validateImmutableSchemaData(schema, propValue) : !!validateAndGetError(schema, propValue)) {
           return new Error(`'${componentName}'中 ${location} '${propFullName}' 数据不合法, 期望得到schema规范数据, 实际为: ${JSON.stringify(propValue && propValue.toJS ? propValue.toJS() : propValue)}.`);
       } else {
           return null;
       }
   })
};

export {compile, compileEnum, compileAnyOf, ensureSchema, createImmutableSchemaData, mergeImmutableSchemaData, ReactPropTypes};
