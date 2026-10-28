// Port de App\Controller\ProductionController (src/Controller/ProductionController.php) :
//   pvgis   : production PVGIS (jusqu'à 3 champs PV)
//   ninja   : production renewables.ninja
//   readcsv : import d'un fichier de production PVsyst (CSV)
//
// Les appels aux API externes passent par `services.producers` (proxies serverless /api/*, qui
// contournent le CORS et gardent le jeton ninja côté serveur). Les particularités du PHP d'origine
// sont conservées et signalées « PHP : ».
import { Pvgis, Ninja, CsvProd } from '../entities.js';
import { sorteDate } from '../../src/dateSorting.js';
import { onProjectEvent } from '../projectListener.js';
import { floatval, intval } from '../lib/php.js';
import { tsFromParts, hourlyPeriod } from '../lib/dates.js';

const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Datesorting::SorteDate sur la courbe de consommation du dernier site construit (consomation_annuel). */
function alignOnConsommation(project, data) {
  const conso = project.getConsomation().getConsomationAnnuel();
  return sorteDate(conso[0][0], data, conso);
}

async function persistAndDispatch(repo, project) {
  await repo.saveProject(project);
  onProjectEvent(project); // ProjectEvent::NAME -> ProjectListner
  await repo.saveProject(project);
}

// ---------------------------------------------------------------------------
// pvgis
// ---------------------------------------------------------------------------
export async function pvgis(ctx) {
  const { request, repo, params, services } = ctx;
  const project = await repo.findProject(params.id);
  if (!project) return ctx.json({ error: 'Not Found' }, 404);

  const pvgis = new Pvgis();
  pvgis.setProject(project);
  pvgis.setLat(floatval(request.get('lat')));
  pvgis.setAzimuth([floatval(request.get('aspect')), floatval(request.get('aspect2')), floatval(request.get('aspect3'))]);
  pvgis.setLon(floatval(request.get('lon')));
  pvgis.setLoss(floatval(request.get('loss')));
  pvgis.setMountingType(intval(request.get('trackingtype')));
  pvgis.setPeakPower([floatval(request.get('peakpower')), floatval(request.get('peakpower2')), floatval(request.get('peakpower3'))]);
  pvgis.setPvTech('crystSi');
  pvgis.setDegradation(floatval(request.get('degradationp')));
  pvgis.setSlop([floatval(request.get('angle')), floatval(request.get('angle2')), floatval(request.get('angle3'))]);

  const lat = request.get('lat'); const lon = request.get('lon');
  const field = (sfx, lossKey) => ({
    lat, lon, peakpower: request.get(`peakpower${sfx}`), loss: request.get(lossKey), angle: request.get(`angle${sfx}`), aspect: request.get(`aspect${sfx}`),
    // PHP : '&trackingtype'.$request->get(...) et '&raddadtabase'.$request->get(...) sont écrits SANS « = » :
    // PVGIS ne reçoit donc jamais ces paramètres (mode fixe, base de rayonnement par défaut). Reproduit ici
    // en ne les transmettant pas.
  });
  // champs interrogés : le 1er toujours ; le 2e si peakpower2 != 0 et peakpower3 == 0 ; le 2e ET le 3e si peakpower3 != 0
  const fields = [field('', 'loss')];
  if (floatval(request.get('peakpower2')) !== 0 && floatval(request.get('peakpower3')) === 0) fields.push(field('2', 'loss2'));
  if (floatval(request.get('peakpower3')) !== 0) { fields.push(field('2', 'loss2')); fields.push(field('3', 'loss3')); }

  // Chaque réponse : { lines } = lignes du CSV « basic » à partir de l'en-tête (explode(PHP_EOL) du PHP)
  const responses = [];
  for (const f of fields) responses.push(await services.producers.pvgis(f));

  // PHP : $array[] = str_getcsv($line) ; $array[$i][1]/1000 pour $i = 2, 3, … (la 1re ligne de données est donc
  // sautée) ; au-delà des lignes, la valeur est NULL -> 0. Les sous-systèmes 2 et 3 s'additionnent à l'identique.
  const csvs = responses.map((r) => r.lines.map((l) => fgetcsv(l)));
  const period = hourlyPeriod(tsFromParts(2017, 1, 1, 0, 0), tsFromParts(2018, 1, 1, 0, 0));
  const cell = (rows, i) => floatval(rows[i] ? rows[i][1] : null);
  const data = period.map((ts, k) => {
    let w = cell(csvs[0], k + 2);
    for (let r = 1; r < csvs.length; r++) w += cell(csvs[r], k + 2);
    return [Math.trunc(ts), w / 1000];
  });
  const array = csvs[0];

  pvgis.setResult(alignOnConsommation(project, data));
  project.setCsvProd(null);
  project.setNinja(null);
  await persistAndDispatch(repo, project);

  return ctx.json({
    period: {}, // PHP : json_encode(CarbonPeriod) donne un objet vide
    data,
    array,
    data2: array,
    pro: project.getPvgis().getResult(),
    aut: project.getAutoConsomer(),
    ced: project.getCedee(),
    inject: project.getinject(),
    imp: project.getImporte(),
  });
}

