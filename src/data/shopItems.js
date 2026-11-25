import {ACCESSORY_SVGS, ACCESSORY_CATALOG} from '../assets/mascota/accessories';

/**
 * Catálogo Oficial de Accesorios NehurOn
 * Generado automáticamente desde las carpetas:
 *  - Cabeza/ ('hat')
 *  - Ojos/   ('glasses')
 *  - Boca/   ('mouth')
 *
 * Para agregar nuevos accesorios: solo coloca el .svg en la carpeta
 * correspondiente y ejecuta "npm run sync-accessories".
 */
export const SHOP_ITEMS = ACCESSORY_CATALOG.map(item => ({
  ...item,
  svgXml: ACCESSORY_SVGS[item.id],
}));

export const getItem = id => SHOP_ITEMS.find(i => i.id === id) || null;

/**
 * Paleta de colores de fondo personalizables para el hurón NehurOn
 */
export const AVATAR_BG_COLORS = [
  {id: 'transparent', name: 'Sin fondo', hex: 'transparent'},
  {id: '#F9BA51', name: 'NehurOn', hex: '#F9BA51'},
  {id: '#A7F3D0', name: 'Menta', hex: '#A7F3D0'},
  {id: '#BAE6FD', name: 'Cielo', hex: '#BAE6FD'},
  {id: '#DDD6FE', name: 'Lavanda', hex: '#DDD6FE'},
  {id: '#FBCFE8', name: 'Rosa', hex: '#FBCFE8'},
  {id: '#FED7AA', name: 'Durazno', hex: '#FED7AA'},
  {id: '#FEF08A', name: 'Limón', hex: '#FEF08A'},
  {id: '#0F766E', name: 'Bosque', hex: '#0F766E'},
  {id: '#1E293B', name: 'Noche', hex: '#1E293B'},
  {id: '#4C1D95', name: 'Galaxia', hex: '#4C1D95'},
  {id: '#991B1B', name: 'Navidad', hex: '#991B1B'},
];

export const DEFAULT_BLOCKED_APPS = [
  {pkg: 'com.instagram.android', name: 'Instagram'},
  {pkg: 'com.zhiliaoapp.musically', name: 'TikTok'},
  {pkg: 'com.facebook.katana', name: 'Facebook'},
  {pkg: 'com.twitter.android', name: 'X / Twitter'},
  {pkg: 'com.google.android.youtube', name: 'YouTube'},
  {pkg: 'com.snapchat.android', name: 'Snapchat'},
  {pkg: 'com.reddit.frontpage', name: 'Reddit'},
];
