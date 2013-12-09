<?php
/*
 * 从base64 字符串生成文件
 * @param $str base64字符串
 * @param $name 文件名
 * @return 文件大小
 */
function saveImage($str, $name) {

    $pos0 = strpos($str, ':');

    $pos1 = strpos($str, ';');

    $pos2 = strpos($str, ',');

    $type = substr(substr($str, $pos0, $pos1-$pos0), 7);

    $data = substr($str, $pos2);

    $file = $name . '.' . $type;
    
    $size = file_put_contents($file,  base64_decode($data));

    if(is_int($size)) {
        return array(
            'fileName' => $file,
            'size' => $size
            );
    } else {
        return FALSE;
    }
}