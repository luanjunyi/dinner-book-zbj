<?php

require_once "config.php";
require_once "{$ROOT_PATH}/common/php/util.php";
require_once "db.php";

$api_name = $_GET['method'];

header('Content-type: application/json');

date_default_timezone_set('Asia/Shanghai');
connect_db();

if ($api_name == "add-booking") {
  $employee = $_REQUEST['employee'];
  echo add_booking($employee);

} else if ($api_name == "remove-booking") { 
  $employee = $_REQUEST['employee'];
  echo remove_booking($employee);

} else if ($api_name == "discard-booking") {
  $employee = $_REQUEST['employee'];
  echo discard_booking($employee);

} else if ($api_name == "claim-candidates") {
  echo get_claim_candidates();

} else if ($api_name == "claim-discarded") {
  $old = $_REQUEST['old_owner'];
  $new = $_REQUEST['new_owner'];
  echo claim_discarded($old, $new);

} else {
  echo json_encode(array('error'=>"Unknow api type:({$api_name})"));
}


?>