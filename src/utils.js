export const TOPICS = ['All topics', 'Neurodegeneration', 'Sleep', 'BCI', 'Memory', 'Mental health']

const ACCENTS = {
  Neurodegeneration: 'coral',
  Sleep: 'blue',
  BCI: 'green',
  Memory: 'violet',
  'Mental health': 'gold',
}

export const accentFor = (topic) => ACCENTS[topic] ?? 'blue'