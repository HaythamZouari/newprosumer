<?php
// Harnais de parité pour FinanceService : on recrée des stubs d'entités juste
// assez complets pour piloter le vrai service en isolation (sans Symfony/Doctrine),
// puis on compare ses sorties au portage JS.
//
// Usage : php finance.php    — spec JSON sur stdin :
//   { "method": "...", "finance": {...}, "degradation": x, "tarif": ...,
//     "autoConsomme": [[ts,val]...], "cedePH": [{jour,ete,soir,nuit}*13],
//     "prod": [[ts,val]...], "gainCedee": [...], "annuite": [...], "cfads": [...],
//     "replinv": n, "maturite": n, "delee": n,
//     "fraisExp": [...], "fReg": [...], "fTransport": [...] }

namespace App\Entity {
    class Finance {
        private $d;
        public function __construct($d) { $this->d = $d; }
        public function getCapex() { return $this->d['capex']; }
        public function getOpex() { return $this->d['opex']; }
        public function getTauxActualisation() { return $this->d['tauxActualisation']; }
        public function getTauxInteret() { return $this->d['tauxInteret']; }
        public function getMontantDette() { return $this->d['montantDette']; }
        public function getMaturiteProj() { return $this->d['maturiteProj']; }
        public function getDelaiGrace() { return $this->d['delaiGrace']; }
        public function getAugTarifAchat() { return $this->d['augTarifAchat']; }
        public function getAugTarifVende() { return $this->d['augTarifVende']; }
        public function getTarifTransport() { return $this->d['tarifTransport']; }
    }
    class ProdStub {
        private $deg; private $result;
        public function __construct($deg, $result) { $this->deg = $deg; $this->result = $result; }
        public function getDegradation() { return $this->deg; }
        public function getResult() { return $this->result; }
    }
    class ConsoStub {
        private $n;
        public function __construct($n) { $this->n = $n; }
        public function getallConsomationAnnuel() { return array_fill(0, $this->n, [[0, 0]]); }
    }
    // Stub de Project : seuls les getters utilisés par FinanceService sont fournis.
    class Project {
        public $finance; public $csvProd; public $pvgis = null; public $ninja = null;
        public $consomation; public $cedePH; public $injectPH;
        public function getFinance() { return $this->finance; }
        public function getCsvProd() { return $this->csvProd; }
        public function getPvgis() { return $this->pvgis; }
        public function getNinja() { return $this->ninja; }
        public function getConsomation() { return $this->consomation; }
        public function getcedeePH() { return $this->cedePH; }
        public function getinjectPH() { return $this->injectPH; }
    }
}

namespace {
    use App\Entity\Finance;
    use App\Entity\ProdStub;
    use App\Entity\ConsoStub;
    use App\Entity\Project;
    use App\Service\FinanceService;

    require_once __DIR__ . '/../../../src/Service/PostHoraire.php';
    require_once __DIR__ . '/../../../src/Service/FinanceService.php';

    date_default_timezone_set('Africa/Tunis');
    $in = json_decode(file_get_contents('php://stdin'), true);

    $p = new Project();
    $p->finance = new Finance($in['finance'] ?? []);
    $p->csvProd = new ProdStub($in['degradation'] ?? 0, $in['prod'] ?? []);
    $p->consomation = new ConsoStub(1); // branche count==1 -> injectPH
    $p->injectPH = $in['cedePH'] ?? [];

    $m = $in['method'];
    switch ($m) {
        case 'unif':
            $r = FinanceService::gainEnergieTransporterUnif($in['tarif'], $p, $in['autoConsomme']); break;
        case 'horaire':
            $r = FinanceService::gainEnergieTransporterHoraire($in['tarif'], $p, $in['autoConsomme']); break;
        case 'cedee':
            $r = FinanceService::gainEnergieCedee($in['tarif'], $p); break;
        case 'fraisExp':
            $r = FinanceService::fraisExploitation($p); break;
        case 'anuite':
            $r = FinanceService::Anuite($in['maturite'], $in['delee'], $p); break;
        case 'factureReg':
            $r = FinanceService::factureRegularisation($in['gainCedee'], $p, $in['cedePH']); break;
        case 'facteurTransport':
            $r = FinanceService::facteurTransport($p, $in['autoConsomme']); break;
        case 'depenses':
            $r = FinanceService::depenses($in['fraisExp'], $in['annuite'], $in['fReg'], $in['fTransport'], 0, 0); break;
        case 'depenses2':
            $r = FinanceService::depenses2($in['fraisExp'], $in['annuite'], $in['fReg']); break;
        case 'opex':
            $r = FinanceService::opex($p, $in['replinv']); break;
        case 'llcr':
            $r = FinanceService::LLCR($p, $in['annuite'], $in['cfads']); break;
        case 'cashflowInt':
            $r = FinanceService::cashflowInt($p); break;
        default:
            fwrite(STDERR, "methode inconnue: $m\n"); exit(1);
    }
    echo json_encode($r);
}
