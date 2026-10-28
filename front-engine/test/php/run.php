<?php
// Harnais de validation : exécute les services PHP d'origine de façon isolée
// (sans Symfony ni Composer) pour comparer leurs sorties à celles du portage JS.
//
// Usage : php run.php <fonction>   — les données JSON sont lues sur stdin.
//   postHoraire      stdin = [[ts,val],...]                      -> [{jour,ete,soir,nuit},...] (13)
//   horaireAnnuel    stdin = [[ts,val],...]                      -> {jour,ete,soir,nuit}
//   sorteDate        stdin = {consomation, production, dateConsommation} -> [[ts,val],...]

date_default_timezone_set('Africa/Tunis');

$base = __DIR__ . '/../../../src/Service/';
require_once $base . 'PostHoraire.php';
require_once $base . 'Horaireannuel.php';
require_once $base . 'Datesorting.php';

use App\Service\PostHoraire;
use App\Service\Horaireannuel;
use App\Service\Datesorting;

$fn = $argv[1] ?? '';
$input = json_decode(file_get_contents('php://stdin'), true);

switch ($fn) {
    case 'postHoraire':
        // PHP renvoie un tableau associatif indexé 0..12 ; json_encode en objet.
        $r = PostHoraire::PostHoraire($input);
        echo json_encode($r);
        break;
    case 'horaireAnnuel':
        echo json_encode(Horaireannuel::Horaireannuel($input));
        break;
    case 'sorteDate':
        $r = Datesorting::SorteDate(
            (int) $input['consomation'],
            $input['production'],
            $input['dateConsommation']
        );
        echo json_encode($r);
        break;
    default:
        fwrite(STDERR, "fonction inconnue: $fn\n");
        exit(1);
}
