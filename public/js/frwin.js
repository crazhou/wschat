/**
 * FR 窗口类
 * Author : Zhouhuahui
 * Date : 2013.11.14
 */
 (function(w, u) {
    var d    = w.document,
        body = d.body;

    function FrWin (html, opt) {
        
        var _this = this;

        // 覆盖默认参数 
        var opts = $.extend({
            onclose: $.noop,
            width : 600,
            top : 150
        }, opt);

        $(body).append(html);

        // 窗口主体
        var _id = _.uniqueId('win_');
        $('.fr_box:last').attr('id', _id);
        this.$win = $('#' + _id)
                    .width(opts.width)
                    .css({'margin-left': opts.width/-2, 'top' : opts.top});
        
        // 窗口内容区域
        this.$cont = this.$win.find('.fr_content');
        // 事件绑定
        this.$win.on('click', '.close,.cancel', function(e) {
            _this.close(opts.onclose);
        });
        this.$win.on('click', '.sure', function(e) {
            opts.onok(_this.$cont)&&_this.close();
        });
    }

    $.extend(FrWin.prototype, {
        'open' : function(html, fn) {
            this.$cont.html(html);
            this.$win.removeClass('dsn');
            fn&&this.opened===undefined&&fn(this.$cont);

            // 窗口已经打开 
            this.opened = true;
        },

        'close' : function(fn) {
            this.$win.addClass('dsn');
            fn&&fn(this.$cont);
            this.opened = false;
        }
    });

    w.FrWin = FrWin;

 })(this);

 /*
  * 桌面通知类
  */
 (function(w){

    w.addEventListener('load', function () {

        console.log('Called !');
      Notification.requestPermission(function (status) {
        // This allows to use Notification.permission with Chrome/Safari

        console.log('status : %s', status);
        if (Notification.permission !== status) {
          Notification.permission = status;
        }
      });
    });

    var NO = function () {

        var _instance = false,
            _permission = false;

        this.show = function (icon, title, content) {


            console.log('Called!')
            this.request(function(permission) {
                _permission = permission;

                console.log('Permission : %s', permission);
                if(permission === 'granted')
                 _instance = new Notification(title, {
                        body : content, 
                        icon : icon
                });
            });
        };

        this.close =  function() {
            _instance.close();
        };
    };

    _.extend(NO.prototype, {
        'isSupport' : function() {
            return 'Notification' in window;
        },
        'request' : function(cb) {
            Notification.requestPermission(cb);
        },
        
    });

    w.Notify = new NO();
})(this);