<?php
// Doublures minimales de Symfony / Doctrine / Carbon : juste assez pour exécuter les VRAIS contrôleurs
// et entités de l'application (src/Controller/*.php, src/Entity/*.php) en isolation, sous PHP CLI.
// Aucune logique métier n'est ré-implémentée ici.

namespace Doctrine\Common\Collections {
    interface Collection {}
    class ArrayCollection implements Collection {
        private $e = [];
        public function __construct(array $e = []) { $this->e = $e; }
        public function contains($x) { return in_array($x, $this->e, true); }
        public function removeElement($x) { $this->e = array_values(array_filter($this->e, fn($y) => $y !== $x)); return true; }
        public function toArray() { return $this->e; }
        public function add($x) { $this->e[] = $x; return true; }
    }
}

namespace Symfony\Component\HttpFoundation {
    class ParameterBag { private $d; public function __construct($d = []) { $this->d = $d; } public function get($k) { return $this->d[$k] ?? null; } }
    class Request {
        public $files;
        private $params; private $xhr;
        public function __construct(array $params = [], bool $xhr = true, array $files = []) { $this->params = $params; $this->xhr = $xhr; $this->files = new ParameterBag($files); }
        public function get($k, $default = null) { return array_key_exists($k, $this->params) ? $this->params[$k] : $default; }
        public function isXmlHttpRequest() { return $this->xhr; }
    }
    class Response {}
    class JsonResponse extends Response { public $data; public function __construct($data = null) { $this->data = $data; } }
    class File {}
}
namespace Symfony\Component\HttpFoundation\File { class UploadedFile { public $path, $name; public function __construct($path, $name) { $this->path = $path; $this->name = $name; } } }
namespace Symfony\Component\HttpFoundation\Session {
    class Session {
        public $d = [];
        public function __construct(array $d = []) { $this->d = $d; }
        public function get($k, $default = null) { return array_key_exists($k, $this->d) ? $this->d[$k] : $default; }
        public function set($k, $v) { $this->d[$k] = $v; }
    }
}
namespace Symfony\Component\Routing\Annotation { class Route {} }
namespace Symfony\Component\EventDispatcher { interface EventSubscriberInterface {} class Event {} interface EventDispatcherInterface { public function dispatch($name, $event = null); } }
namespace Psr\Log { interface LoggerInterface { public function info($m, array $c = []); } }
namespace Symfony\Bundle\FrameworkBundle\Controller {
    class StubEm { public $persisted = []; public function persist($o) { $this->persisted[] = $o; } public function flush() {} public function remove($o) {} }
    class StubDoctrine { public $em; public function __construct() { $this->em = new StubEm(); } public function getManager() { return $this->em; } }
    abstract class AbstractController {
        private $doctrine;
        public function getDoctrine() { return $this->doctrine ??= new StubDoctrine(); }
        public function render($t, $p = []) { return ['render' => $t, 'params' => $p]; }
        public function getUser() { return null; }
    }
}
namespace Doctrine\ORM { interface EntityManagerInterface { public function persist($o); public function flush(); } }

// CarbonPeriod::create(début, 'PT1H', fin, EXCLUDE_START_DATE) : sous PHP 8.3, la vraie classe lève une
// exception sur une chaîne 'y-m-d' (DateInterval::createFromDateString est devenu strict) alors que PHP 7
// renvoyait false et classait l'argument comme date. Cette doublure reproduit ce que PHP 7 produisait.
namespace Carbon {
    class CarbonStub {
        private $dt; public function __construct(\DateTimeImmutable $dt) { $this->dt = $dt; }
        public function format($f) { return $this->dt->format($f); }
        public function getTimestamp() { return $this->dt->getTimestamp(); }
    }
    class CarbonPeriod implements \IteratorAggregate {
        const EXCLUDE_START_DATE = 1;
        private $items = [];
        public static function create($start, $interval, $end, $opts = 0) {
            $p = new self();
            $a = new \DateTimeImmutable($start); $b = new \DateTimeImmutable($end);
            $step = new \DateInterval($interval);
            $cur = ($opts & self::EXCLUDE_START_DATE) ? $a->add($step) : $a;
            while ($cur <= $b) { $p->items[] = new CarbonStub($cur); $cur = $cur->add($step); }
            return $p;
        }
        public function getIterator(): \Iterator { return new \ArrayIterator($this->items); }
    }
}

namespace App\Event { class ProjectEvent extends \Symfony\Component\EventDispatcher\Event { const NAME = 'Project.data'; private $p; public function __construct($p) { $this->p = $p; } public function getProject() { return $this->p; } } }

// FileUpload : le vrai déplace le fichier vers public/uploads ; ici il renvoie le nom, le fichier source restant en place.
namespace App\Service { class FileUpload { public static $path = ''; public function __construct($d = '') {} public function upload($file) { return self::$path; } public function uploadcsv($file, $dir) { return 'production/' . self::$path; } } }
