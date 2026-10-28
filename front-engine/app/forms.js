// Formulaires Symfony (thème bootstrap_4_layout) : ProjectType, UserType, ContactType.
// Le HTML produit est identique à celui de Symfony 4.3 (relevé en rendant les vrais formulaires),
// y compris les messages d'erreur et les classes `is-invalid`.

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ERR = (msg) => `<span class="invalid-feedback d-block"><span class="d-block">
                    <span class="form-error-icon badge badge-danger text-uppercase">Error</span> <span class="form-error-message">${esc(msg)}</span>
                </span></span>`;
const GLOBAL_ERR = (msg) => `<span class="alert alert-danger d-block"><span class="d-block">
                    <span class="form-error-icon badge badge-danger text-uppercase">Error</span> <span class="form-error-message">${esc(msg)}</span>
                </span></span>`;

// ---- définitions des types (champs, libellés, obligatoire : identiques aux *Type.php) ----
export const TYPES = {
  project: {
    name: 'project',
    fields: [
      { name: 'name', type: 'text', label: 'Nom', required: true },
      { name: 'adress', type: 'text', label: 'Client', required: false },
      { name: 'description', type: 'text', label: 'Description', required: false },
    ],
  },
  user: {
    name: 'user',
    fields: [
      { name: 'username', type: 'text', label: 'Nom d`utilisateur', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'plainPassword', type: 'repeated', label: 'Mot de passe', label2: 'Répeter le mot de passe', required: true },
      // Dans UserType.php, `required => false` est passé en 4e argument (ignoré) : ces champs restent requis.
      { name: 'fullName', type: 'text', label: 'Nom & Prénom', required: true },
      { name: 'societe', type: 'text', label: 'Institution', required: true },
      { name: 'Register', type: 'submit', label: 'S`enregistrer' },
    ],
  },
  contact: {
    name: 'contact',
    fields: [
      { name: 'username', type: 'text', label: 'Nom & Prénom', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'message', type: 'textarea', label: 'Message', required: true },
      { name: 'Register', type: 'submit', label: 'Envoyer' },
    ],
  },
};

const isBlank = (v) => v === null || v === undefined || String(v).trim() === '';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validations des contraintes d'entité / de formulaire (messages Symfony, locale en). */
export function validate(typeName, values, { uniques = {} } = {}) {
  const errors = { _global: [] };
  const add = (f, m) => { (errors[f] ||= []).push(m); };
  const len = (f, v, min, max) => {
    if (v === null || v === undefined || v === '') return;
    const n = [...String(v)].length;
    if (min !== undefined && n < min) add(f, `This value is too short. It should have ${min} characters or more.`);
    if (max !== undefined && n > max) add(f, `This value is too long. It should have ${max} characters or less.`);
  };
  if (typeName === 'project') {
    if (isBlank(values.name)) add('name', 'This value should not be blank.');
    // colonne name : length=50 ; adress : 100 (pas d'Assert, mais Doctrine tronquerait/échouerait)
  }
  if (typeName === 'user') {
    if (isBlank(values.username)) add('username', 'This value should not be blank.'); else len('username', values.username, 5, 50);
    if (isBlank(values.email)) add('email', 'This value should not be blank.');
    else if (!EMAIL_RE.test(values.email)) add('email', 'This value is not a valid email address.');
    const pw = values.plainPassword || {};
    if (pw.first !== pw.second) add('plainPassword.first', 'This value is not valid.');
    else if (isBlank(pw.first)) add('plainPassword.first', 'This value should not be blank.');
    else len('plainPassword.first', pw.first, 8, 4096);
    len('fullName', values.fullName, 4, 50);
    if (uniques.email) add('email', 'This e-mail is already used');
    if (uniques.username) add('username', 'This username is already used');
  }
  if (typeName === 'contact') {
    if (isBlank(values.username)) add('username', 'This value should not be blank.');
    if (isBlank(values.email)) add('email', 'This value should not be blank.');
    else if (!EMAIL_RE.test(values.email)) add('email', 'This value is not a valid email address.');
    if (isBlank(values.message)) add('message', 'This value should not be blank.');
  }
  return errors;
}

export class Form {
  constructor(typeName, data = {}) {
    this.type = TYPES[typeName];
    this.typeName = typeName;
    this.data = data;
    this.submitted = false;
    this.values = { ...data };
    this.errors = { _global: [] };
  }
  /** FormInterface::handleRequest */
  handleRequest(request) {
    if (request.method !== 'POST') return this;
    const sent = request.request[this.type.name];
    if (sent === undefined) return this;
    this.submitted = true;
    this.values = { ...sent };
    return this;
  }
  setErrors(errors) { this.errors = errors; }
  hasErrors() { return Object.values(this.errors).some((a) => a.length); }
  isValid() { return this.submitted && !this.hasErrors(); }
  // ---- rendu ----
  _id(f, sub) { return `${this.type.name}_${f}${sub ? '_' + sub : ''}`; }
  _row(f) {
    const n = this.type.name;
    if (f.type === 'submit') {
      return `<div class="form-group"><button type="submit" id="${this._id(f.name)}" name="${n}[${f.name}]" class="btn-primary btn">${esc(f.label)}</button></div>`;
    }
    const one = (key, label, nameAttr, id, value, errs, itype) => {
      const bad = errs && errs.length;
      const lab = `<label for="${id}"${f.required ? ' class="required"' : ''}>${esc(label)}${bad ? errs.map(ERR).join('') : ''}</label>`;
      const req = f.required ? ' required="required"' : '';
      const cls = `form-control${bad ? ' is-invalid' : ''}`;
      const val = itype === 'password' || value === undefined || value === null || value === '' ? '' : ` value="${esc(value)}"`;
      let w;
      if (itype === 'textarea') {
        w = `<textarea id="${id}" name="${nameAttr}"${req} class="${cls}">${esc(value ?? '')}</textarea>`;
      } else {
        w = `<input type="${itype}"${bad ? '             ' : ' '}id="${id}" name="${nameAttr}"${req} class="${cls}"${val} />`;
      }
      return `<div class="form-group">${lab}${w}</div>`;
    };
    if (f.type === 'repeated') {
      const v = this.values[f.name] || {};
      return one(f.name, f.label, `${n}[${f.name}][first]`, this._id(f.name, 'first'), v.first, this.errors[`${f.name}.first`], 'password')
        + one(f.name, f.label2, `${n}[${f.name}][second]`, this._id(f.name, 'second'), v.second, this.errors[`${f.name}.second`], 'password');
    }
    return one(f.name, f.label, `${n}[${f.name}]`, this._id(f.name), this.values[f.name], this.errors[f.name], f.type);
  }
  start() { return `<form name="${this.type.name}" method="post">`; }
  widget() {
    const glob = this.errors._global.map(GLOBAL_ERR).join('');
    return `<div id="${this.type.name}">${glob}${this.type.fields.map((f) => this._row(f)).join('')}</div>`;
  }
  end() { return '</form>'; }
  /** Objet exposé aux templates (`form` dans form_start(form) …). */
  createView() { return this; }
}

/** Adaptateur pour TwigEnv : les fonctions form_* reçoivent la vue (= le Form). */
export const formRenderer = {
  start: (f) => f.start(),
  widget: (f) => f.widget(),
  end: (f) => f.end(),
};
