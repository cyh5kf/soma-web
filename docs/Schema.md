## schema 作用

利用通用的 JSON-Schema 对JSON数据做校验（主要是服务端请求数据），并且与immutable结合，自动转换，应用到组件数据源/校验数据源，以确保数据准确，同时用作数据文档，以方便协同合作。

## schema 语法规范

具体实现参照 [JSON-Schema](json-schema.org) 第4版，为了支持与immutable结合，仅取其中部分子集，并做必要扩展。

#### 已实现的 JSON-Schema 关键字:

- `type`
- `items`
- `properties`
- `required`
- `anyOf` (仅对"object"类型)
- `enum`
- `id` & `$ref`
    
#### 额外扩展的关键字:

- `notRequired` 与 "required" 相反，指定object非必须的属性，优先级低于 "required"
- `maybeSourceType` 指定与定义的数据类型不一样的原始数据类型, 比如 number 数据类型, 原始数据类型可能是 string. 不强制要求, 即实际数据既可以是指定的类型, 也可以是原类型
    - 支持的转换: number <- string
- `maybeSourceKey` 指定该字段在**object**类型中与定义的字段名不一样的原始字段名（即Schema转换中的字段映射）。不强制要求

#### 属性默认值:

- `required` 默认object所有属性均为必须
- `maybeSourceType` 对于"number"类型默认为"string"

## schema 自定义的简化语法规范

为了避免JSON-Schema冗长的书写语法，实现了简化易读的语法。简写语法下有额外的关键字:

- `__compiled` 标记此处为原JSON-Schema语法（即非简写语法）
- `__options` schema的额外属性，如 "required"

## schema 语法示例

#### 1. Schema基本简写语法

schema:
```javascript
{
  a_str: 'string',
  
  // 简写语法下，字符串中也可定义schema额外属性，语法为 <key: JSON-value>，每个字段用 "|" 分隔，空格无影响，其中 JSON-value 通过 JSON.parse(...) 解析实际值
  b_num: 'number | maybeSourceKey: "bbbNum"',
  
  b2_num: 'number',
  c_bool: 'boolean',

  // 定义 "d_obj" 为一个对象
  d_obj: {
    inner_num: 'number',
    inner_str: 'string',
    // 支持嵌套定义 (此处将 "d1" 定义为任意对象)
    inner_obj: {
        some_str: 'string'
    },
    __options: {
      // 定义对象中'inner_str'为可选 (默认所有必填)
      notRequired: ['inner_str'] // 也可使用反义的 "notRequired" 定义
    },
  },

  // 定义 "e_arr" 为一个对象数组
  e_arr: [{
    e0: 'boolean'
  }],

  // 定义 "f_arr_number" 为一个数字数组
  f_arr_number: ['number']
}
```

对应的合法数据:
```javascript
{
  a_str: 'some string',
  bbbNum: 123, // "maybeSourceKey" 定义字段映射 "bbbNum" -> "b_num"
  b2_num: '123', // "number" 类型默认 "maybeSourceType"="string", 所以字符串型数字也合法
  c_bool: true,

  d_obj: {
    inner_num: 456,
    // inner_str: ''  // "inner_str" 为可选
    inner_obj: {
        some_str: 'another string'
    }
  },

  e_arr: [{
    e0: true
  }, {
    e0: false
  }],

  f_arr_number: [1, 2, 3]
}
```

#### 2. Schema 标准(非简写)基本语法

schema:
```javascript
{
  __compiled: true, // 非简写语法标记
  type: 'object',
  properties: {
    a_num: {
      type: 'number'
    },
    b_str: {
      type: 'string'
    },
    c_boolean: {
      type: 'boolean'
    },
    d_array: {
      type: 'array',
      items: {
        type: 'number'
      }
    }
  },
  notRequired: ['c_boolean']
}
```

等同的schema简写语法:
```javascript
{
  a_num: 'number',
  b_str: 'string',
  c_boolean: 'boolean',
  d_array: ['number']
  __options: {
    notRequired: ['c_boolean']
  }
}
```

#### 3. "anyOf" 任意子schema通过验证则合法

