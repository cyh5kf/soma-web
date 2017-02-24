/* protobuf 使用示例:

import {encodeProto, decodeProto, WebRpcMessage, TestProto} from './protos';

// 编码为二进制
const webRpcMsgBytes = encodeProto(WebRpcMessage, {
    type: 1,
    seq: 2,
    method: 'test_method'
});

// 二进制解码
const decodedMsg = decodeProto(WebRpcMessage, webRpcMsgBytes);

封装后Proto类型与JS类型的映射关系:
  - int64/uint64 -> "string"
  - string - "string"
  - bytes - "ArrayBuffer"
  - int32/uint32/float/... -> "number"

 */

import protobufjs from 'protobufjs';
import protosJson from './protos.json';

const builder = protobufjs.loadJson(protosJson);
const appProtos = builder.build().app;

module.exports = {
    ...appProtos,

    /**@param {Proto} Proto
     * @param {Object} data js对象
     *
     * @return {ArrayBuffer} */
    encodeProto(Proto, data) {
        return (new Proto(data)).encodeAB();
    },

    /**@param {Proto} Proto
     * @param {ArrayBuffer} bytes
     *
     * @return {Object} 返回js对象, "Long" 类型映射为 "string" */
    decodeProto(Proto, bytes) {
        return Proto.decode(bytes).toRaw(false, true);
    }
};
