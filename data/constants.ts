
// Estimativas de nicotina por unidade para diferentes fontes
export const NICOTINE_ESTIMATES: { [key: string]: number } = {
  Cigarettes: 1.2, // mg por cigarro
  Vapes: 0.7, // mg por puff (muito variável)
  'Nicotine Pouch': 0.9, // mg por unidade
  'Heated Tobacco': 1.0, // mg por stick
  Other: 0.5, // estimativa genérica
};