schema: (其中`compile`编译简写语法为标准语法)
```javascript
{
  __compiled: true,
  anyOf: [
    compile({a_num: 'number'}),
    compile({b_str: 'string'})
  ]
}
```

则以下数据均合法:
```javascript
{
  a_num: 123
}

{
  b_str: 'some string'
}
```


#### 4. "enum" 仅允许值为指定的可选值范围内

schema:
```javascript
{
  __compiled: true,
  enum: [1, 2, 'abc']
}
```

则仅有数据 1, 2, 'abc' 合法


#### 5. "enum" 和 "anyOf" 结合使用

通常情况，出现 "anyOf" 关键字时也会出现 "enum" 关键字，代表在某个字段的某个值域内时，整体具有某些特殊的额外字段。
比如，定义电脑资源数据格式，包含文件和文件夹两种类型，且不同类型有不同的额外字段：

```javascript
const commonResourceSrc = {
        // type: 'string',
        name: 'string',
        modifyDate: 'number'
    },
    
    FileSchema = compile({
        ...commonResourceSrc,
        type: compileEnum(['file']),
        fileSize: 'number'
    }),
    
    FolderSchema = compile({
        ...commonResourceSrc,
        type: compileEnum(['folder']),
        folderFileCount: 'number'
    });

// 实际导出的 Schema 
export const ResourceSchema = compile({
    __compiled: true,
    anyOf: [
        FileSchema,
        FolderSchema
    ]
});
```


#### 6. "id" & "$ref" 递归嵌套Schema

假设需要定义一个树结构（比如文件夹）, schema 如下:
```javascript
{
  folder_name: 'string',
  sub_folders: [{
     __compiled: true,
     $ref: '/folder-schema' // 引用id为 "/folder-schema" 的schema
  }],
  __options: {
    id: '/folder-schema' // 定义自身id为 "/folder-schema"
  }
}
```


#### 7. "maybeSourceKey" 字段名映射

实际项目中，后端经常发生接口字段名变更。但JavaScript 为动态类型语言，在做重命名重构时非常麻烦，IDE识别有限，只能靠字符串搜索、人工确认重命名。
为了避免这一点，引入了 "maybeSourceKey" 做字段名映射。

假设有如下源格式数据（可以来自后端接口，也可以是其他）：

```javascript
{
    keyOne: '...',
    keyTwo: '...'
}
```

对应的 Schema：

```javascript
{
    keyOne: 'string',
    keyTwo: 'string'
}
```

当源数据字段名 "keyOne" 更改为 "key_one" 时，只需调整Schema，不用修改其他代码，即可保持正常工作：

```javascript
{
    keyOne: 'string | maybeSourceKey: "key_one"',
    keyTwo: 'string'
}
```


## Schema 与 Immutable 的结合运用

为了配合 React PureRender，必须采用 Immutable JSON 数据。普通的 Immutable.Map 数据只能通过 `.get('XXX')` 访问，使用不方便。通过 Schema 预定义的格式，将 Map 转换成 Record，以方便读取，同时验证组件数据格式。

#### Schema 到 Immutable 的对应类型

Schema 定义的类型与转换后的 Immutable 类型对应：

- Array -> Immutable.List
- Object -> Immutable.Record
- string/boolean/number -> 保持不变

#### Schema 转换数据为 Immutable 格式

- `createImmutableSchema(schema, data)` 将json数据完整的转换为schema & immutable数据
- `mergeImmutableSchema(schema, oldSchemaData, newChangesData)` 将部分json数据合并到已有的schema & immutable数据上

#### Schema 与 组件数据校验（PropTypes）

`core/ReactPropTypes.js` 中扩展了许多自定义的组件数据校验，针对 Schema 的校验类型为 `.ofSchema(...)`。

假设定义了Schema: `TeamMemberListSchema`。
当某个组件接受这个Schema格式的数据时，定义如下`propTypes`校验数据：

```javascript
    static propTypes = {
        members: ReactPropTypes.ofSchema(TeamMemberListSchema).isRequired
    }
```

同时，`.ofSchema(...)` 也提供第二个参数，用来校验非immutable数据。
还有`.ofSchemas(...)` 用来校验数据是否符合任一指定的Schema
