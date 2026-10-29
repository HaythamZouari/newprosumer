// Parité de la suite pseudo-aléatoire : mt_srand(seed) + rand(min,max) du vrai PHP vs port JS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PhpMt } from '../app/lib/phpRandom.js';

const PHP = join(dirname(fileURLToPath(import.meta.url)), 'php', 'random.php');
const php = (seed, calls) => JSON.parse(execFileSync('php', [PHP], { input: JSON.stringify({ seed, calls }), encoding: 'utf8' }));

// Plages typiques de l'application (puissances Phad..Phm des activités) + cas limites.
const RANGES = [[0, 1], [119, 494], [360, 494], [1150, 1876], [10, 1000], [5, 5], [0, 255], [0, 65535], [1, 2 ** 31 - 2], [500, 100], [0, 7]];

for (const seed of [1, 42, 123456, 2019, 4294967295]) {
  test(`mt_srand(${seed}) : 1100 tirages rand(min,max) identiques à PHP`, () => {
    const calls = [];
    for (let i = 0; i < 1100; i++) calls.push(RANGES[i % RANGES.length]);
    const expected = php(seed, calls);
    const mt = new PhpMt(seed);
    const got = calls.map(([a, b]) => mt.rand(a, b));
    assert.deepEqual(got, expected);
  });
}
