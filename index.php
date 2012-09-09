<?php


require_once "config.php";
require_once "{$ROOT_PATH}/common/php/util.php";
require_once "db.php";

date_default_timezone_set('Asia/Shanghai');
connect_db();


$unbooked_list = get_unbooked_list();
$booked_list = get_booked_list();
$discarded_list = get_discarded_list();
//var_dump($booked_list);

include "index.phtml";

?>