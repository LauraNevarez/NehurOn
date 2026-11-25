import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {zustandStorage} from './mmkv';
import {dateKey, yesterdayKey, getBreakMinutes} from '../utils/date';
import {DEFAULT_BLOCKED_APPS} from '../data/shopItems';
import {apiSyncProgress} from '../services/api';

// Helper de sincronización no bloqueante con MongoDB Atlas
const syncWithBackend = state => {
  if (!state.userEmail) return;
  const equipped = state.equipped || {};
  apiSyncProgress({
    email: state.userEmail,
    age: state.userAge,
    points: state.points,
    streakDays: state.streakDays,
    focusHours: state.focusHours,
    lastActiveDate: state.lastActiveDate,
    focusLog: state.focusLog,
    unlockedItems: state.unlockedItems,
    equipped: equipped,
    equippedHat: equipped.hat || state.equippedHat || null,
    equippedGlasses: equipped.glasses || state.equippedGlasses || null,
  }).catch(() => {
    // Si el backend local no está corriendo, los datos persisten seguros en MMKV local
  });
};

const initialState = {
  // Flujo de autenticación con MongoDB Atlas
  isAuthenticated: false,
  userEmail: null,
  hasOnboarded: false,
  userName: 'Explorador',
  userAge: null,
  points: 100,
  streakDays: 0,
  lastActiveDate: null,
  focusHours: 0.0,
  focusLog: {}, // { 'YYYY-MM-DD': minutos }
  isEssentialModeActive: false,
  sessionStartedAt: null,

  // Pomodoro & Meta activa
  pomodoroPhase: 'focus', // 'focus' | 'break'
  phaseStartedAt: null,
  focusMinutes: 25,        // duración del ciclo de enfoque actual
  graceMinutes: 5,         // duración del descanso actual
  totalDurationMinutes: 25,// duración total de la meta seleccionada
  completedFocusMinutes: 0,// minutos acumulados completados en la sesión actual
  pomodoroCycles: 0,       // ciclos completados
  activeGoalName: null,

  blockedApps: DEFAULT_BLOCKED_APPS.map(a => a.pkg),
  unlockedItems: ['hat_gorra'],
  // Estructura generalizada de accesorios: { [categoría]: idAccesorio }
  equipped: {
    hat: 'hat_gorra',
    glasses: null,
  },
  equippedGlasses: null,
  equippedHat: 'hat_gorra',
};

const useUserStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setUserName: userName => set({userName}),
      setUserAge: userAge => set({userAge}),
      completeOnboarding: () => set({hasOnboarded: true}),
      addPoints: n => set(s => ({points: s.points + n})),

      loginSuccess: userData =>
        set(s => {
          let equipped = userData.equipped;
          if (!equipped || typeof equipped !== 'object') {
            equipped = {
              hat: userData.equippedHat || null,
              glasses: userData.equippedGlasses || null,
            };
          }
          return {
            isAuthenticated: true,
            userEmail: userData.email,
            userName: userData.userName || 'Explorador',
            userAge: userData.age !== undefined ? userData.age : null,
            points: userData.points !== undefined ? userData.points : 0,
            streakDays: userData.streakDays !== undefined ? userData.streakDays : 0,
            focusHours: userData.focusHours !== undefined ? userData.focusHours : 0,
            lastActiveDate: userData.lastActiveDate || null,
            focusLog:
              userData.focusLog && typeof userData.focusLog === 'object'
                ? userData.focusLog
                : {},
            unlockedItems: Array.isArray(userData.unlockedItems)
              ? userData.unlockedItems
              : [],
            equipped: equipped,
            equippedHat: equipped.hat || null,
            equippedGlasses: equipped.glasses || null,
          };
        }),

      logout: () =>
        set(s => ({
          ...initialState,
          hasOnboarded: s.hasOnboarded,
          blockedApps: s.blockedApps,
          isAuthenticated: false,
        })),

      toggleBlockedApp: pkg =>
        set(s => ({
          blockedApps: s.blockedApps.includes(pkg)
            ? s.blockedApps.filter(p => p !== pkg)
            : [...s.blockedApps, pkg],
        })),

      // ---- Iniciar Modo Esencial con duración total de la meta ----
      startEssentialMode: (durationMin = 25, goalName = null) => {
        const now = Date.now();
        // Si dura más de 25 min, se trabaja por bloques de 25 min
        const firstCycleMinutes = Math.min(25, durationMin);
        const breakMin = getBreakMinutes(durationMin);

        set({
          isEssentialModeActive: true,
          sessionStartedAt: now,
          pomodoroPhase: 'focus',
          phaseStartedAt: now,
          focusMinutes: firstCycleMinutes,
          graceMinutes: breakMin,
          totalDurationMinutes: durationMin,
          completedFocusMinutes: 0,
          pomodoroCycles: 0,
          activeGoalName: goalName,
        });
      },

      setPomodoroPhase: phase => {
        const now = Date.now();
        set(s => ({
          pomodoroPhase: phase,
          phaseStartedAt: now,
          pomodoroCycles: phase === 'break' ? s.pomodoroCycles + 1 : s.pomodoroCycles,
        }));
      },

      /**
       * Se ejecuta al terminar un bloque de enfoque.
       * Retorna { done: boolean, remainingTotal: number, nextCycleMinutes: number }
       */
      completeFocusCycle: () => {
        const s = get();
        const cycleDone = s.focusMinutes;
        const newCompleted = s.completedFocusMinutes + cycleDone;
        const remainingTotal = s.totalDurationMinutes - newCompleted;

        if (remainingTotal <= 0) {
          // Ya se completó toda la meta
          set({completedFocusMinutes: s.totalDurationMinutes});
          return {done: true, remainingTotal: 0, nextCycleMinutes: 0};
        }

        // Queda más tiempo: calcular el siguiente bloque (máx 25 min)
        const nextCycle = Math.min(25, remainingTotal);
        set({
          completedFocusMinutes: newCompleted,
          focusMinutes: nextCycle,
        });

        return {done: false, remainingTotal, nextCycleMinutes: nextCycle};
      },

      stopEssentialMode: (isCompleted = false) => {
        const s = get();
        // Minutos reales transcurridos de la sesión
        const realMinutes = s.sessionStartedAt
          ? Math.floor((Date.now() - s.sessionStartedAt) / 60000)
          : 0;

        // Se considera completada si se agotó el tiempo automáticamente o si el tiempo real transcurrido cubre la duración planeada
        const fullyCompleted = isCompleted || realMinutes >= s.totalDurationMinutes;

        // Regla estricta: Solo se otorga recompensa si la sesión duró AL MENOS 20 MINUTOS REALES
        // Si el usuario cancela antes de tiempo sin haber cumplido al menos 20 min reales, NO hay puntos ni racha.
        const givesReward = s.totalDurationMinutes >= 20 && (fullyCompleted || realMinutes >= 20);

        const today = dateKey();
        let streak = s.streakDays;
        let lastActiveDate = s.lastActiveDate;

        if (givesReward) {
          if (s.lastActiveDate === today) {
            // Ya contó la racha de hoy
          } else if (s.lastActiveDate === yesterdayKey()) {
            streak += 1;
          } else {
            streak = 1;
          }
          lastActiveDate = today;
        }

        // Puntos ganados: SOLO si se cumplen los 20 min reales
        let earned = 0;
        if (givesReward) {
          earned = fullyCompleted ? s.totalDurationMinutes : realMinutes;
        }

        const cycles = s.pomodoroCycles;
        const goalName = s.activeGoalName;

        const newState = {
          isEssentialModeActive: false,
          sessionStartedAt: null,
          pomodoroPhase: 'focus',
          phaseStartedAt: null,
          activeGoalName: null,
          focusMinutes: 25,
          graceMinutes: 5,
          totalDurationMinutes: 25,
          completedFocusMinutes: 0,
          pomodoroCycles: 0,
          points: s.points + earned,
          focusHours: +(s.focusHours + realMinutes / 60).toFixed(2),
          focusLog: {...s.focusLog, [today]: (s.focusLog[today] || 0) + realMinutes},
          streakDays: streak,
          lastActiveDate,
        };

        set(newState);
        syncWithBackend(get());

        return {
          minutes: realMinutes,
          points: earned,
          streak,
          cycles,
          activeGoalName: goalName,
          givesReward,
          fullyCompleted,
          totalDuration: s.totalDurationMinutes,
        };
      },

      // ---- Armario con soporte generalizado para cualquier categoría ----
      purchaseOrToggle: item => {
        const s = get();
        const owned = s.unlockedItems.includes(item.id);

        if (!owned) {
          if (s.points < item.price) {
            return {ok: false, reason: 'insufficient', missing: item.price - s.points};
          }
          set({points: s.points - item.price, unlockedItems: [...s.unlockedItems, item.id]});
        }

        const category = item.category || 'hat';
        const currentEquipped = s.equipped || {};
        const isCurrentlyEquipped = currentEquipped[category] === item.id;
        const newEquipped = {
          ...currentEquipped,
          [category]: isCurrentlyEquipped ? null : item.id,
        };

        set({
          equipped: newEquipped,
          equippedHat: newEquipped.hat || null,
          equippedGlasses: newEquipped.glasses || null,
        });
        syncWithBackend(get());
        return {ok: true, bought: !owned, equipped: !isCurrentlyEquipped};
      },

      resetAll: () => set({...initialState}),
    }),
    {
      name: 'user-store',
      storage: zustandStorage,
    },
  ),
);

export default useUserStore;
