const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Customization = require('../models/Customization');

const router = express.Router();

/**
 * Helper para normalizar el objeto equipped desde Mongoose Map o esquema anterior
 */
function getEquippedObject(customization) {
  if (!customization) return {};
  let equipped = {};
  if (customization.equipped) {
    if (customization.equipped instanceof Map) {
      equipped = Object.fromEntries(customization.equipped);
    } else if (typeof customization.equipped === 'object') {
      equipped = {...customization.equipped};
    }
  }
  // Retrocompatibilidad con documentos anteriores de la BD
  if (!equipped.hat && customization.equippedHat) {
    equipped.hat = customization.equippedHat;
  }
  if (!equipped.glasses && customization.equippedGlasses) {
    equipped.glasses = customization.equippedGlasses;
  }
  return equipped;
}

/**
 * POST /api/auth/login
 * Validar credenciales contra MongoDB Atlas (consulta colecciones users, progress, customizations)
 */
router.post('/login', async (req, res) => {
  try {
    const {email, password} = req.body;
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'Por favor ingresa correo y contraseña.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({email: cleanEmail});

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas. Usuario no registrado.',
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas. Contraseña incorrecta.',
      });
    }

    // Consultar las colecciones separadas asociadas al usuario
    let [progress, customization] = await Promise.all([
      Progress.findOne({userId: user._id}),
      Customization.findOne({userId: user._id}),
    ]);

    // Inicializar si no existiesen por retrocompatibilidad
    if (!progress) {
      progress = await Progress.create({
        userId: user._id,
        points: 0,
        streakDays: 0,
        focusHours: 0,
      });
    }

    if (!customization) {
      customization = await Customization.create({
        userId: user._id,
        unlockedItems: [],
        equipped: {},
      });
    }

    const equippedObj = getEquippedObject(customization);

    // Datos ensamblados para enviar al cliente de la app
    const userData = {
      id: user._id,
      email: user.email,
      userName: user.userName,
      age: user.age !== undefined ? user.age : null,
      // Datos de progreso y recompensas
      points: progress.points,
      streakDays: progress.streakDays,
      focusHours: progress.focusHours,
      lastActiveDate: progress.lastActiveDate,
      // Datos de personalización generalizados (dinámico por categoría/ranura)
      unlockedItems: customization.unlockedItems || [],
      equipped: equippedObj,
      // Retrocompatibilidad con versiones anteriores de la app
      equippedHat: equippedObj.hat || null,
      equippedGlasses: equippedObj.glasses || null,
    };

    return res.status(200).json({
      ok: true,
      message: 'Inicio de sesión exitoso',
      user: userData,
    });
  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor al validar credenciales',
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/register
 * Crea usuario en la colección 'users' y sus registros en 'progress' y 'customizations'
 */
router.post('/register', async (req, res) => {
  try {
    const {email, password, userName, age} = req.body;
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'Email y contraseña requeridos',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({email: cleanEmail});
    if (existing) {
      return res.status(400).json({
        ok: false,
        message: 'El correo ya está registrado.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    // 1. Guardar en users con nombre, correo y edad
    const parsedAge = age !== undefined && age !== null && !isNaN(Number(age)) ? Number(age) : null;
    const newUser = new User({
      email: cleanEmail,
      password: hashedPassword,
      userName: userName ? String(userName).trim() : 'Amigo',
      age: parsedAge,
    });
    await newUser.save();

    // 2. Guardar en progress (con bono de bienvenida)
    const newProgress = await Progress.create({
      userId: newUser._id,
      points: 100,
      streakDays: 0,
      focusHours: 0,
    });

    // 3. Guardar en customizations (estructura generalizada de accesorios)
    const newCustomization = await Customization.create({
      userId: newUser._id,
      unlockedItems: ['hat_gorra'],
      equipped: {
        hat: 'hat_gorra',
      },
    });

    const equippedObj = getEquippedObject(newCustomization);

    return res.status(201).json({
      ok: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser._id,
        email: newUser.email,
        userName: newUser.userName,
        age: newUser.age,
        points: newProgress.points,
        streakDays: newProgress.streakDays,
        focusHours: newProgress.focusHours,
        unlockedItems: newCustomization.unlockedItems,
        equipped: equippedObj,
        equippedHat: equippedObj.hat || null,
        equippedGlasses: equippedObj.glasses || null,
      },
    });
  } catch (error) {
    console.error('Error en /api/auth/register:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al registrar usuario',
      error: error.message,
    });
  }
});

/**
 * PUT /api/auth/sync
 * Sincroniza datos de progreso e inventario en sus respectivas colecciones
 */
router.put('/sync', async (req, res) => {
  try {
    const {
      email,
      age,
      points,
      streakDays,
      focusHours,
      lastActiveDate,
      unlockedItems,
      equipped,
      equippedHat,
      equippedGlasses,
    } = req.body;

    if (!email) {
      return res.status(400).json({ok: false, message: 'Email requerido'});
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({email: cleanEmail});
    if (!user) {
      return res.status(404).json({ok: false, message: 'Usuario no encontrado'});
    }

    // Actualizar edad si se envió
    if (age !== undefined && !isNaN(Number(age))) {
      await User.findByIdAndUpdate(user._id, {age: Number(age)});
    }

    // Actualizar progreso si se enviaron campos correspondientes
    const progressUpdates = {};
    if (points !== undefined) progressUpdates.points = points;
    if (streakDays !== undefined) progressUpdates.streakDays = streakDays;
    if (focusHours !== undefined) progressUpdates.focusHours = focusHours;
    if (lastActiveDate !== undefined) progressUpdates.lastActiveDate = lastActiveDate;

    if (Object.keys(progressUpdates).length > 0) {
      await Progress.findOneAndUpdate(
        {userId: user._id},
        progressUpdates,
        {upsert: true, new: true}
      );
    }

    // Actualizar inventario de personalización
    const customUpdates = {};
    if (unlockedItems !== undefined) customUpdates.unlockedItems = unlockedItems;

    // Guardar accesorios equipados de forma dinámica y generalizada
    if (equipped !== undefined && typeof equipped === 'object') {
      customUpdates.equipped = equipped;
    } else if (equippedHat !== undefined || equippedGlasses !== undefined) {
      // Fallback para clientes antiguos
      const current = await Customization.findOne({userId: user._id});
      const eq = getEquippedObject(current);
      if (equippedHat !== undefined) eq.hat = equippedHat;
      if (equippedGlasses !== undefined) eq.glasses = equippedGlasses;
      customUpdates.equipped = eq;
    }

    if (Object.keys(customUpdates).length > 0) {
      await Customization.findOneAndUpdate(
        {userId: user._id},
        customUpdates,
        {upsert: true, new: true}
      );
    }

    return res.json({ok: true, message: 'Progreso y personalización sincronizados en MongoDB'});
  } catch (error) {
    console.error('Error en /api/auth/sync:', error);
    return res.status(500).json({ok: false, error: error.message});
  }
});

module.exports = router;
