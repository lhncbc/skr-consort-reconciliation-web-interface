<?php

  function findFile($u, $data_dir, $file) {
    for($i = 0; $i < count($u); $i++) {
        if(!file_exists($data_dir.$u[$i]."/".$file)) {
          return false;
        }
    }
    return true;
  }

  $str_json = file_get_contents('php://input');
  #ini_set('display_errors', 1);
  #error_reporting(E_ALL);
  $json = json_decode($str_json, true);
  $data_dir = '../ConsortAnnotation/Users/';
  $userList = $json["userList"];
  $users = explode(' ', $userList);
  $returnString = '';

  $first_user_files = scandir($data_dir.$users[0]);
  for ($i = 0; $i < count($first_user_files); $i++) {
    $splits = explode('.', $first_user_files[$i]);
    if($splits[1] == 'xml') {
      if(findFile($users, $data_dir, $first_user_files[$i])) {
        $returnString .= $splits[0].' ';
      }
    }
  }
  echo $returnString;
?>
