export type ScenarioParams = { river: string; source: string; volume: number; breach: number; rainfall: number };
export const defaults: ScenarioParams = { river: 'Melamchi River', source: 'Bhemathang landslide dam', volume: 5, breach: 40, rainfall: 30 };
export const basins: Record<string, { center: [number, number]; source: string; route: [number, number][]; names: string[] }> = {
  'Melamchi River': { center: [85.565, 27.9], source: 'Bhemathang landslide dam', route: [[85.555,28.01],[85.548,27.992],[85.557,27.975],[85.547,27.958],[85.558,27.944],[85.552,27.925],[85.565,27.91],[85.569,27.89],[85.579,27.876],[85.574,27.856],[85.589,27.837],[85.579,27.818]], names: ['Timbu','Kiul','Chanaute','Melamchi'] },
  'Dudh Koshi River': { center: [86.728, 27.68], source: 'Imja Tsho glacial lake', route: [[86.756,27.79],[86.744,27.773],[86.749,27.752],[86.732,27.735],[86.738,27.714],[86.722,27.697],[86.729,27.68],[86.716,27.658],[86.724,27.64],[86.709,27.622],[86.718,27.601],[86.706,27.583]], names: ['Dingboche','Pangboche','Phakding','Lukla outskirts'] },
  'Trishuli River': { center: [85.248, 28.035], source: 'Langtang moraine lake', route: [[85.275,28.145],[85.263,28.126],[85.269,28.109],[85.253,28.088],[85.26,28.07],[85.245,28.051],[85.252,28.033],[85.235,28.014],[85.243,27.996],[85.228,27.977],[85.232,27.958],[85.219,27.938]], names: ['Syabrubesi','Dhunche','Kalikasthan','Betrawati'] }
};
export function validParams(value: unknown): value is ScenarioParams {
  if (!value || typeof value !== 'object') return false;
  const p = value as ScenarioParams;
  return !!basins[p.river] && typeof p.source === 'string' && [p.volume,p.breach,p.rainfall].every(Number.isFinite) && p.volume >= 0.5 && p.volume <= 20 && p.breach >= 5 && p.breach <= 100 && p.rainfall >= 0 && p.rainfall <= 100;
}
export function simulate(p: ScenarioParams) {
  const severity = Math.pow(p.volume / 5, .35) * Math.pow(p.breach / 40, .3) * (1 + p.rainfall / 100) / 1.3;
  const velocity = Math.max(.4, Math.sqrt(severity));
  const populations = [1240,1600,2180,3620];
  const settlements = basins[p.river].names.map((name,i) => ({name, population: populations[i], arrival: Math.round([12,24,37,51][i] / velocity), depth: Number((4.2 * severity * (1 - i * .14)).toFixed(1)), index: [2,5,8,10][i], facilities: [1,2,3,5][i]}));
  return { severity, velocity, peakDepth: Number((4.2*severity).toFixed(1)), peakDischarge: Math.round(.6 * p.breach * Math.pow(p.volume * 2, 1.5) * Math.sqrt(19.62)), settlements, totalPopulation: populations.reduce((a,b)=>a+b,0), duration: 60 };
}
export type SimulationResult = ReturnType<typeof simulate>;
export function metricsAt(result: SimulationResult, minute: number) {
  const affected = result.settlements.filter(s=>s.arrival<=minute);
  return { population: affected.reduce((sum,s)=>sum+s.population,0), roads: Math.min(16,Math.round(minute / 30 * 7 * result.severity)), depth: Number((result.peakDepth * Math.min(1,minute/20) * (minute > 40 ? Math.max(.65,1-(minute-40)*.012) : 1)).toFixed(1)), affected };
}
