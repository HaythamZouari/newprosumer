// Chaque template Twig d'origine, une fois prétraité, doit compiler sous Twig.js
// et ne plus référencer de CDN mort.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { preprocessTemplate, templateDeps } from '../build/preprocess.mjs';

const require = createRequire(import.meta.url);
const Twig = require('twig');
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, '..', '..', 'templates');

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(TEMPLATES).filter((f) => f.endsWith('.twig'));

test('26 templates trouvés', () => assert.equal(files.length, 26));

for (const f of files) {
  const name = relative(TEMPLATES, f);
  test(`compile : ${name}`, () => {
    const src = preprocessTemplate(readFileSync(f, 'utf8'));
    // rethrow: true => toute erreur de syntaxe Twig est levée
    assert.doesNotThrow(() => Twig.twig({ id: `t:${name}`, data: src, rethrow: true }));
  });
}

test('plus de CDN mort ni de include() fonction', () => {
  const dead = [/rawgit\.com/, /cdn\.plot\.ly/, /stackpath\.bootstrapcdn/, /netdna\.bootstrapcdn/,
    /ajax\.googleapis\.com/, /cdnjs\.cloudflare\.com\/ajax\/libs\/(popper|dygraph)/, /api\.mqcdn\.com/,
    /\{\{\s*include\(/];
  for (const f of files) {
    const src = preprocessTemplate(readFileSync(f, 'utf8'));
    for (const re of dead) assert.ok(!re.test(src), `${relative(TEMPLATES, f)} contient encore ${re}`);
  }
});

test('templateDeps détecte extends et include', () => {
  const src = preprocessTemplate("{% extends 'base.html.twig' %}{{ include('a/b.twig') }}{% include 'c.twig' %}");
  assert.deepEqual(templateDeps(src).sort(), ['a/b.twig', 'base.html.twig', 'c.twig']);
});

test('include avec contexte', () => {
  const out = preprocessTemplate("{{ include('project/_form.html.twig', {'button_label': 'Update'}) }}");
  assert.equal(out, "{% include 'project/_form.html.twig' with {'button_label': 'Update'} %}");
});

test('range(0, ((x|length)-1)) réécrit', () => {
  assert.equal(preprocessTemplate('{% for i in range(0, ((cm_annual|length)-1)) %}'),
    '{% for i in range(0, cm_annual|length - 1) %}');
});
