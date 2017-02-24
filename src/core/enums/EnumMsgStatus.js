// 消息状态, 从低到高优先级递增 (即不会从高优先级的值退回到低优先级的值)
export default {
    // 自己发出的消息的状态
    MySendFailed: -1,
    MySending: 0,
    MySent: 1,
    MyReceived: 2, // receive ack (对方发送)
    MyRead: 3, // read ack (对方发送)
    MyReadConfirmed: 3, // ack del (自己收到ack后发送)

    // 其他人发来的消息的状态
    OtherReceive: 10,
    OtherReceiveAcked: 11, // 已发送 OtherReceive 回执
    OtherReadAcked: 12 // 已发送 Read 回执
}
