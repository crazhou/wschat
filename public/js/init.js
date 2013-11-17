$(function(J) {
    if(! ('WebSocket' in window)) {
        return alert('抱歉，您的浏览器不支持WebSocket!');
    }

    // 主面板拖动
    var mainboard = new Drag('fList', 'fList_h');

    /*
     * 获取主面板初始位置
     */
    function getMainCoor() {
      var im = {
        left : {
          top: 10,
          left: 10,
          right : 'auto'
        },
        right : {
          top :10,
          right: 10,
          left : 'auto'
        }
      };

      return im[ChatObj.user.settings.mainboard_set];
    }

     /* 黑色提示
      * @msg 消息正文
      * @t 停留时间，默认3秒, 传0为常驻提醒 
      */
     function notify(msg, t) {
        var noti = $('.notify');
        if(t === 0) {
            return noti.html(msg).show();
        }
        var t = t||3;
        noti.html(msg)
            .show()
            .delay(t*1000)
            .fadeOut(300);
     }

     /*
      * 消息标题提示器
      * text
      */
    var Titletip = {
      'start' : function(m) {

        if(!this.enabled) return false;

        this.stop();

        // 定时器
        this.TT = setInterval(function() {
            document.title = m;
            var tmp = m.charAt(0);
            m = m.slice(1);
            m += tmp;
        },800);
      }, 

      'stop' : function() {
        if(typeof this.TT === 'number') {
            clearInterval(this.TT);
            document.title = this.oldtitle;
            this.TT = false;
        }
      },

      'enabled' : false,

      'oldtitle' : document.title
    };

    /**
     * 载入模板
     */
    var Defer = (function(){
      return $.get('template.html', function(text) {
        $('#temp_cont').html(text);
      }, 'html');
    })();

    Defer.done(function(text, status) {
          ChatObj.renderFlist = _.template($('#main_List').html());
          ChatObj.renderMsg = _.template($('#chat_one').html());
          ChatObj.renderWindow = _.template($('#fr_box').html());
          ChatObj.renderSettings = _.template($('#tpl_settings').html());
          ChatObj.renderUpload = _.template($('#tpl_upload').html());
    });
     /*
      * 渲染好友列表
      * @data 用户数组 
      */ 
     function renderFlist (data) {
        var tmp = [], 
            fList = $('#fList_list');

        if(data.fList.length >= 2) {
            // 加入广播
            tmp.push({
                nickname:'群聊广场',
                _id : 'group001',
                head : '/images/head/icon.png',
                signtrue: '这里发送的消息，所有人都可见！',
                status : 1
            });
            // 加入群组
            ChatObj.fList[tmp[0]._id] = tmp[0]; 
        }
        // 过滤自己
        _.each(data.fList, function(e,i,o) {
            if(e._id !== Current_user._id) {
                tmp.push(e);
                // 加入共享List
                ChatObj.fList[e._id] = e;
            }
        });

        Defer.done(function(){
          fList.html(ChatObj.renderFlist({fList:tmp}));
        });
     }

     /*
      * 格式化得到当前时间
      * @i 标准时间字符串
      */
     function getTime(i) {
        var now = new Date(i),
            h   = now.getHours(),
            m   = now.getMinutes(),
            s   = now.getSeconds();
        return (h<10?'0'+h:h) + ':' + (m<10?'0'+m:m)+ ':' +(s<10?'0'+s:s);
    }

    /*
     *滚动消息窗口
     *@m 为当前窗口Ul
     */ 
    function MsgScroll(m) {
        var par = m.parent(),
            hei = m.height();
            if(hei>320) {
                par.animate({scrollTop: hei}, 300);
            }
     }

     /*
      * 末打开聊天窗口时的消息计数器
      * @id 为发送者ID
      */
     function MsgTips(id) {

        if(!winList[id]) {
            var tmp = winList[id] = {count : 1};
        } else {
            var tmp = winList[id];
                tmp.count++;
        }
        var m = tmp.count;
        $('#T' + id).html(m).show();
     };

     /* 
      * 发送图片
      * @id 目标用户id
      * @file 文件对象
      */
     function sendImg(id, file) {
        var ext = file.name.split('.').pop().toLowerCase();
        if(_.indexOf(['jpg','jpeg','png','gif'], ext) < 0) {
            return notify('非法的文件类型，请选择图片!');
        }
        if(file.size/1024 > 1024) {
            return notify('文件过大，请选择小于1M的图片！');
        }
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            var result = this.result;
            // 发送图片
            ChatObj.send(id, result, 'img');
        }
     }
     /** 匹配网址
      * content
      */
      function matchUrl(s) {
        var reg = /[^>]?(https?:\/\/[\w_\/\.\-\?\#\=]+)/gm;
        return s.replace(reg, function(a, b){return '<a href="'+b+'" target="_blank">'+b+'</a>'})
      }

     /*
      * 获取消息记录，默认最近20条
      * to 可以为对方Id, 或讨论组ID;
      * from 默认为自己;
      */
     function getMsgList(to, from) {
        var from = from || ChatObj.user._id;
        $.post('/query_msg', {
            from : from,
            to : to
        }, function(data) {
            $.each(data, function(i,e) {
                e.time = getTime(e.time);
                e.is_self = to!==e.from;
                e.content = matchUrl(e.content);
            });
            winList[to].renderMsg(data);
        }, 'json');
     };

     // 聊天共享对象
     var ChatObj = {
        is_ok : false, // 当前连接状态 

        user : Current_user, // 当前用户信息
        
        mess_cb : $.noop, // 收到消息的回调
        
        close_cb : function() { // 连接中断的回调
            this.is_ok = false
            notify('连接已中断，请尝试刷新！', 0);
        },

        renderMsg : false, // 渲染消息函数

        renderFlist : false, // 渲染好友列表

        renderWindow : false,  // 渲染弹出窗口

        renderSettings : false, // 设置模板

        renderUpload : false, //修改头像模板

        fList : {},  // 用户List

        send : $.noop, // 发送消息

        KeyDevide : function(e) { //快捷键决策
          var tmp = this.user.settings.send_shortcut;
          if(tmp === 1) {
            return e.ctrlKey && e.which === 13;
          } else {
            return e.which === 13 && !e.ctrlKey;
          }
        }
     };

    (function(C) {

         // 建立WebSocket 连接 
        var handle = new WebSocket('ws://localhost:8007');

        handle.onclose = function() {
            C.close_cb();
        };

        // 收到消息
        handle.onmessage = function(e) {
            var data = JSON.parse(e.data);
            // 更新用户列表
            if(data.type === 'cmd') {
                notify(data.content);
                data.fList && renderFlist(data);
            }

            // 收到用户消息
            if(_.indexOf(['text','img'], data.type) > -1) {

                Titletip.start(data.nickname +'，来消息了。。。');

                if(data.showIn) {
                    // 来自己或群
                    var id = data.showIn;
                    data.is_self = true;
                } else {
                    // 来自他人
                    var id = data.from;
                    data.is_self = false;
                }

                // 处理网址
                data.content = matchUrl(data.content);

                if(winList[id] && winList[id].open) {
                    // 渲染消息
                    winList[id].renderMsg([data]);

                } else {
                    // 未读消息记数器
                    if(!data.is_self || !id.indexOf('group')) {
                        MsgTips(id);
                    }
                }
            }
        };

        // 连接成功
        handle.onopen = function(e) {
            if(this.readyState === this.OPEN) {
                // 上送当前用户信息
                C.send(false, 'join', 'cmd', {
                    userInfo : C.user
                });
                C.is_ok = true;
            }
        };

        /*
         * @to 消息发给谁
         * @mess 消息内容
         * @type 消息类型
         * @ext 覆盖对象
         */
        C.send = function(to, mess, type, ext) {
            var data = {
                nickname : C.user.nickname,
                from : C.user._id,
                to   : to || 'server',
                type : type || 'text',
                content : mess
            };
            if(ext)
                _.extend(data, ext);

            handle.send(JSON.stringify(data));
        };

     })(ChatObj);

     var deviWin = function() {
         // 窗口初始参数 
         var winInfo = {
            top: 10,
            left : 350,
            'z-index' : 1
         };

        var talk = $('.talk'),
            change = false,
            index = talk.size();

        talk.each(function(i,e) {
            var p = $(this).position();
            if(winInfo.top === p.top && winInfo.left === p.left) {
                change = true;
                return false;
            }
        });

        if(change) {
            winInfo.top += 20;
            winInfo.left += 20;
            winInfo['z-index'] = index++;
        }
        return winInfo;
     };

     // 本地维护,好友列表对象 
     var winList = {};

     // 打开聊天窗口
     $('#fList_list').on('dblclick', 'li', function(e) {
            var t = $(this),
                id = t.attr('data-id');

            var info = ChatObj.fList[id],
                html = _.template($('#chat_box').html(), info);
          

            // 判断是否已经打开窗口
            if(!winList[id] || !winList[id].open) {

                $('body').append(html);

                // 关闭消息
                t.find('.msg_tip').hide();

                // 得到消息区域
                var tmpList = $('#A' + id).find('.tlistA');

                winList[id] = {
                    open : true,
                    count : 0,
                    renderMsg : function (data) {
                        tmpList.append(ChatObj.renderMsg(data));
                        MsgScroll(tmpList);
                    }
                };

                // 加入聊天记录
                getMsgList(id);
                // 窗口对象
                winList[id].win = new Drag('A' + id, 'A_H'+id, {
                    close : function(win) {
                        winList[id].open = false;
                    },
                    open : function(win) {
                        // 快捷键发送
                        var input = win.find('.readySend').keydown(function(e) {
                            if(ChatObj.KeyDevide(e)) {
                                e.preventDefault();
                                var t = $(this),
                                    v = _.escape($.trim(t.val()));
                                if(v==='') {
                                    return notify('消息内容不能为空');
                                }
                                ChatObj.send(id, v, 'text');
                                t.val('');
                            }
                        });

                        // 粘贴事件
                        input.on('paste', function(e) {
                          var event = e.originalEvent,
                              clipData = event.clipboardData;
                        });

                        // 按钮发送
                        win.find('.sendBtn').on('click', function(e) {
                            var v = _.escape($.trim(input.val()));
                            if(v==='') {
                                return notify('消息内容不能为空');
                            }
                            ChatObj.send(id, v, 'text');
                            input.val('');
                        });
                        // 清除内容
                        win.find('.omg').on('click', function(e) {
                            $('#A' + id).find('.tlistA').html('');
                        });
                        // 上传图片
                        win.find('.up').on('click', function(e) {
                            $('#upload_hidden').click().off('change').on('change', function(e){
                                sendImg(id, this.files[0]);
                            });
                        });
                    }
                });

                // 放置窗口
                winList[id].win.place(deviWin());

            } else {
                //窗口提升代码
                winList[id].win.uptoTop();
            }

     });

    //  放置主面板
    mainboard.place(getMainCoor());

    // 桌面通知
    $(document).on('webkitvisibilitychange', function(e) {
        var show = Titletip.enabled = this.webkitHidden;
        if(!show)
          Titletip.stop();
    });
    // 两个窗口
    var win1, win2;

    Defer.done(function(text, status) {
      // 设置窗口
       win1 = new FrWin(ChatObj.renderWindow({title:'设置'}), {
        'onok' : function(win) {
            var form = win.find('#setting_form'),
                nickname = form.find('#nickname'),
                v = $.trim(nickname.val());

            if(v === '') {
              notify('昵称不能为空！');
              return false;
            }

            var data = form.serialize();

            $.post('/update_user', data, function(resp) {
                if(resp.success) {
                  notify('修改成功，正在刷新页面...');
                  win1.close();
                  setTimeout(function(){
                    location.reload();
                  }, 1000);
                }
            }, 'json');
          }
        });
       // 修改头像窗口
       win2 = new FrWin(ChatObj.renderWindow({title:'修改头像'}), {
            'width' : 800,
            'top'  : 80
        });
    });

    $('.settings').on('click', function(e) {
          var cont = ChatObj.renderSettings(ChatObj.user);
          win1.open(cont);
    });

    // 设置头像
    $('#avtar').on('click', function(e) {
          // 窗口内容
          var cont = ChatObj.renderUpload(ChatObj.user);

          win2.open(cont, function(w) {
            // 选项卡
            var input_hidden = $('#upload_hidden');
            w.on('click', '.but', function(e) {
                var index = $(this).index(),
                    tabs = w.find('.img_back,.img_inner');
                tabs.addClass('dsn').eq(1-index).removeClass('dsn');
                if(index) {
                  input_hidden.click();
                }
            });
            // 选择系统图片
            w.on('click', '.img_back', function(e) {
              var target = $(e.target),
                img = w.find('#preview');
                if(target.is('img')) {
                  var url = target.attr('src');
                  img.attr('src', url);
                }
            });
          });
    });
});