var WebSocket = require('ws').Server,
    wss  = new WebSocket({port:8007}, function () {
        console.log('WebSocket Server has running on port %d', 8007);
    }),
    _   = require('underscore'),
    util = require('util'),
    db   = require('./mongo');

var Clients = {},
    Allclients = [],
    TT = {};

// 获取全部用户
var updateDB = exports.updateDB = function () {
    db.listUser(function(data) {
        _.each(data, function(e,i,o) {
            var tmp = e.head;
            e.head = '/images/head/' + tmp;
        });
        Allclients = data;
    });
};

updateDB();

// 服务器相关动作
var Actions = {
    /*
     * 获取当前时间
     */
    getTime : function() {
        var now = new Date(),
            h   = now.getHours(),
            m   = now.getMinutes(),
            s   = now.getSeconds();
        return (h<10?'0'+h:h) + ':' + (m<10?'0'+m:m)+ ':' +(s<10?'0'+s:s);
    },

    /*
     * 获取用户基本信息List 
     */
    getClientList : function() {
        var k1 = [] ,k2 = [];
        _.each(Allclients, function(e,i,o) {
            var id = e._id.toString();
            if(id in Clients) {
                e.status = 1;
                k1.push(e);
            } else {
                e.status = 0;
                k2.push(e);
            }
        });
        return k1.concat(k2);
    },
    
    /*
     * mess 客户端上报自己的消息
     * client 客户端句柄
     */
    join : function(mess, client) {
        // 给客户添加属性
        _.extend(client ,mess.userInfo);

        // 防止窗口多开 
        var id = client._id;
        if(id in Clients) {
            delete client._id;
            return this.send(client, 'server', '一个IP不能开启多个聊天窗口！', 'cmd', {
                close: true
            });
        } else {
            Clients[id] = client;
        }
        
        if( id in TT) {

            TT[id] && clearTimeout(TT[id]);
            delete TT[id];

        } else {
            // 给其用户广播消息
            this.boardcast(client, mess.nickname + '， 上线了！', 'cmd', {
                fList : this.getClientList()
            });
        }

        // 给自己推送列表
        this.send(client, 'server', '连接成功，加载中...', 'cmd', {
            fList : this.getClientList()
        });
    },
    
    /*
     * id 下线客户的Id
     * nickname 下线客户的昵称
     */
    left : function(id, nickname) {
        delete Clients[id];
        var _this = this;
            TT[id] = setTimeout(function() {
                _this.boardcast('server', nickname + '，下线了！', 'cmd', {
                    fList : _this.getClientList()
                });
                (id in TT) && clearTimeout(TT[id]); delete TT[id];
            }, 1000);
    },

    /*
     * @author Client|'server' 发送者
     * @mess   Text 消息正文
     * @type  cmd|img|text 可选
     * @ext 覆盖前面的对象
     */
    boardcast : function(author, mess, type, ext) {
        var _this = this;
        _.each(Clients, function(e,i,o) {
            
            // 不向发送者发送
            if(author !== 'server' && author._id === i) return false;
            
            _this.send(e, author, mess, type, ext);
        });
    },

    /*
     * @target 目标客户
     * @author 发送者
     * @mess 消息正文
     * @type 消息类型
     * @o 覆盖默认值
     */
    send : function(target, author, mess, type, o) {

        if(author ==='server') {
            author = {
                nickname : 'none',
                _id : 'server'
            };
        }

        if(!target) return false;

        var data = {
            from : author._id,
            nickname : author.nickname,
            to : target._id,
            content : mess, 
            time : this.getTime(),
            type : type||'text'
        };

        if(o)
            _.extend(data, o);
        target.send(JSON.stringify(data));
    }
};

// 得到客户信息
var getClientinfo = function(ws) {
    return  {
        ip : ws._socket.remoteAddress,
        port : ws._socket.remotePort
    };
};

// 处理消息
var parseContent = function(t) {
    return t.replace(/\n/g, '</br>').replace(/\s/g, '&nbsp;');
};

wss.on('connection', function(ws) {

    var info = getClientinfo(ws);

    // 收到消息
    ws.on('message', function(data) {
        var obj = JSON.parse(data);

        obj.content = parseContent(obj.content);
        //  来自客户端的命令
        if(obj.to === 'server' && obj.type === 'cmd') {
            Actions[obj.content] && Actions[obj.content](obj, this);
        }

        // 来自客户端的消息
        if(obj.to !== 'server' && _.indexOf(['text','img'], obj.type) > -1) {

            var target = Clients[obj.to],
                author = Clients[obj.from];

            // 如果为群消息
            if(!obj.to.indexOf('group')) {
                Actions.boardcast(author, obj.content, obj.type, {
                    'showIn' : obj.to //决定显示在哪个窗口
                });
            } else {
                Actions.send(target, author, obj.content, obj.type);
            }

            
            // 保存消息到数据库
            db.newMsg(obj, function(docs) {

            });

            // 给发送者发消息
            Actions.send(author, author, obj.content, obj.type, {
                'showIn' : obj.to, // 决定显示在哪个窗口
                'is_self' : true
            });
        }

    });

    // 客户丢失
    ws.on('close', function(e) {
        if(this._id) {
            Actions.left(this._id, this.nickname);     
            this.terminate();
        }
    });

});