<?php

/*
  Order status:
  BOOKED,
  CANCELED,
  WAITING_TRANSFER,
  FETCHED,

  Error code:
  0: success
  -1: uncategorized error
  -10: booking past deadline
  -11: duplicate booking
  -12: unbooking past deadline
  -13: discard before deadline
  -14: claiming discarded before deadline
 */


function get_unbooked_list() {
  $today = date("Y-m-d");
  $sql = "select id from employee where not exists (select * from booking where booking.employee_id = id and booking_date = '$today')";
  $ret = sql_or_die($sql);
  $list = array();
  while ($cur = mysql_fetch_row($ret)) {
    $list[] = $cur[0];
  }
  return $list;
}

function get_booked_list() {
  $today = date("Y-m-d");
  $sql = "select employee_id from booking where booking_date = '$today' and status = 'BOOKED'";
  $ret = sql_or_die($sql);
  $list = array();
  while ($cur = mysql_fetch_row($ret)) {
    $list[] = $cur[0];
  }
  return $list;
}

function get_claim_candidates() {
  $today = date("Y-m-d");
  $sql = "select employee_id from booking where booking_date = '$today' and status = 'WAITING_TRANSFER'";
  $ret = sql_or_die($sql);
  $list = array();
  while ($cur = mysql_fetch_row($ret)) {
    $list[] = $cur[0];
  }

  $free_list = get_unbooked_list();
  foreach ($free_list as $cur) {
    if (! in_array($cur, $list)) {
      $list[] = $cur;
    }
  }
  return json_encode($list);
}

function get_discarded_list() {
  $today = date("Y-m-d");
  $sql = "select employee_id from booking where booking_date = '$today' and status = 'WAITING_TRANSFER'";
  $ret = sql_or_die($sql);
  $list = array();
  while ($cur = mysql_fetch_row($ret)) {
    $list[] = $cur[0];
  }
  return $list;
}

function add_booking($employee) {
  $time = date("H:i");
  if ($time >= BOOKING_DEADLINE) {
    return json_encode(array('ret' => -10,
                             'error' => "Can't book after ".BOOKING_DEADLINE));
  }

  $booking_time = time();
  $today = date("Y-m-d");
  $status = 'BOOKED';

  $sql = "insert into booking(booking_time, employee_id, status, booking_date)
values({$booking_time}, '$employee', '$status', '{$today}')";
  $ret = mysql_query($sql);
  if ($ret === false or mysql_affected_rows() != 1) {
    if (mysql_errno() == 1062) {
      return json_encode(array('ret' => -11,
                               'error' => "This employee($employee) has already booked today, hasn't he/she?"));
    }

    return json_encode(array('ret' => -1,
                             'error' => "$sql failed: " . mysql_error()));
  }
  return json_encode(array('ret' => 0));
  
}

function remove_booking($employee) {
  $time = date("H:i");
  if ($time >= BOOKING_DEADLINE) {
    return json_encode(array('ret' => -12,
                             'error' => "Can't cancel order after ".BOOKING_DEADLINE));
  }

  $today = date("Y-m-d");
  $sql = "delete from booking where employee_id = '$employee' and booking_date = '$today'";

  $ret = mysql_query($sql);
  if ($ret === false or mysql_affected_rows() != 1) {
    return json_encode(array('ret' => -1,
                             'error' => "$sql failed: " . mysql_error()));
  }
  return json_encode(array('ret' => 0));
  
}


function discard_booking($employee) {
  $time = date("H:i");
  if ($time < BOOKING_DEADLINE) {
    return json_encode(array('ret' => -13,
                             'error' => "It's before ".BOOKING_DEADLINE.". You can cancel your order directly."));
  }

  $today = date("Y-m-d");
  $sql = "update booking set status = 'WAITING_TRANSFER' where employee_id = '$employee' and booking_date = '$today'";

  $ret = mysql_query($sql);
  if ($ret === false or mysql_affected_rows() != 1) {
    return json_encode(array('ret' => -1,
                             'error' => "$sql failed: " . mysql_error()));
  }
  return json_encode(array('ret' => 0));
}

function claim_discarded($old_owner, $new_owner) {
  $time = date("H:i");
  if ($time < BOOKING_DEADLINE) {
    return json_encode(array('ret' => -14,
                             'error' => "It's before ".BOOKING_DEADLINE.". You can order directly."));
  }

  $today = date("Y-m-d");
  $sql = "update booking set employee_id = '{$new_owner}', status= 'BOOKED' 
where employee_id = '{$old_owner}' and booking_date = '$today'";

  $ret = mysql_query($sql);
  if ($ret === false or mysql_affected_rows() != 1) {
    return json_encode(array('ret' => -1,
                             'error' => "$sql failed: " . mysql_error()));
  }
  return json_encode(array('ret' => 0));
  
}


?>

