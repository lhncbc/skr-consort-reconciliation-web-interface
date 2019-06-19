<?php
  $unannotated_dir = '../ConsortAnnotation/unannotated_xmls';
  $unannotated_files = scandir($unannotated_dir);
  $returnString = '';
  for ($i = 0; $i < count($unannotated_files); $i++) {
      $splits = explode('.', $unannotated_files[$i]);
      $returnString .= $splits[0].' ';
  }
  echo $returnString;
?>
