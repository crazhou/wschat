/**
 * FR 窗口类
 * Author : Zhouhuahui
 * Date : 2013.11.14
 */
 (function(w, u) {
    var d    = w.document,
        body = d.body, 
        opts = null;

    function FrWin (html, opt) {
        
        var _this = this;

        // 覆盖默认参数 
        opts = $.extend({
            onclose: $.noop,
            onopen : $.noop,
            onok   : $.noop,
            width : 600,
            top : 150
        }, opt);

        $(body).append(html);

        // 窗口主体
        this.$win = $('.fr_box').attr('id', _.uniqueId('win_'))
                    .width(opts.width)
                    .css({'margin-left': opts.width/-2, 'top' : opts.top});
        // 窗口内容区域
        this.$cont = this.$win.find('.fr_content');
        // 事件绑定
        this.$win.on('click', '.close,.cancel', function(e) {
            _this.close();
        });
        this.$win.on('click', '.sure', function(e){
            opts.onok(_this.$cont)&&_this.close();
        });
    }

    $.extend(FrWin.prototype, {
        'open' : function(html, fn) {
            this.$cont.append(html);
            fn&&fn(this.$cont);
            opts.onopen(this.$cont);
        },

        'close' : function(fn) {
            this.$win.remove();
            fn&&fn(this.$cont);
            opts.onclose(this.$cont);
        }
    });

    w.FrWin = FrWin;

 })(this);

 /*
  * 桌面通知类
  */
 (function(w){

    var NO = function (icon, title, content) {
        var _instance = new Notification(title, {
            body : content, 
            icon : icon
        });

        this.close =  function() {
            _instance.close();
        };
    };

    _.extend(NO, {
        'isSupport' : function() {
            return 'Notification' in window;
        },
        'request' : function(cb) {
            Notification.requestPermission(cb);
        },
        
    });

    w.Notify = NO;
})(this);