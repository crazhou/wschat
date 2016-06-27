var mongodb     = require('mongodb'),
    MongoClient = mongodb.MongoClient,
    _           = require('underscore');

// 数据库配置 
var config = {
  host : '127.0.0.1',
  dbname : 'chatdb',
  port : 27007,
  username : 'root',
  password : '10000'
};

  function SimDb() {
    var DB = null,
        // 获取数据库连接
        getDB = function (fn) {
          MongoClient.connect(
              _.template('mongodb://<%=host%>:<%=port%>/<%=dbname%>',config),
              function(err, db) {
                if(err) throw err;
                DB = db;
                fn && fn(db);
          });
        },

        // 关闭连接
        closeDB = function() {
          if(DB!==null)
            DB.close();
        };
        // 列出全部用户
        this.listUser = function(fn) {
          getDB(function(db) {
            db.collection('users')
              .find(null,{'ip':0})
              .toArray(function(err, result) {
                  if(err) throw err;
                  fn(result);
                  closeDB();
              });
          });
        };

        // 插入用户
        this.addUser = function(data, fn) {
            getDB(function(db) {
                  db.collection('users')
                    .insert(data, function(err, docs) {
                        if(err) throw err;
                        fn(docs);
                        closeDB();
                    })
            });
        };

        // 查找用户
        this.findByIP = function(ip, fn) {
          getDB(function(db) {
            db.collection('users')
              .find({ip:ip})
              .toArray(function(err, result) {
                  if(err) throw err;
                  fn(result);
                  closeDB();
              });
          });
        };

        // 更新用户信息
        this.updateUser = function (ip, obj, fn) {
          getDB(function(db) {
            db.collection('users')
              .update({'ip':ip}, {'$set':obj}, {safe:true}, function(err) {
                  if(err) 
                    throw err;
                  else {
                    fn(true);
                    closeDB();
                  }
              });
          });
        }

        // 插入消息
        this.newMsg = function(obj, fn) {
          obj.time = new Date();
          getDB(function(db){
            db.collection('messages')
              .insert(obj, function(err, docs){
                  if(err) throw err;
                    fn(docs);
                    closeDB();
              });
          });
        };

        // 读取消息
        this.getMsg = function(obj, fn) {
            getDB(function(db) {
              var arr = [obj.to, obj.from];
              db.collection('messages')
                .find({'from' : { '$in' : arr }, 'to' : { '$in' : arr}})
                .sort({time:-1}).limit(20)
                .toArray(function(err, result) {
                    if(err) throw err;
                    fn(result.reverse());
                    closeDB();
                });
            });
        };

        // 读取群消息
        this.getGroupMsg = function(obj, fn) {
          getDB(function(db) {
            db.collection('messages')
              .find({to : obj.to})
              .sort({time:-1}).limit(20)
                .toArray(function(err, result) {
                    if(err) throw err;
                    fn(result.reverse());
                    closeDB();
                });
          });
        };

        // 读取图片消息
        this.getImg = function(fn) {
          getDB(function(db){
              db.collection('messages')
                .find({type : 'img'}, {'content' :1})
                .toArray(function(err, result){
                  if(err) throw err;
                  fn(result);
                  closeDB();
                });
          });
        };

    }

    module.exports = new SimDb