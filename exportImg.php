<?php

require 'base64.php';

$con = new MongoClient('mongodb://root:10000@localhost:27007/chatdb', array(
        'connect' => TRUE
    ));

$db = $con->selectDB('chatdb');

$res = $db->messages->find(array(
    'type'=>'img'
    ), array(
    'content' => 1
    ));

while($res->hasNext()) {
    
    $arr = $res->getNext();
    $id = (string) $arr['_id'];
    $cont = $arr['content'];

    if(strpos($cont, 'data:')===0) {
        $mar  = saveImage($cont, 'chatData/'.$id);
    } else {
        $mar = 'is URL..';
    }

    if(is_array($mar)) {
        $db->messages->update(array(
                '_id' => new MongoId($id),
                'type' => 'img',
            ), array(
                '$set' => array('content' => '/chatData/' . $mar['fileName']),
            ));
        printf("FileName : %s FileSize :  %dKB \n\r",$mar['fileName'], $mar['size']/1024);
    }
    else
        printf("Error : %s \n\r", $mar);
}


$con->close();