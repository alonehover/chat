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

// 分配用户昵称
function assignGusetName(socket,guestNumber,nickNames,namesUsed){
    var name = 'Guest' + guesrNumber;
    nickNames[socket.id] = name;
    socket.emit('nameRusult',{
        success: true,
        name: name
    });
    namesUsed.push(name);
    return guestNumber + 1;
}

// 进入聊天室
function joinRoom(socket,room){
    socket.join(room);
    currentRoom[socket.id] = room;

    socket.emit('joinResult',{
        room: room
    });

    socket.broadcast.to(room).emit('message',{
        text: nickNames[socket.id] + ' has joined ' + room + '.'
    });

    var userInRoom = io.socket.clients(room);
    if (userInRoom.length > 1) {
        var usersInRoomSummary = 'Users currently in ' + room + ': ';
        for (var index in usersInRoom){
            var userSocketId = usersInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message',{text: usersInRoomSummary});
    }
}

// 发送信息
function handleMessageBroadcasting(socket){
    socket.on('message', function(message){
        socket.broadcast.to(message.room).emit('message',{
            text: nickNames[socket.id] + ': ' + message.text
        })
    })
}

// 变更昵称
function handleNameChangeAttempts(socket,nickNames,namesUsed){
    socket.on('nameAttempt',function(name){
        if (name.indexOf('Guest') == 0) {
            socket.emit('nameResult',{
                success: false,
                message: 'Names cannot begin with "Guest".'
            });
        }else {
            if (namesUsed.indexOf(name) == -1) {
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult',{
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text: previousName + 'is now known as ' + name + '.'
                });
            }else {
                socket.emit('nameResult',{
                    success: false,
                    message: 'That name is already in use.'
                });
            }
        }
    })
}

// 创建房间
function handleRoomJoining(socket){
    socket.on('join', function(room){
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room,newRoom);
    })
}

function handleClientDisconnection(socket){
    socket.on('disconnect', function(){
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}
