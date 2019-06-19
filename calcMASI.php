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

  function printSentenceSelections($a, $b) {
    echo "SentenceID\tFirst\tSecond\n";
    for($i = 0; $i < count($a); $i++) {
      echo ($i+1)."\t".$a[$i]."\t".$b[$i]."\n";
    }
    echo "\n";
  }

  function printCONSORTMASI($a, $b) {

    $nameArray = array("Title (Randomized) (1a)", "Structured Abstract (1b)" ,"Introduction" ,"Background (2a)",
      "Objective (2b)", "Methods", "Trial Design (3a)", "Changes TO Trial Design (3b)", "Eligibility Criteria (4a)",
      "Data Collection Setting (4b)", "Interventions (5)", "Outcomes (6a)", "Changes to Outcomes (6b)", "Sample Size Determination (7a)",
      "Interim Analyses/Stopping Guidelines (7b)", "Random Allocation Sequence Generation (8a)", "Randomization Type (8b)", "Allocation Concealment Mechanism (9)",
      "Randomization Implementation (10)", "Blinding Procedure (11a)", "Similarity of Interventions (11b)", "Statistical Methods for Outcome Comparison (12a)",
      "Statistical Methods for Other Analyses (12b)", "Results", "Participant Flow (13a)", "Participant Loss and Exclusion (13b)", "Recruitment Period/Follow-Up (14a)",
      "Trial Stopping (14b)", "Baseline Data (15)", "Numbers Analyzed (16)", "Outcome Results (17a)", "Binary Outcome Results (17b)", "Ancillary Analyses (18)",
      "Harms (19)", "Discussion", "Limitations (20)", "Generalizability (21)", "Interpretation (22)", "Other", "Registry/Number (23)", "Protocol Access (24)", "Funding (25)");

      echo "MASI values by CONSORT items:\n";
      echo "Item Index\tMASI value\n";
      $c = array();
      $full1 = array();
      $full2 = array();
      $all = 0;
      for($i = 1;$i < 43; $i++) {
        if($i != 3 && $i != 6 && $i != 24 && $i != 35 && $i != 39) {
          if(empty($a[$i])) {
            $set1 = array();
            $set1[0] = -1;
          }else {
            $set1 = array_map("intval", explode(' ', $a[$i]));
            if(empty($full1)) {
              $full1 = array($i);
            }else {
              array_push($full1, $i);
            }
          }
          if(empty($b[$i])) {
            $set2 = array();
            $set2[0] = -1;
          }else{
            $set2 = array_map("intval", explode(' ', $b[$i]));
            if(empty($full2)) {
              $full2 = array($i);
            }else {
              array_push($full2, $i);
            }
          }
          $J = calcJ($set1, $set2);
          $M = calcM($set1, $set2);
          $c[$i] = $J*$M;
          $all += $c[$i];
          echo $nameArray[$i-1]."\t".$c[$i]."\n";
        }
      }
      echo "\n";

      $intersection = count(array_intersect($full1, $full2));
      if(count($full1) >= count($full2)) {
        $percent = $intersection*1.0/count($full1);
      }else {
        $percent = $intersection*1.0/count($full2);
      }

      echo "MASI values by CONSORT sections:\n";
      echo "Section name\tMASI value\n";
      echo "Title\t".$c[1]."\n";
      echo "Structured Abstract\t".$c[2]."\n";
      echo "Introduction\t".(($c[4]+$c[5])/2)."\n";
      echo "Methods\t".(($c[7]+$c[8]+$c[9]+$c[10]+$c[11]+$c[12]+$c[13]+$c[14]+$c[15]+$c[16]+$c[17]+$c[18]+$c[19]+$c[20]+$c[21]+$c[22]+$c[23])/17)."\n";
      echo "Results\t".(($c[25]+$c[26]+$c[27]+$c[28]+$c[29]+$c[30]+$c[31]+$c[32]+$c[33]+$c[34])/10)."\n";
      echo "Discussion\t".(($c[36]+$c[37]+$c[38])/3)."\n";
      echo "Others\t".(($c[40]+$c[41]+$c[42])/3)."\n\n";

      echo "Overall MASI value for CONSORT items: ".($all/37)."\n";
      echo "Overall document level MASI value: ".calcJ($full1,$full2)*calcM($full1,$full2)."\n";
      echo "Overall percentage agreement: ".$percent."\n";

    }

  if (isset($argc)) {
    if($argc < 3) {
      echo "Usage: php calcMASI.php {xml1} {xml2} \n";
    }
  	else {
      $xml1 = new DOMDocument();
      $xml1->load($argv[1]);
      $xml2 = new DOMDocument();
      $xml2->load($argv[2]);
      $codes1 = array();
      $codes2 = array();
      $reversecode1 = array();
      $reversecode2 = array();
      $doc1 = $xml1->getElementsByTagName('document');
      $sentences1 = $doc1->item(0)->getElementsByTagName('sentence');
      $index1 = 0;
      foreach ($sentences1 as $sentence) {
        if($sentence->hasAttribute('selection')) {
          $codes1[$index1] = $sentence->getAttribute('selection');
          $set1 = array_map("intval", explode(' ', $codes1[$index1]));
          foreach($set1 as $v) {
            if(empty($reversecode1[$v])) {
              $reversecode1[$v] = $index1;
            }else {
              $reversecode1[$v] = $reversecode1[$v].' '.$index1;
            }
          }
        }else{
          $codes1[$index1] = '';
        }
        $index1++;
      }
      $doc2 = $xml2->getElementsByTagName('document');
      $sentences2 = $doc2->item(0)->getElementsByTagName('sentence');
      $index2 = 0;
      foreach ($sentences2 as $sentence) {
        if($sentence->hasAttribute('selection')) {
          $codes2[$index2] = $sentence->getAttribute('selection');
          $set2 = array_map("intval", explode(' ', $codes2[$index2]));
          foreach($set2 as $v) {
            if(empty($reversecode2[$v])) {
              $reversecode2[$v] = $index2;
            }else {
              $reversecode2[$v] = $reversecode2[$v].' '.$index2;
            }
          }
        }else{
          $codes2[$index2] = '';
        }
        $index2++;
      }


      printCONSORTMASI($reversecode1,$reversecode2);
      echo "Overall MASI value for sentences: ".calcMASI($codes1, $codes2);
      echo "\n\n";
      printSentenceSelections($codes1, $codes2);
    }
  }

?>
