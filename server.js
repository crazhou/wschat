var express = require('express'),
    _       = require('underscore'),
    fs      = require('fs'),
    path    = require('path'),
    ws      = require('./ws'),
    db      = require('./mongo'),
    bodyParser = require('body-parser'),
    multiparty = require('connect-multiparty'),
    crop    = require('./crop');

var app = express();

// 注册html引擎
app.engine('html', function(fileName, options, fn) {
    fs.readFile(fileName,'utf-8', function(err, data) {
        if(err)  {
            fn(err);
            throw err;
        }
        fn(null, _.template(data, options));
    });
});
// 开启模板缓存
app.enable('view cache');

// 默认引擎
app.set('view engine', 'html');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multiparty({'uploadDir': "d:/uploads"}));

// 模板目录
app.set('views', __dirname + '/views');

app.get('/', function(req, res) {
    var ip = req.ip;

    console.log('IP:', ip)
    db.findByIP(ip, function(result) {
        if(result.length > 0) {
            res.render('board', Process_data(result[0]));
        } else {
            res.render('index', {ip : ip});
        }
    });
});

// 用户存入数据库 
app.post('/join_room', function(req, res) {
    var input = req.body,
        ip    = req.ip;
    // 数据准备 
    _.extend(input, {
        signtrue :'欢迎加入我们！',
        status : 1,
        settings : {mainboard_set : 'left', send_shortcut : 1}
    });

    // 防止重复插入
    db.findByIP(ip, function(result) {
        if(result.length > 0) {
            res.send({'success' : false, 'msg' :'用户已存在！'});
        } else {
           db.addUser(input, function(data) {
                ws.updateDB();
                res.send({'success' : true});
            });
        }
    });
});

// 查询聊天记录
app.post('/query_msg', function(req, res) {
    var input = req.body,
        qobj  = _.pick(input, ['from', 'to']);

    if(req.xhr) {
        if(!qobj.to.indexOf('group')) {
            db.getGroupMsg(qobj, function(docs) {
                res.send(docs);
            });
        } else {
            db.getMsg(qobj, function(docs) {
                res.send(docs);
            });
        }
    }
});

// 更新用户设置
app.post('/update_user', function(req, res) {
    var input = req.body,
        tmp1  = _.pick(input, ['nickname', 'signtrue']),
        tmp2  = _.pick(input, ['mainboard_set', 'send_shortcut']);

        _.each(tmp2, function(e,i,o) {
            if(_.indexOf(['1','2'], e) > -1) {
                e = +e;
            }
            tmp1['settings.'+i] = e;
        });

        db.updateUser(input.ip, tmp1, function(data) {
            if(data) {
                // 更新用户列表信息
                res.send({'success': data});
                ws.updateDB();
            }
        });
});

// 更新用户头像
app.post('/update_avtar', function(req, res) {
    var input = req.body,
        head  = input.head;
    if(req.xhr) {
        db.updateUser(input.ip, {head : head}, function(data) {
            if(data) {
                res.send({'success': data});
                ws.updateDB();
            }
        });
    }

});

// 上传新的头像
app.post('/upchatImg', function(req, res) {
    var file = req.files.chatImg,
        // 目标目录
        basePath = __dirname + '/public/chatData/',
        // 图片扩展名
        extName = path.extname(file.name),
        // 新文件名
        tmpName = Math.random().toString();

        // 移动文件
        fs.rename(file.path, basePath +  tmpName + extName, function(err) {
            if(err) throw err;
            res.send({'success' : true, fileName : '/chatData/' +tmpName + extName});
        });
});


// 上传头像,裁剪，更新头像
app.post('/upload_avtar', function(req, res) {
    var file = req.files.avtar,
        body = req.body,
        // 目标目录
        basePath = __dirname + '/public/images/head/',
        // 图片扩展名
        extName  = path.extname(file.name),
        // 新的文件名
        tmpName = Math.random().toString();
    // 不用裁剪
    if(body.coor === 'no') {
        // 移动文件
        fs.renameSync(file.path, basePath +  tmpName + extName);
        // 更新用户头像
        db.updateUser(body.ip, {head : tmpName + extName}, function(resp) {
            if(resp) {
                res.send({'success': resp});
                ws.updateDB();
            }
        });
        
    } else {
        // 裁剪图片
        crop.cropImg(file.path, body.coor, tmpName, function(data) {
            if(data.success) {
                // 移动文件
                fs.renameSync(data.fileName,  basePath + data.fileName);
                // 更新用户头像
                db.updateUser(body.ip, {head :data.fileName}, function(resp) {
                    if(resp) {
                        res.send({'success': data});
                        ws.updateDB();
                    }
                });
            } else {
                res.send(data);
            }
        });
    }
});


// 用户数据处理
function Process_data(data) {
    var tmp = data.head;
    data.head = '/images/head/' + tmp;
    data._id  = data._id.toString();
    return data;
}

var oneday = 86400;
app.use(express.static(__dirname + '/public', {maxAge: oneday}));

app.listen(80);
