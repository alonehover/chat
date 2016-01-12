var http = require("http");
var fs = require("fs");
var path = require("path");
var mime = require("mime");
var cache = {};

// 404报错
function send404(res){
    res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
    res.write('Error 404: 资源文件没有找到');
    res.end();
}

// 发送内容
function sendFile(res,filepath,fileContent){
    res.writeHead(200,{'Content-Type':mime.lookup(path.basename(filepath))});
    res.end(fileContent);
}

// 查看是否存在缓存
function serverStatic(res,cach,absPath){
    if (cach[absPath]) {
        sendFile(res,absPath,cach[absPath]);
    }else {
        fs.exists(absPath,function(exists){
            if (exists) {
                fs.readFile(absPath,function(err,data){
                    if (err) {
                        send404(res);
                    }else {
                        cach[absPath] = data;
                        sendFile(res,absPath,data);
                    }
                })
            }else {
                send404(res);
            }
        });
    }
}

var server = http.createServer(function(req,res){
    var filepath = false;
    if (req.url == '/') {
        filepath = 'public/index.html';
    }else {
        filepath = 'public/' + req.url;
    }

    var absPath = './' + filepath;
    serverStatic(res,cache,absPath);
});

server.listen(8888,function(){
    console.log("服务运行中......，端口监听 ：8888");
});

var chatServer = require('./lib/chat_server');
chatServer.listen(server);
