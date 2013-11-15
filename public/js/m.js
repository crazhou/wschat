(function(w){
  // 构造函数
   w.Drag = function(wrapElement,dragElement,event) {
   	   var me = this;
       me.$wrap = $("#"+wrapElement);//最外包裹的层
       me.$drag = $("#"+dragElement);//拖动区域的外层
       me.$close = me.$drag.find('.close'); // 关闭按钮
       me.$toggle = me.$drag.find('.bn:first'); // 切换窗口

    var opt = _.extend({
      open:$.noop,
      close:$.noop
    }, event);
    // 打开后的回调
    opt.open(me.$wrap);
    // 提升本窗口
    me.$wrap.mousedown(function(){me.uptoTop()});


    // 双击事件
    me.$drag.dblclick(function(e){me.toggleSize(e, me.$toggle[0]);});
    // 鼠标按下 
	   me.$drag.mousedown(function(e){me.mousedown(e)});
	   // 鼠标抬起
     me.$drag.mouseup(function(e){me.mouseup(e)});
     // 窗口关闭
	   me.$close.click(function(e){me.close(e);opt.close(me.$wrap)});
     // 切换窗口
     me.$toggle.click(function(e){me.toggleSize(e, this);});
   };

   // 原型
   w.Drag.prototype = {
      // 窗口提升与放置
      place : function(obj) {
        var win = this.$wrap.css(obj);
      },

      // 提升本窗口
      uptoTop : function() {
        
        var size = $('.talk').css('z-index', 1).size();

        this.$wrap.css('z-index', size+1);
      },

      // 切换窗口
      toggleSize : function(e,t) {
        var t = $(t),
            talk = this.$wrap,
            cont = talk.find('.talk_f');

        if(t.hasClass('max')) {
          t.removeClass('max').addClass('back');

          this.oriSize = _.extend({
              width: 500,
              height: 590
          }, talk.offset());

          talk.css({width:'100%', height:'100%', top:0, left:0});

          cont.height(talk.height()-260);

        } else {
          t.removeClass('back').addClass('max');
          talk.css(this.oriSize);
          cont.height(330);
        }
      },

   	  mousedown:function(e) {
   	   	  var me = this;
   	   	  me.$wrap.bind('selectstart',function(){return false;});
    			offsetT = $(me.$wrap).get(0).offsetTop;//相对TOP
    			offsetL =$(me.$wrap).get(0).offsetLeft;//相对LEFT
    			downX = e.clientX;//按下鼠标的时候的TOP
    			downY = e.clientY;//按下鼠标时候的LEFT
    			$(document).mousemove (function(e){
    				me.$wrap.css('top',offsetT + (e.clientY - downY));
    				me.$wrap.css('left',offsetL + (e.clientX - downX));
		      });
   	  },

   	  mouseup:function() {
        var me = this;
        me.$wrap.off('selectstart');
        $(document).off('mousemove');
   	  },

   	  close:function() {
   	    this.$wrap.remove();
      }
   	};

})(window);