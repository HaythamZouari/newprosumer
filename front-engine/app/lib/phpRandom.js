// Port de mt_srand()/mt_rand()/rand() de PHP >= 7.1 (Mersenne Twister MT19937 + tirage borné sans biais).
// L'original utilise rand($a,$b) pour générer les courbes de consommation synthétiques ; pour
// vérifier la parité avec le PHP il faut reproduire EXACTEMENT sa suite pseudo-aléatoire.
//
// PHP : rand($min,$max) == mt_rand($min,$max) (même algorithme depuis 7.1) ; si max < min,
// rand() échange les bornes alors que mt_rand() échoue : on reproduit rand().

const N = 624, M = 397;

export class PhpMt {
  constructor(seed) {
    this.state = new Uint32Array(N);
    this.index = N;
    this.seed(seed === undefined ? Math.floor(Math.random() * 2 ** 32) : seed);
  }

  seed(s) {
    const st = this.state;
    st[0] = s >>> 0;
    for (let i = 1; i < N; i++) {
      const prev = st[i - 1] ^ (st[i - 1] >>> 30);
      // 1812433253 * prev + i  (mod 2^32), sans dépasser 2^53
      st[i] = (Math.imul(1812433253, prev) + i) >>> 0;
    }
    this.reload();
  }

  reload() {
    const st = this.state;
    const twist = (m, u, v) => (m ^ (((u & 0x80000000) | (v & 0x7fffffff)) >>> 1) ^ (-(v & 1) & 0x9908b0df)) >>> 0;
    let i = 0;
    for (; i < N - M; i++) st[i] = twist(st[i + M], st[i], st[i + 1]);
    for (; i < N - 1; i++) st[i] = twist(st[i + M - N], st[i], st[i + 1]);
    st[N - 1] = twist(st[M - 1], st[N - 1], st[0]);
    this.index = 0;
  }

  /** Sortie 32 bits (php_mt_rand) */
  next32() {
    if (this.index >= N) this.reload();
    let s1 = this.state[this.index++];
    s1 ^= s1 >>> 11;
    s1 ^= (s1 << 7) & 0x9d2c5680;
    s1 ^= (s1 << 15) & 0xefc60000;
    return (s1 ^ (s1 >>> 18)) >>> 0;
  }

  /** php_mt_rand_range32 : entier uniforme dans [0, umax] */
  range32(umax) {
    let result = this.next32();
    if (umax === 0xffffffff) return result;
    umax += 1;
    if ((umax & (umax - 1)) === 0) return (result & (umax - 1)) >>> 0;
    const limit = 0xffffffff - (0xffffffff % umax) - 1;
    while (result > limit) result = this.next32();
    return result % umax;
  }

  /** mt_rand(min, max) / rand(min, max) */
  rand(min, max) {
    if (max < min) [min, max] = [max, min];
    return min + this.range32(max - min);
  }
}

/** Générateur global façon PHP (graine aléatoire sauf mt_srand explicite). */
let shared = null;
export function mtSrand(seed) { shared = new PhpMt(seed); }
export function rand(min, max) { if (!shared) shared = new PhpMt(); return shared.rand(min, max); }
