// Registre des contrôleurs : nom de route (annotation @Route name=...) -> action.
import * as basic from './basic.js';

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
  project_show: basic.project_show_page,
};
