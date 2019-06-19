<?php

  function calcJ($x, $y) {
    $intersection = count(array_intersect($x, $y));
    $union = count($x) + count($y) - $intersection;
    return $intersection*1.0/$union;
  }

  function calcM($x, $y) {
    $intersection = count(array_intersect($x, $y));
    $union = count($x) + count($y) - $intersection;
    $diff1 = count(array_diff($x,$y));
    $diff2 = count(array_diff($y,$x));
    $diff = $diff1 + $diff2;
    if($intersection == $union){
      return 1;
    }
    if($diff1 == 0 || $diff2 == 0){
      return 2/3;
    }
    if($intersection > 0) {
      return 1/3;
    }
    return 0;
  }

  function calcMASI($x, $y) {
    $v = 0;
    for($i = 0; $i < count($x); $i++) {
      if($x[$i] == '') {
        $set1 = array();
        $set1[0] = -1;
      }else {
        $set1 = array_map("intval", explode(' ', $x[$i]));
      }
      if($y[$i] == '') {
        $set2 = array();
        $set2[0] = -1;
      }else{
        $set2 = array_map("intval", explode(' ', $y[$i]));
      }
      $J = calcJ($set1, $set2);
      $M = calcM($set1, $set2);
      $v += $J*$M;
    }
    return $v/count($x);
  }

  $str_json = file_get_contents('php://input');
  #ini_set('display_errors', 1);
  #error_reporting(E_ALL);
  $json = json_decode($str_json, true);
  $data_dir = '../ConsortAnnotation/Users/';
  $userList = $json["userList"];
  #$userList = 'Halil Graciela';
  #$filename = 'PMC3016167';
  $filename = $json["filename"];
  $users = explode(' ', $userList);
  $num_of_users = count($users);
  $codes_array = array();

  for($i = 0; $i < count($users); $i++) {
    $xml = new DOMDocument();
    $xml->load($data_dir.$users[$i]."/".$filename.".xml");
    $doc = $xml->getElementsByTagName('document');
    $sentences = $doc->item(0)->getElementsByTagName('sentence');
    $index = 0;
    foreach ($sentences as $sentence) {
      if($sentence->hasAttribute('selection')) {
        $codes_array[$i][$index] = $sentence->getAttribute('selection');
      }else{
        $codes_array[$i][$index] = '';
      }
      $index++;
    }
    $returnJson[$users[$i]] = $xml->saveXML();
  }
  if(file_exists($data_dir.'Reconciliation/'.$filename.'.xml')) {
    $xml = new DOMDocument();
    $xml->load($data_dir.'Reconciliation/'.$filename.'.xml');
    $returnJson['Reconciliation'] = $xml->saveXML();
  }

  $c = 0;
  $v = 0;
  for($i = 0; $i < $num_of_users - 1; $i++) {
    for($j = $i + 1; $j < $num_of_users; $j++) {
      $v += calcMASI($codes_array[$i], $codes_array[$j]);
      $c++;
    }
  }
  $returnJson['masi'] = $v/$c;
  #echo $returnJson['masi'];
  echo json_encode($returnJson);
?>