// ---------------------------------------------------------------------------
// ninja
// ---------------------------------------------------------------------------
export async function ninja(ctx) {
  const { request, repo, params, services } = ctx;
  const project = await repo.findProject(params.id);
  if (!project) return ctx.json({ error: 'Not Found' }, 404);

  const ninja = new Ninja();
  ninja.setProject(project);
  ninja.setLat(floatval(request.get('lat')));
  ninja.setAzimuth(floatval(request.get('azimuth')) + 180);
  ninja.setLon(intval(request.get('lon'))); // PHP : (int) — la longitude est tronquée dans l'entité
  ninja.setLoss(floatval(request.get('loss')));
  ninja.setTracking(intval(request.get('tracking')));
  ninja.setCapacity(floatval(request.get('capacity')));
  ninja.setRaddatabase('sarah');
  ninja.setTilt(floatval(request.get('tilt')));
  ninja.setDegradation(floatval(request.get('degradationn')));

  // Réponse : le JSON de renewables.ninja tel quel ({ data: { horodatage: { electricity } }, metadata })
  const json = await services.producers.ninja({
    lat: request.get('lat'), lon: request.get('lon'), capacity: request.get('capacity'), loss: request.get('loss'),
    tracking: request.get('tracking'), tilt: request.get('tilt'), azimuth: request.get('azimuth'),
  });
  const ac = json.data;
  // PHP : while ($dat = current($ac)) — s'arrête à la 1re valeur « fausse » (ici jamais : ce sont des objets non vides)
  const data1 = [];
  for (const [key, dat] of Object.entries(ac)) { if (!dat || (typeof dat === 'object' && !Object.keys(dat).length)) break; data1.push([key, Object.values(dat)[0]]); }
  // PHP : period 2014-01-01 00:00 -> 2015-01-01 00:00, début exclu ; i = 0 (aucun décalage)
  const period = hourlyPeriod(tsFromParts(2014, 1, 1, 0, 0), tsFromParts(2015, 1, 1, 0, 0));
  const data = period.map((ts, i) => [Math.trunc(ts), floatval(data1[i] ? data1[i][1] : null)]);

  ninja.setResult(alignOnConsommation(project, data));
  project.setCsvProd(null);
  project.setPvgis(null);
  await persistAndDispatch(repo, project);
  return ctx.json({ data: json, values: data, dat: ac });
}

// ---------------------------------------------------------------------------
// readcsv — production PVsyst
// ---------------------------------------------------------------------------
/** fgetcsv() : champs d'une ligne (séparateur ',', guillemets '"') — ligne vide => [null] */
export function fgetcsv(line) {
  if (line === '') return [null];
  const out = []; let cur = ''; let q = false; let i = 0;
  for (; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/** FileUpload::uploadcsv : nom translittéré en minuscules, extension forcée en .csv, rangé dans production/ */
export async function storeCsvUpload(repo, file, uid) {
  const stem = file.name.replace(/\.[^.]*$/, '');
  const safe = stem.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_]/g, '').toLowerCase();
  const fileName = `${safe}-${uid()}.csv`;
  await repo.b.put('kv', { name: file.name, type: file.type || 'text/csv', buf: await file.arrayBuffer() }, `file:production/${fileName}`);
  return `production/${fileName}`;
}

export async function readcsv(ctx) {
  const { request, repo, params } = ctx;
  const project = await repo.findProject(params.id);
  if (!project) return ctx.json({ error: 'Not Found' }, 404);
  const file = request.files.file;
  if (!file) return ctx.json({ error: 'Aucun fichier' }, 400);
  if (file.size > MAX_FILE_BYTES) return ctx.json({ error: 'Fichier trop volumineux' }, 413);

  const csvreader = new CsvProd();
  const filePath = await storeCsvUpload(repo, file, ctx.services.uniqid || (() => Date.now().toString(16)));
  const text = new TextDecoder().decode(await file.arrayBuffer());
  const lines = text.split(/\r\n|\n|\r/);
  if (lines.length && lines[lines.length - 1] === '') lines.pop(); // pas de ligne finale fantôme (fgetcsv renvoie false en fin de fichier)

  // PHP : $csv[$i] = explode(';', fgetcsv(...)[0]) — avec un séparateur décimal « , » le 1er champ est tronqué
  const csv = lines.map((l) => String(fgetcsv(l)[0] ?? '').split(';'));
  // PHP : période 2014-01-01 01:00 -> 2014-12-31 23:00 SANS EXCLURE le début (8759 points), lue depuis la ligne 13 ;
  // le point manquant est ajouté en fin : [1420070400, 0] (1er janvier 2015 00:00 UTC)
  const period = [tsFromParts(2014, 1, 1, 1, 0)].concat(hourlyPeriod(tsFromParts(2014, 1, 1, 1, 0), tsFromParts(2014, 12, 31, 23, 0)));
  const data = period.map((ts, k) => {
    const row = csv[13 + k];
    return [Math.trunc(ts), floatval(row ? row[1] : null)];
  });
  data.push([1420070400, 0]);

  csvreader.setPath(`uploads/${filePath}`);
  csvreader.setResult(alignOnConsommation(project, data));
  csvreader.setPuissence(floatval(request.get('csvpuiss')));
  csvreader.setProject(project);
  csvreader.setDegradation(floatval(request.get('degradationc')));
  await repo.saveProject(project);
  project.setPvgis(null); // PHP : seul le PVGIS est remis à zéro (un éventuel Ninja reste et reprendra la main)
  await persistAndDispatch(repo, project);
  return ctx.json({ da: data });
}
