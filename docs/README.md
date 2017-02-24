# SOMA WEB 项目

# 启动

### 开发模式

- `npm install`
- `npm run build-dev`
- 访问 `localhost:3000`

### 线上部署模式

- `npm install`
- `npm run build`
- 部署资源存在于 `build/` 文件夹

# 技术栈:

- React
- Actions / Commands (类Flux)
- React Router
- Immutable JSON Schema (参考`Schema.md`)
- Websocket
- Protobufjs
- libsodium (ECC 加密)
- aes-js (AES 加密)
- Webpack

# 编译脚本

- `npm run gen-locale` 编译多语言文件。使用示例:
    - 将产品提供的多语言源文件(如`Localizable_en.strings`, `Localizable_zh.strings`)放到`raw-locales/`目录下
    - 执行`npm run gen-locale -- --source-dir raw-locales`
    - 编译后的多语言js模块放在`src/core/locales/app-locales/`目录下

- `npm run compile-proto-json` 编译proto文件。使用示例:
    - 将服务端svn仓库中的`app/*.proto`全部拷贝到`src/core/protos/app/`目录下
    - 执行`npm run compile-proto-json`
    - 编译后proto文件合并到单个`protos.json`文件中 (由`protos.js`引入并初始化)

# 开发调试工具

- `__DEV__` 变量。开发模式会注入全局`__DEV__ = true`变量，可使用此变量为条件判断做开发模式下的任意操作，其中的代码不会出现在线上编译代码中。例如:

```javascript
if (__DEV__) {
    verifyCondition(foo, bar);
    console.log('开发模式下输入日志');
}
```

- `_dev` 全局变量。部分用于方便调试的信息会注入到全局`_dev`Object类型变量中。可在控制台访问:
  - `_dev.{文件名}`(开发模式下有效)。由`expose-by-path-loader`将每个文件的导入变量注入到`_dev`对应文件名下。如`LoginStore.js`导出的内容可在控制台中访问`_dev.LoginStore`获得
  - `_dev._toggleSocketFrameLogger(logPing)`(开发及线上模式均有效)。调试函数，用于开启Websocket数据收发日志。参见`SocketManger.js`

# 主要业务流程

### 发送/接收群聊消息

群聊消息的发送/接收没有加解密，没有Ack，流程简单，不做介绍。

### Web发送单聊消息: A(自己) => B(对方)

单聊消息的发送含加密流程。代码参见`MessagesCommands: sendMsg`方法单聊部分。

- 首先，根据消息类型构造出需要发送的消息内容区PB数据 (参考`imchatmsg.proto`)
- 保证获取过(缓存或从服务端拉取)B的公钥信息(版本号及公钥): `UsersCommands.ensureUserEccKeysCmd([B_uid])`
- 用B的公钥和A的私钥推导出共有的aes密钥: `UserKeysStore.getAesKeyByPublicKey(B_publick_key)` (带缓存实现)
- 用得到的aes密钥以及Web端生成的aesIVKey加密消息内容PB (加密方法详情见下方): `crypto.aesEncryptMessage(bytes, aesKey, aesIVKey)` (加密这一部分的代码参见`socketProtoCoders['msgproxy2.SendP2P'].encodeRequest`)
- 最后，构造完整的请求PB:
    - 填上加密后的消息内容区PB二进制数据 (`data`)
    - 填上B(对方)的公钥版本号 (`eccversion`)
    - 填上A(自己)的完整公钥 (`publickey`)
    - 填上A生成的aesIVKey
- 发送rpc请求:
    - 如果收到**B(对方)**的公钥版本过期的错误，则更新B的公钥信息(公钥信息已经附带在失败返回值中，无需请求服务器)，再从第三步开始重试发送流程
    - 发送成功后，服务端会发给App端一个**SelfNotify**推送 (`immsgntf.proto: ESessionType.ESessionType_SELF_NOTIFY`)

### Web接收App端发送单聊消息的SelfNotify处理: A(自己) => B(对方)

接收App端发送单聊消息的SelfNotify时，同样的，收到的是:
- 加密后的消息内容数据
- B(对方)的公钥版本号
- A(自己)的完整公钥
- App端生成的aesIVKey

处理流程如下，代码参见`socketProtoCoders: decodeWebNotifyInnerPB: ESessionType.ESessionType_SELF_NOTIFY: SelfNotifyType.SELF_NOTIFY_TYPE_SEND_P2P_MESSAGE`部分:

- 保证获取过B的公钥信息(版本号及公钥)
- 比对Web本地和请求中附带的App端的A(自己)的公钥。一致则正常；不一致则代表有可能登录信息过期，放弃解密
- 比对Web本地缓存的和请求中附带的B(对方)的公钥版本号
    - 如果不一致且本地缓存的B的公钥版本号较老，则从服务端请求更新B的公钥信息: `UsersCommands.refetchUserEccKeysCmd`
    - 如果不一致且本地公钥版本号较新，或者更新后依然版本号不一致，则代表消息中附带的对方的版本号过期，放弃解密
- 用本地的A的私钥和本地的B的公钥推出共有的aes密钥
- 用得到的aes密钥，加上请求中的aesIVKey用于解密 (解密方法详情见下方)
- 写入Store作为自己发送的消息之一

### 接收单聊消息: B(对方) => A(自己)

接收单聊加密消息时，对应的，收到的是:
- 加密后的消息内容数据
- A(自己)的公钥版本号
- B(对方)的完整公钥
- B生成的aesIVKey

