/**
 * Sincronizador automático de accesorios SVG para NehurOn.
 *
 * Escanea las carpetas:
 *   - src/assets/mascota/accessories/Cabeza  -> categoría 'hat'
 *   - src/assets/mascota/accessories/Ojos    -> categoría 'glasses'
 *   - src/assets/mascota/accessories/Boca    -> categoría 'mouth'
 *
 * Cada vez que agregues o quites un .svg en cualquiera de esas 3 carpetas,
 * ejecuta:  npm run sync-accessories
 * y el catálogo + SVGs de la app se actualizarán automáticamente.
 */
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../src/assets/mascota/accessories');
const BASE_FERRET_SVG_FILE = path.resolve(__dirname, '../src/assets/mascota/base_nehuron.svg');
const OUT_FILE = path.join(BASE_DIR, 'index.js');

const FOLDERS = [
  {folder: 'Cabeza', category: 'hat'},
  {folder: 'Ojos', category: 'glasses'},
  {folder: 'Boca', category: 'mouth'},
];

// Nombres y precios personalizados para los accesorios existentes
// (cualquier archivo nuevo que agregues usará su nombre formateado y 250 pts por defecto)
const CUSTOM_META = {
  hat_gorra: {name: 'Gorra NehurOn', price: 200},
  hat_sombrero: {name: 'Sombrero Clásico', price: 300},
  hat_birrete: {name: 'Birrete de Graduado', price: 400},
  hat_audifonos: {name: 'Audífonos Gamer', price: 350},
  hat_airpods: {name: 'AirPods Pro', price: 250},
  reno: {name: 'Cuernos de Reno', price: 300},
  gorro_navidad: {name: 'Gorro de Navidad', price: 350},
  gl_clasicos: {name: 'Lentes Intelectual', price: 150},
  gl_sol: {name: 'Lentes de Sol', price: 300},
  gl_pixel: {name: 'Lentes Pixel Thug', price: 500},
  gl_mostacho: {name: 'Mostacho Distinguido', price: 200},
  lengua: {name: 'Lengüita', price: 150},
};

function formatNameFromId(id) {
  // Quita prefijos opcionales (hat_, gl_, mouth_, boca_) y formatea a Título
  const cleaned = id.replace(/^(hat_|gl_|mouth_|boca_|ojos_|cabeza_)/i, '');
  return cleaned
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function run() {
  const svgs = {};
  const catalog = [];

  for (const {folder, category} of FOLDERS) {
    const dir = path.join(BASE_DIR, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
      continue;
    }

    const files = fs
      .readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith('.svg'))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const id = path.basename(file, path.extname(file));
      const fullPath = path.join(dir, file);
      const xml = fs.readFileSync(fullPath, 'utf8');

      svgs[id] = xml;

      const override = CUSTOM_META[id];
      catalog.push({
        id,
        category,
        folder,
        name: override?.name || formatNameFromId(id),
        price: override?.price !== undefined ? override.price : 250,
      });
    }
  }

  // Leer base_nehuron.svg y quitar la capa de fondo sólido (Layer_4) para que sea transparente
  let baseFerretXml = '';
  if (fs.existsSync(BASE_FERRET_SVG_FILE)) {
    baseFerretXml = fs
      .readFileSync(BASE_FERRET_SVG_FILE, 'utf8')
      .replace(/<g[^>]*id=["']Layer_4["'][^>]*>[\s\S]*?<\/g>/i, '');
  }

  const output = `/**
 * ARCHIVO AUTO-GENERADO por tools/sync-accessories.js
 * No edites manualmente: modifica base_nehuron.svg o agrega tus .svg
 * en Cabeza/, Ojos/ o Boca/ y ejecuta "npm run sync-accessories".
 */

export const BASE_NEHURON_SVG = ${JSON.stringify(baseFerretXml)};

export const ACCESSORY_SVGS = ${JSON.stringify(svgs, null, 2)};

export const ACCESSORY_CATALOG = ${JSON.stringify(catalog, null, 2)};

export default ACCESSORY_SVGS;
`;

  fs.writeFileSync(OUT_FILE, output, 'utf8');
  console.log(`✅ Sincronizado base_nehuron.svg + ${catalog.length} accesorios en ${OUT_FILE}:`);
  for (const {folder, category} of FOLDERS) {
    const count = catalog.filter(c => c.category === category).length;
    console.log(`   - ${folder} (${category}): ${count} accesorios`);
  }
}

run();
