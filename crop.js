var spawn = require('child_process').spawn;


/*
 * 裁剪图片
 * @param src 原文件目录
 * @param sizeString 裁剪参数
 * @param out 输出文件名
 * @param fn 回调函数 
 */
exports.cropImg = function(src, sizeString, out, fn ) {

    var php = spawn('php', [__dirname + '/cropimg.php', src , '-o' , out , '-s' , sizeString ]);
    
    // 输出进程PID
    console.log('Crop Process child pid: ', php.pid);

    // 输出流
    php.stdout.on('data', function(data) {
        var data = JSON.parse(data);
        fn&&fn(data);
    });

    php.on('close', function(code) {
        if(code !== 0) {
            var msg = code===5?'不支持的文件类型':'文件不存在';
            fn&&fn({
                'success' : false,
                'code' : code,
                'msg'  : msg
            });
        }
    });
};