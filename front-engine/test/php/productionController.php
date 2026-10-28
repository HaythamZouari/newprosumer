<?php
// Exécute le VRAI ProductionController (pvgis / ninja / readcsv) puis le VRAI ProjectListner, avec un HttpClient
// doublé qui rejoue des réponses enregistrées. Sortie : réponses JSON, URL appelées, état des entités.
// stdin : { project:{consomation:{prop:val}}, steps:[{call, request, http:[corps...], csv, ...}] }

namespace Symfony\Component\HttpClient {
    class StubResponse { private $b; public function __construct($b) { $this->b = $b; } public function getContent() { return $this->b; } public function toArray() { return json_decode($this->b, true); } }
    class HttpClient {
        public static $queue = []; public static $urls = [];
        public static function create($o = []) { return new self(); }
        public function request($m, $u) { self::$urls[] = $u; return new StubResponse(array_shift(self::$queue)); }
    }
}
namespace {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);
    date_default_timezone_set('Africa/Tunis');
    require __DIR__ . '/lib/stubs.php';
    require __DIR__ . '/vendor/autoload.php';
    $src = __DIR__ . '/../../../src/';
    foreach (['Consomation', 'CsvProd', 'Finance', 'Ninja', 'Pvgis', 'Pvwatt', 'Project'] as $e) require_once $src . "Entity/$e.php";
    foreach (['PostHoraire', 'Datesorting'] as $s) require_once $src . "Service/$s.php";
    require_once $src . 'Event/ProjectListner.php';
    foreach (['FinanceService'] as $s) require_once $src . "Service/$s.php";
    require_once $src . 'Controller/ProductionController.php';
    require_once $src . 'Controller/FinanceController.php';
    require_once $src . 'Controller/ResultController.php';

    use App\Entity\Project;
    use Symfony\Component\HttpFoundation\Request;
    use Symfony\Component\HttpFoundation\File\UploadedFile;
    use Symfony\Component\HttpClient\HttpClient;

    $in = json_decode(file_get_contents('php://stdin'), true);
    $setProps = function ($obj, $props) { foreach ($props as $k => $v) { $r = new ReflectionProperty($obj, $k); $r->setAccessible(true); $r->setValue($obj, $v); } };
    $project = new Project();
    $setProps($project->getConsomation(), $in['project']['consomation'] ?? []);
    $em = new class implements Doctrine\ORM\EntityManagerInterface { public function persist($o) {} public function flush() {} };
    $listener = new App\Event\ProjectListner($em);
    $dispatcher = new class($listener) implements Symfony\Component\EventDispatcher\EventDispatcherInterface {
        private $l; public function __construct($l) { $this->l = $l; }
        public function dispatch($name, $event = null) { $this->l->onProjectEvent($event); return $event; }
    };
    $logger = new class implements Psr\Log\LoggerInterface { public function info($m, array $c = []) {} };
    $ctl = new App\Controller\ProductionController();
    $work = sys_get_temp_dir() . '/np_prod_' . getmypid(); @mkdir($work . '/uploads/production', 0777, true); chdir($work);

    $out = [];
    foreach ($in['steps'] as $step) {
        HttpClient::$queue = $step['http'] ?? [];
        $files = [];
        if (isset($step['csv'])) { file_put_contents($work . '/uploads/production/prod-fixed.csv', $step['csv']); App\Service\FileUpload::$path = 'prod-fixed.csv'; $files['file'] = new UploadedFile('x', 'prod.csv'); }
        $request = new Request($step['request'] ?? [], true, $files);
        switch ($step['call']) {
            case 'pvgis': $r = $ctl->pvgis($logger, $dispatcher, $project, $request); break;
            case 'ninja': $r = $ctl->ninja($project, $dispatcher, $request); break;
            case 'finance': $r = (new App\Controller\FinanceController())->index($request, $project); break;
            case 'results': $r = (new App\Controller\ResultController())->index($request, $project); break;
            case 'readcsv': $r = $ctl->readcsv($dispatcher, $request, new App\Service\FileUpload(''), $project); break;
        }
        $out[] = $r->data;
    }
    $dump = function ($obj) { if ($obj === null) return null; $o = []; foreach ((new ReflectionObject($obj))->getProperties() as $p) { $p->setAccessible(true); $v = $p->getValue($obj); if (is_object($v)) continue; $o[$p->getName()] = $v; } return $o; };
    echo json_encode(['steps' => $out, 'urls' => HttpClient::$urls,
        'pvgis' => $dump($project->getPvgis()), 'ninja' => $dump($project->getNinja()), 'csvProd' => $dump($project->getCsvProd()), 'finance' => $dump($project->getFinance()), 'project' => $dump($project)],
        JSON_PARTIAL_OUTPUT_ON_ERROR);
}
