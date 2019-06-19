<?php
  $str_json = file_get_contents('php://input');
  ini_set('display_errors', 1);
  error_reporting(E_ALL);
  $json = json_decode($str_json, true);
  #echo $str_json;
  $xml = $json["xml"];
  $filename = $json["filename"];
  $dom = new DOMDocument();
  $dom->preserveWhiteSpace = FALSE;
  $dom->loadXML($xml);
  if(!file_exists('../ConsortAnnotation/Users/Reconciliation')) {
    mkdir($user, 0777);
  }
  //Save XML as a file
  $dom->save('../ConsortAnnotation/Users/Reconciliation/'.$filename.'.xml');
?>
