const mongoose = require('mongoose');

const customizationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Array de IDs de accesorios desbloqueados/comprados (ej: 'hat_gorra', 'gl_pixel')
    unlockedItems: {
      type: [String],
      default: [],
    },
    // Diccionario generalizado de accesorios equipados por categoría/ranura
    // Permite cualquier tipo de accesorio (hat, glasses, torso, head, etc.)
    // sin tener que agregar columnas rígidas a la base de datos.
    equipped: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'customizations', // Colección en MongoDB Atlas
  }
);

module.exports = mongoose.model('Customization', customizationSchema);
