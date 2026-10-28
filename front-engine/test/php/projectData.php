<?php
// Harnais de parité pour ProjectListner : on fournit les interfaces/entités
// minimales attendues (Doctrine, Symfony, Project) pour exécuter le vrai
// onProjectEvent en isolation, puis on compare les structures produites au JS.
//
// Usage : php projectData.php   — spec JSON sur stdin :
//   { "consomation": [ [[ts,val],...], ... ], "production": [[ts,val],...],
//     "transportEng": 0|1, "typeTarif": 1|0 }

namespace Doctrine\ORM { interface EntityManagerInterface {} }
namespace Symfony\Component\EventDispatcher { interface EventSubscriberInterface {} }

namespace App\Event {
    // Stub d'événement : seul getProject() et la constante NAME sont utilisés.
    class ProjectEvent {
        const NAME = 'Project.data';
        private $p;
        public function __construct($p) { $this->p = $p; }
        public function getProject() { return $this->p; }
    }
}

namespace App\Entity {
    class ConsoStub {
        private $sites; private $transportEng; private $typeTarif;
        public function __construct($sites, $transportEng, $typeTarif) {
            $this->sites = $sites; $this->transportEng = $transportEng; $this->typeTarif = $typeTarif;
        }
        public function getallConsomationAnnuel() { return $this->sites; }
        public function getTransportEng() { return $this->transportEng; }
        public function getTypeTarif() { return $this->typeTarif; }
    }
    class ProdStub {
        private $result;
        public function __construct($result) { $this->result = $result; }
        public function getResult() { return $this->result; }
        public function getDegradation() { return 0; }
    }
    class Project {
        public $conso; public $prod;
        public $out = [];
        public function getConsomation() { return $this->conso; }
        public function getPvgis() { return null; }
        public function getNinja() { return null; }
        public function getCsvProd() { return $this->prod; }
        public function setconsomationPH($v) { $this->out['consomationPH'] = $v; }
        public function setproductionPH($v) { $this->out['productionPH'] = $v; }
        public function setauto_consomerPH($v) { $this->out['autoConsomerPH'] = $v; }
        public function setimporterPH($v) { $this->out['importerPH'] = $v; }
        public function setcedeePH($v) { $this->out['cedeePH'] = $v; }
        public function setinjectPH($v) { $this->out['injectPH'] = $v; }
        public function setinject($v) { $this->out['inject'] = $v; }
        public function setAutoConsomer($v) { $this->out['autoConsomer'] = $v; }
        public function setCedee($v) { $this->out['cedee'] = $v; }
        public function setImporte($v) { $this->out['importer'] = $v; }
    }
}

namespace {
    use App\Event\ProjectEvent;
    use App\Event\ProjectListner;
    use App\Entity\ConsoStub;
    use App\Entity\ProdStub;
    use App\Entity\Project;

    require_once __DIR__ . '/../../../src/Service/PostHoraire.php';
    require_once __DIR__ . '/../../../src/Event/ProjectListner.php';

    date_default_timezone_set('Africa/Tunis');
    $in = json_decode(file_get_contents('php://stdin'), true);

    $p = new Project();
    $p->conso = new ConsoStub($in['consomation'], $in['transportEng'], $in['typeTarif']);
    $p->prod = new ProdStub($in['production']);

    $manager = new class implements \Doctrine\ORM\EntityManagerInterface {
        public function persist($x) {}
        public function flush() {}
    };

    $listener = new ProjectListner($manager);
    $listener->onProjectEvent(new ProjectEvent($p));

    echo json_encode($p->out);
}
