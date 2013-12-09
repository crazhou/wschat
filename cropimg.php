<?php
/* 
 * Author: zhouhuahui
 * 裁剪图片到目标尺寸
 */

// 目标尺寸
$targetSize = array(100, 100);

// 获取文件扩展名
function extName($file) {
    return strtolower(pathinfo($file, PATHINFO_EXTENSION));
}


/* 裁剪最后输出png格式的图片
 * @param $fileName 原文件名
 * @param $sizeString 10|10|140|170 源图片裁剪参数 
 * @param $targetFilename 目录文件名
 */
function cropImagepng($fileName, $sizeString, $targetFilename) {

    global $targetSize;

    $size = explode('|', $sizeString);
    
    if(file_exists($fileName)) {

        // 得到图片信息
        $imageInfo = getimagesize($fileName);

        // 目标文件
        $target = imagecreatetruecolor($targetSize[0], $targetSize[1]);
        // 得到白色
        $white = imagecolorallocate($target , 255, 255, 255);
        // 填充白色
        imagefill($target, 0, 0, $white);

        // 得到源文件资源链接 1 gif 2 jpg 3 png
        if(in_array($imageInfo[2], array(2, 3), TRUE)) {
            $src = $imageInfo[2]===2 ? imagecreatefromjpeg($fileName) : imagecreatefrompng($fileName);
        } else {
            // 不支持的文件类型
            exit(5);
        }

        // 裁剪图片
        imagecopyresampled($target, $src, 0, 0, $size[0], $size[1], $targetSize[0], $targetSize[1], $size[2], $size[3]);
        // 保存并销毁图片
        imagepng($target, $targetFilename . '.png');

        return imagedestroy($target);
    } else {
        // 10 文件不存在
        exit(10);
    }
}

//  命令行执行
if(in_array('-o', $argv) && in_array('-s', $argv)) {
    $oindex = array_search('-o', $argv);
    $sindex = array_search('-s', $argv);
    $o = $argv[$oindex+1];
    $s = $argv[$sindex+1];
    $file = $argv[1];
    // printf('Filename : %s, output : %s.png , param : %s', $file, $o, $s);
    
    $resu = cropImagepng($file, $s, $o);

    if($resu) {
        echo json_encode(array('fileName' => $o . '.png', 'success' => TRUE));
    }

} else {
    echo  '参数错误 -o 指定输出文件名， -s 指定裁剪坐标和尺寸';
}