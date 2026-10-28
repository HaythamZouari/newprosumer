// Registre des contrôleurs : nom de route (annotation @Route name=...) -> action.
import * as basic from './basic.js';
import * as project from './project.js';
import * as production from './production.js';

/** project_show : GET = page du wizard ; POST XHR = construction de la courbe de consommation. */
async function project_show(ctx) {
  if (ctx.request.isXmlHttpRequest()) return project.show(ctx);
  return basic.project_show_page(ctx);
}

export const CONTROLLERS = {
  dashboard: basic.dashboard,
  offres: basic.offres,
  product: basic.product,
  security_login: basic.security_login,
  security_logout: basic.security_logout,
  security_confirm: basic.security_confirm,
  user_register: basic.user_register,
  contact: basic.contact,
  project_index: basic.project_index,
  project_new: basic.project_new,
  project_edit: basic.project_edit,
  project_delete: basic.project_delete,
  project_show,
  excelupload: project.excelupload,
  suppsite: project.suppsite,
  suppcc: project.suppcc,
  editpro: project.getdata,
  pvgis: production.pvgis,
  ninja: production.ninja,
  readcsv: production.readcsv,
};
