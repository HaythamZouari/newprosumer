<?php
// Exécute le VRAI ProjectController (show / excelupload / suppsite / suppcc / getdata) sur une séquence d'étapes
// et renvoie, pour chacune, la réponse JSON ; puis l'état final de l'entité Consomation / Project et de la session.
// stdin : { seed, project:{consomation:{prop:val}, project:{prop:val}}, session:{...}, steps:[{call, request, file}] }
error_reporting(E_ALL & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);
date_default_timezone_set('Africa/Tunis');
require __DIR__ . '/lib/stubs.php';
require __DIR__ . '/vendor/autoload.php';
$src = __DIR__ . '/../../../src/';
foreach (['Consomation', 'CsvProd', 'Finance', 'Ninja', 'Pvgis', 'Pvwatt', 'Project'] as $e) require_once $src . "Entity/$e.php";
require_once $src . 'Service/PostHoraire.php';
require_once $src . 'Service/ExcelReader.php';
require_once $src . 'Controller/ProjectController.php';

use App\Entity\Project;
use Symfony\Component\HttpFoundation\Request; use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\File\UploadedFile;

$in = json_decode(file_get_contents('php://stdin'), true);
$setProps = function ($obj, $props) {
    foreach ($props as $k => $v) { $r = new ReflectionProperty($obj, $k); $r->setAccessible(true); $r->setValue($obj, $v); }
};
$project = new Project();
$setProps($project->getConsomation(), $in['project']['consomation'] ?? []);
$setProps($project, $in['project']['project'] ?? []);
$session = new Session($in['session'] ?? []);
$ctl = new App\Controller\ProjectController();
$work = sys_get_temp_dir() . '/np_php_' . getmypid(); @mkdir($work . '/uploads', 0777, true); chdir($work);
mt_srand($in['seed'] ?? 1);

$out = [];
foreach ($in['steps'] as $step) {
    $files = [];
    if (!empty($step['file'])) {
        $ext = pathinfo($step['file'], PATHINFO_EXTENSION);
        $name = pathinfo($step['file'], PATHINFO_FILENAME) . '-fixed.' . $ext; // le JS utilise uniqid() => 'fixed'
        copy($step['file'], $work . '/uploads/' . $name);
        \App\Service\FileUpload::$path = $name;
        $files['file'] = new UploadedFile($step['file'], $name);
    }
    $request = new Request($step['request'] ?? [], true, $files);
    switch ($step['call']) {
        case 'show': $r = $ctl->show($project, $request, $session); break;
        case 'excelupload': $r = $ctl->excelupload($project, $request, new App\Service\FileUpload(''), $session); break;
        case 'suppsite': $r = $ctl->suppsite($project, $request); break;
        case 'suppcc': $r = $ctl->suppcc($project, $request); break;
        case 'getdata': $r = $ctl->getdata($project, $request); break;
        default: fwrite(STDERR, "call inconnu\n"); exit(1);
    }
    $out[] = $r->data;
}
$dump = function ($obj) { $o = []; $rc = new ReflectionObject($obj);
    foreach ($rc->getProperties() as $p) { $p->setAccessible(true); $v = $p->getValue($obj);
        if (is_object($v) && !($v instanceof DateTimeInterface)) continue; $o[$p->getName()] = $v; } return $o; };
echo json_encode(['steps' => $out, 'consomation' => $dump($project->getConsomation()), 'project' => $dump($project), 'session' => $session->d],
    JSON_PARTIAL_OUTPUT_ON_ERROR);
