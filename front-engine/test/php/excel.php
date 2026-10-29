<?php
// Exécute le VRAI App\Service\ExcelReader (PhpSpreadsheet 1.13) sur un fichier et imprime le JSON.
// Usage : php excel.php <fichier>
error_reporting(E_ALL & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);
date_default_timezone_set('Africa/Tunis');
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/../../../src/Service/ExcelReader.php';
$data = App\Service\ExcelReader::createDataFromSpreadsheet($argv[1]);
echo json_encode($data);
