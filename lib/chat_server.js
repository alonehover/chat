var socket = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server){
    // 启动Socket.io服务器 ，允许搭载在已有的http服务器上
    io = socket.listen(server);

    io.set('log level',1);

    io.socket.on('connection',function(socket){
        guesrNumber = assignGusetName(socket,guestNumber,nickNames,namesUsed);
    });

    // 当用户连接上来时把他放入聊天室Lobby
    joinRoom(socket,'Lobby');

    // 处理用户的消息，更名，以及聊天室的创建和变更
    handleMessageBroadcasting(socket,nickNames);

    handleNameChangeAttempts(socket,nickNames,namesUsed);

    handleRoomJoining(socket);

    // 用户发出请求时，向其提供已经被占用的聊天室的列表
    socket.on('rooms',function(){
        sockect.emit('room',io.sockets.manager.rooms);
    });

    // 定义用户断开连接后的清除逻辑
    handleClientDisconnection(socket,nickNames,namesUsed);
}
