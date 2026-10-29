<?php
// Suite pseudo-aléatoire de référence : mt_srand(seed) puis rand(min,max) / mt_rand(min,max).
$in = json_decode(file_get_contents('php://stdin'), true);
mt_srand($in['seed']);
$out = [];
foreach ($in['calls'] as [$min, $max]) $out[] = rand($min, $max);
echo json_encode($out);