接收流程如下，代码参见`socketProtoCoders: decodeWebNotifyInnerPB: ESessionType.ESessionType_P2P`:

- 比对本地A(自己)的版本号和请求中附带的A的版本号，如果不一致，则代表对方用于加密消息的A公钥过期，放弃解密
- 用本地A的私钥和请求中附带的B的公钥推出共有的aes密钥
- 用得到的aes密钥，加上请求中的aesIVKey用于解密 (解密方法详情见下方)

这一步不需要获取B的公钥信息，因为请求中已经附带了所需的B的完整公钥

### aes内容加密

目前采用的aes加密方法需要二进制数据长度为16的整数倍，因而会涉及到补齐(补齐到16的整数倍长度)以及截取(截取出实际内容区，去掉补齐区域)

##### 针对消息中上传的文件内容的aes加密

文件类型的消息字段中包含了`filesize`字段标明了数据的长度，因而只有尾端补齐

- 加密 (Web端目前暂无文件的加密上传):
    - 内容区补齐到16的整数倍
    - 加密补齐后的数据
- 解密 (参见`MessagesCommands.decryptFileMsgDataUrlCmd`):
    - 解密数据，获得补齐后的内容数据
    - 根据`filesize`截取前面的指定长度，获得实际的文件内容

##### 针对消息内容的aes加密 (或任意非固定长度数据的aes加密)

加密内容的长度未知，因而需要在首部四个字节中填上内容实际长度，并且同样尾端补齐到16整数倍长度

- 加密 (参见`crypto.aesEncryptMessage`):
    - 构建用于加密的数据: 首部四个字节填上内容区长度(BE格式)，之后跟完整内容区，最后补齐16整数倍长度
    - 加密整个数据
- 解密 (参见`crypto.aesDecryptMessage`):
    - 解密数据
    - 从解密后的数据中，读取首部四个字节获取内容区长度，然后在之后的数据中截取出指定长度，获得实际的消息内容

### 消息Ack机制

##### Ack流程: 针对单聊中对方发送的消息

- 接收到消息时，立即发送`已收到`回执: `MessagesCommands.msgsAckCmd  isRead=false` (代码参见`SessionsStore._handleRpcNotify: ESessionType.ESessionType_P2P`)
- 阅读完消息后，发送`已读`回执: `MessagesCommands.msgsAckCmd  isRead=true` (代码参见`MessagePanelComposer.clearUnreadMessages`)

##### Ack Del流程: 针对单聊中自己发送的消息

发送完单聊消息后，会收到对方发来的Ack推送。

每次收到推送时，应当发送Ack Del用于通知**服务端**删除保存在服务端的Ack推送记录: `MessagesCommands.msgAckDelCmd`。(代码参加`SessionsStore._handleRpcNotify: ESessionType.ESessionType_P2PAck`)。

同时，收到对方的Ack推送(`imchatmsg.proto: ESessionType.ESessionType_P2PAck`)时:
    - 子类型`EChatSubItemType.EChatSubItemType_RECEIVED`代表`已收到`回执
    - 子类型`EChatSubItemType.EChatSubItemType_READ`代表`已读`回执 (注意消息状态优先级不可回退，比如先收到已读回执，再收到已收到回执，消息状态应当保持为已读)

### Socket 框架

Socket发送/接受的顶层消息类型有三类: (参见`webrpc.proto: WebRpcMessageType`)
    - `request` 请求 (发送)
    - `response` 响应 (接收)
    - `notify` 推送 (接收)

##### RPC框架

RPC请求实现了类似于http请求的状态维护，使用了其中的`request`和`response`类型数据，流程如下:

- 构造此次rpc唯一的请求id: `seq`
- 使用唯一的rpc id发送`request`类型的Socket数据
- 注册事件等待`response`类型的Socket数据返回
- `response`数据返回且`seq`一致时，将结果作为此次rpc请求的返回值，结束此次rpc请求:
    - 若返回数据`ret`值不为0，或者`param.ret`存在且不为0，则代表请求失败
    - 否则，请求成功

其中融合了部分具体实现:

- 20秒超时
- rpc请求开始时，如果Socket未连接，则会等待Socket连接建立时发送rpc请求数据

##### `notify`事件

Socket接收到`notify`数据时，会触发`onRpcNotify`事件，传递数据内容

##### Socket PB 编码/解码细节实现的隐藏

Socket收发数据均使用Protobuf二进制内容传输，但在代码设计中除Socket框架本身外，应用其余部分不关心也不知道Protobuf二进制传输的底层实现(也包括了单聊的加解密流程)，而是依然使用原生的JS Object对象。

所有关于Protobuf编码/解码以及加解密的二进制处理统一实现于`socketProtoCoders.js`中。具体实现格式为:

- 键为对应的服务名(service name)。如`msgproxy2.SendP2P`, 对应于`chatserver.proto`中的`P2PChatService.SendP2P`；`MsgNtf`，对应于`webnotify.proto`中的`WebNotifyPB`(是`immsgntf.proto: MessageNtfPB`的封装)
- 值包含两部分，可以直接指定一个PB(如果仅为单层PB编码)，也可以指定一个(同步或异步)函数返回编码/解码内容:
    - `encodeRequest`: 编码发送的请求数据。如`msgproxy2.SendP2P`的`encodeRequest`将数据用`SendP2PMessageRequest`PB编码。(注: 推送类型没有这个字段(`MsgNtf`))
    - `decodeResponse`: 解码接收的响应/推送数据。
