function divEscapedContentElement(message){
    return $("<div></div>").text(message);
}

function divSystemContentElement(message){
    return $("<div></div>").html('<i>' + message + '<i/>');
}

// 判断用户输入的内容
function processUserInput(chatApp, socket){
    var message = $("#send-message").val();
    var systemMessage;

    if (message.charAt(0) == '/'){
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }else {
        chatApp.sendMessage($("#room").text(),message);
        $('#messages').append(divEscapedContentElement(message));
        $('#messages').scrollTop($('#message').prop('scrollHeight'));
    }
}


// 初始化
var socket = io.connect();

$(document).ready(function(){
    var chatApp = new Chat(socket);

    // 更名
    socket.on('nameResult', function(result){
        var message;

        if (result.success) {
            message = '你现在的名字是：' + result.name + '.';
        }else {
            message = result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    });

    // 房间变更
    socket.on('joinResult', function(result){
        $("#room").text(result.room);
        $("#messages").append(divSystemContentElement('Room changed'));
    });

    // 显示接收信息
    socket.on('message',function(message){
        var newElement = $("<div></div>").text(message.text);
        $("messages").append(newElement);
    });

    // 显示房间列表
    socket.on('rooms',function(rooms){
        $("#room-list").empty();

        for(var room in rooms){
            rom = room.substring(1,room.length);
            if (room != '') {
                $("#room-list").append(divEscapedContentElement(room));
            }
        }

        // 点击房间名切换房间
        $("#room-list div").click(function(event) {
            chatApp.processCommand('/join '+ $(this).text());
            $("#send-message").focus();
        });
    });

    var refresh = setInterval(function(){
        socket.emit('rooms');
    },1000);

    $("#send-message").focus();

    $("#send-form").submit(function(){
        processUserInput(chatApp,socket);
        return false;
    });
})
