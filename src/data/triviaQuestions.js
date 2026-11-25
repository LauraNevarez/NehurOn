/**
 * Banco de preguntas de cultura general para el reto de salida anticipada
 * del Modo Esencial en NehurOn (funciona 100% offline).
 */

export const EXIT_PENALTIES = [5, 10, 15]; // Intento 1: -5 pts, Intento 2: -10 pts, Intento 3: -15 pts

export const TRIVIA_QUESTIONS = [
  {
    q: '¿Cuál es el planeta más grande del sistema solar?',
    options: ['Saturno', 'Júpiter', 'Neptuno', 'Marte'],
    answer: 1,
  },
  {
    q: '¿Cuál es el símbolo químico del oro?',
    options: ['Ag', 'Gd', 'Au', 'Or'],
    answer: 2,
  },
  {
    q: '¿En qué año llegó el ser humano a la Luna por primera vez?',
    options: ['1965', '1969', '1972', '1959'],
    answer: 1,
  },
  {
    q: '¿Cuál es el océano más grande de la Tierra?',
    options: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'],
    answer: 3,
  },
  {
    q: '¿Quién pintó "La noche estrellada"?',
    options: ['Pablo Picasso', 'Vincent van Gogh', 'Claude Monet', 'Salvador Dalí'],
    answer: 1,
  },
  {
    q: '¿Cuántos huesos tiene aproximadamente el cuerpo humano adulto?',
    options: ['186', '206', '226', '250'],
    answer: 1,
  },
  {
    q: '¿Cuál es la capital de Japón?',
    options: ['Kioto', 'Osaka', 'Tokio', 'Seúl'],
    answer: 2,
  },
  {
    q: '¿Qué gas necesitan las plantas para realizar la fotosíntesis?',
    options: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Hidrógeno'],
    answer: 2,
  },
  {
    q: '¿Quién escribió "Don Quijote de la Mancha"?',
    options: ['Gabriel García Márquez', 'Miguel de Cervantes', 'Lope de Vega', 'Jorge Luis Borges'],
    answer: 1,
  },
  {
    q: '¿Cuál es el río más largo de América del Sur?',
    options: ['Orinoco', 'Paraná', 'Amazonas', 'Magdalena'],
    answer: 2,
  },
  {
    q: '¿Cuántos bits conforman un byte?',
    options: ['4', '8', '16', '32'],
    answer: 1,
  },
  {
    q: '¿Qué país tiene forma de bota en el mapa de Europa?',
    options: ['Grecia', 'España', 'Portugal', 'Italia'],
    answer: 3,
  },
  {
    q: '¿Cuál es el metal líquido a temperatura ambiente?',
    options: ['Plomo', 'Mercurio', 'Aluminio', 'Zinc'],
    answer: 1,
  },
  {
    q: '¿En qué continente se encuentra Egipto?',
    options: ['Asia', 'Europa', 'África', 'Oceanía'],
    answer: 2,
  },
  {
    q: '¿Quién formuló la teoría de la relatividad?',
    options: ['Isaac Newton', 'Nikola Tesla', 'Albert Einstein', 'Galileo Galilei'],
    answer: 2,
  },
  {
    q: '¿Cuál es el idioma con más hablantes nativos en el mundo?',
    options: ['Inglés', 'Español', 'Chino mandarín', 'Hindi'],
    answer: 2,
  },
  {
    q: '¿Qué órgano del cuerpo humano bombea la sangre?',
    options: ['Hígado', 'Pulmón', 'Riñón', 'Corazón'],
    answer: 3,
  },
  {
    q: '¿Cuántos lados tiene un hexágono?',
    options: ['5', '6', '7', '8'],
    answer: 1,
  },
  {
    q: '¿Cuál es la capital de Canadá?',
    options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'],
    answer: 2,
  },
  {
    q: '¿Qué científico descubrió la penicilina?',
    options: ['Louis Pasteur', 'Alexander Fleming', 'Marie Curie', 'Charles Darwin'],
    answer: 1,
  },
  {
    q: '¿Cuál es el planeta más cercano al Sol?',
    options: ['Venus', 'Marte', 'Mercurio', 'Tierra'],
    answer: 2,
  },
  {
    q: '¿En qué ciudad se encuentran las ruinas de Machu Picchu (país)?',
    options: ['Bolivia', 'Perú', 'Chile', 'Ecuador'],
    answer: 1,
  },
  {
    q: '¿Qué significa la sigla "HTTP" en informática?',
    options: [
      'HyperText Transfer Protocol',
      'High Tech Transmission Program',
      'Hyperlink Text Tracking Process',
      'Host Transfer Text Protocol',
    ],
    answer: 0,
  },
  {
    q: '¿Cuál es el elemento químico más abundante en el universo?',
    options: ['Oxígeno', 'Carbono', 'Hidrógeno', 'Helio'],
    answer: 2,
  },
  {
    q: '¿Cuántos grados suman los ángulos internos de un triángulo?',
    options: ['90°', '180°', '270°', '360°'],
    answer: 1,
  },
  {
    q: '¿Qué instrumento mide la presión atmosférica?',
    options: ['Termómetro', 'Barómetro', 'Anemómetro', 'Higrómetro'],
    answer: 1,
  },
  {
    q: '¿Cuál es la montaña más alta del mundo sobre el nivel del mar?',
    options: ['K2', 'Aconcagua', 'Monte Everest', 'Kilimanjaro'],
    answer: 2,
  },
  {
    q: '¿En qué año cayó el Muro de Berlín?',
    options: ['1985', '1989', '1991', '1979'],
    answer: 1,
  },
  {
    q: '¿Cuál es el animal terrestre más rápido del mundo?',
    options: ['León', 'Guepardo', 'Antílope', 'Caballo'],
    answer: 1,
  },
  {
    q: '¿Qué vitamina se produce principalmente al exponernos al sol?',
    options: ['Vitamina A', 'Vitamina C', 'Vitamina D', 'Vitamina B12'],
    answer: 2,
  },
];

export function pickRandomQuestion(usedIndices = []) {
  const available = TRIVIA_QUESTIONS.map((_, idx) => idx).filter(
    idx => !usedIndices.includes(idx),
  );
  const pool = available.length > 0 ? available : TRIVIA_QUESTIONS.map((_, i) => i);
  const chosenIdx = pool[Math.floor(Math.random() * pool.length)];
  return {index: chosenIdx, ...TRIVIA_QUESTIONS[chosenIdx]};
}
