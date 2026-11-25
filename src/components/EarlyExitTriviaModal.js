import React, {useState, useEffect} from 'react';
import {View, Text, Modal, Pressable, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {EXIT_PENALTIES, pickRandomQuestion} from '../data/triviaQuestions';
import useUserStore from '../store/useUserStore';
import {colors, radius} from '../theme';

/**
 * Modal de reto de cultura general al intentar terminar una sesión de enfoque
 * antes de tiempo:
 *  - Hasta 3 intentos.
 *  - Si responde bien: termina la sesión sin ganar puntos (ni penalización extra).
 *  - Si falla: descuenta -5 (intento 1), -10 (intento 2) y -15 (intento 3).
 *  - Al fallar el 3er intento: aplica el -15 y termina la sesión.
 */
export default function EarlyExitTriviaModal({visible, onCancel, onAllowExit}) {
  const deductPoints = useUserStore(s => s.deductPoints);
  const [attempt, setAttempt] = useState(0); // 0, 1, 2
  const [usedIndices, setUsedIndices] = useState([]);
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [totalLost, setTotalLost] = useState(0);

  useEffect(() => {
    if (visible) {
      const first = pickRandomQuestion([]);
      setAttempt(0);
      setUsedIndices([first.index]);
      setQuestion(first);
      setFeedback(null);
      setTotalLost(0);
    }
  }, [visible]);

  if (!visible || !question) return null;

  const currentPenalty = EXIT_PENALTIES[attempt] ?? 15;

  const handleSelectOption = optionIdx => {
    if (optionIdx === question.answer) {
      // Acertó: puede salir sin ganar puntos
      onAllowExit({passed: true, totalLost});
      return;
    }

    // Falló: descontar tokens según el intento (-5, -10, -15)
    deductPoints(currentPenalty);
    const newTotalLost = totalLost + currentPenalty;
    setTotalLost(newTotalLost);

    if (attempt + 1 >= EXIT_PENALTIES.length) {
      // Falló el 3er intento: terminar sesión con la consecuencia aplicada
      onAllowExit({passed: false, totalLost: newTotalLost});
    } else {
      const nextAttempt = attempt + 1;
      const nextQ = pickRandomQuestion(usedIndices);
      setAttempt(nextAttempt);
      setUsedIndices(prev => [...prev, nextQ.index]);
      setQuestion(nextQ);
      setFeedback(
        `Respuesta incorrecta (-${currentPenalty} tokens). Intento ${nextAttempt + 1} de ${EXIT_PENALTIES.length}.`,
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Icon name="head-question-outline" size={16} color={colors.accent} />
              <Text style={styles.badgeText}>
                Intento {attempt + 1} de {EXIT_PENALTIES.length}
              </Text>
            </View>
            <View style={styles.penaltyBadge}>
              <Text style={styles.penaltyText}>Si fallas: -{currentPenalty} pts</Text>
            </View>
          </View>

          <Text style={styles.title}>¿Seguro que deseas salir antes?</Text>
          <Text style={styles.subtitle}>
            Responde correctamente para desbloquear tus apps (no ganarás tokens por esta sesión).
          </Text>

          {feedback ? (
            <View style={styles.feedbackBox}>
              <Icon name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          ) : null}

          <View style={styles.questionBox}>
            <Text style={styles.questionText}>{question.q}</Text>
          </View>

          <View style={styles.optionsList}>
            {question.options.map((opt, idx) => (
              <Pressable
                key={idx}
                style={({pressed}) => [styles.optionBtn, pressed && styles.optionBtnPressed]}
                onPress={() => handleSelectOption(idx)}>
                <Text style={styles.optionLetter}>
                  {String.fromCharCode(65 + idx)}.
                </Text>
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.stayBtn} onPress={onCancel}>
            <Icon name="shield-check-outline" size={18} color="#FFFFFF" />
            <Text style={styles.stayBtnText}>Seguir enfocado</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 16, 32, 0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  penaltyBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  penaltyText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: radius.sm,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  feedbackText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  questionBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  optionsList: {
    marginTop: 12,
    gap: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionBtnPressed: {
    opacity: 0.75,
    borderColor: colors.accent,
  },
  optionLetter: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 14,
    marginRight: 10,
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  stayBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  stayBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
