$(document).ready(function(J){
    
    if(! ('WebSocket' in window)) {
        return alert('抱歉，您的浏览器不支持WebSocket!');
    }

    // 事件绑定
    var panel = $('#headSelect'),

    avtar = $('#avtar').on('click', function (e) {
        e.preventDefault();
        panel.show();
    });

    panel.on('click', 'img', function (e) {
        e.preventDefault();
        var src = this.src;
        avtar.attr('src', src);
        $('#userhead').val(src.slice(-7));
        panel.hide();
    });

    // 表单提示事件
    var form = $('#chat_form').on('submit', function(ev) {

        var inputs = form.find('input.inp'),
            messages = {
                'nickname' :'请填写用户昵称',
                'head' :'请修改默认头像'
            };

        inputs.each(function(i,e) {
            var t = $.trim(this.value);
            if(t === '') {
                ev.preventDefault();
                alert(messages[this.name] + '！');
                return !1;
            }
        });
    });
});