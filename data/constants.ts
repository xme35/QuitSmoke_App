
// Estimativas de nicotina por unidade para diferentes fontes
export const NICOTINE_ESTIMATES: { [key: string]: number } = {
  Cigarettes: 1.2, // mg por cigarro
  Vapes: 0.7, // mg por puff (muito variável)
  Patches: 0.9, // mg por hora (assumindo 21mg/24h patch)
  'Heated Tobacco': 1.0, // mg por stick
  Other: 0.5, // estimativa genérica
};
