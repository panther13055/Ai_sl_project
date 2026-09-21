/* HomePulse: deterministic, explainable utility-based educational agent. */
(function (root) {
  'use strict';
  const WATTS = { off: 0, fan: 65, ac: 1200, light: 12, essential: 150 };
  const ENERGY_WEIGHT = { comfort: 0.5, balanced: 4, eco: 15 };
  const STEP_MINUTES = 5;
  function initialState() {
    return { mode: 'balanced', outdoor: 33, tariff: 8, budget: 22, target: 24,
      minutes: 0, energy: 0, cost: 0, history: [],
      rooms: [
        { name: 'Living room', occupied: true, temp: 29, lux: 120, last: 'off' },
        { name: 'Bedroom', occupied: true, temp: 27, lux: 70, last: 'off' },
        { name: 'Study', occupied: false, temp: 28, lux: 450, last: 'off' }
      ] };
  }
  function validate(s) {
    if (!Object.hasOwn(ENERGY_WEIGHT, s.mode)) throw new Error('Choose a valid agent mode.');
    for (const k of ['outdoor', 'tariff', 'budget', 'target']) if (!Number.isFinite(s[k])) throw new Error('All settings must be finite numbers.');
    if (s.tariff <= 0 || s.budget < 0 || s.target < 18 || s.target > 30 || s.outdoor < 10 || s.outdoor > 45) throw new Error('Settings are outside the supported range.');
    if (!Array.isArray(s.rooms) || s.rooms.length !== 3) throw new Error('Exactly three rooms are required.');
    s.rooms.forEach(r => { if (!Number.isFinite(r.temp) || !Number.isFinite(r.lux) || r.temp < 10 || r.temp > 45 || r.lux < 0 || r.lux > 1000 || typeof r.occupied !== 'boolean' || !['off','fan','ac'].includes(r.last)) throw new Error('Invalid room reading.'); });
  }
  function predict(room, cooling, s) {
    const actual = Math.max(10, Math.min(45, room.temp + 0.04 * (s.outdoor - room.temp) - (cooling === 'ac' ? 1.8 : 0)));
    return { actual, perceived: actual - (cooling === 'fan' ? 1.5 : 0) };
  }
  function roomOptions(r, s) {
    if (!r.occupied) return [{ cooling: 'off', light: false }];
    const cooling = r.temp > s.target + 0.5 ? ['off','fan','ac'] : ['off'];
    return cooling.flatMap(c => (r.lux < 300 ? [false,true] : [false]).map(light => ({ cooling: c, light })));
  }
  function evaluate(s) {
    validate(s);
    let combos = [[]];
    s.rooms.forEach(r => { combos = combos.flatMap(list => roomOptions(r,s).map(a => [...list,a])); });
    const candidates = combos.map(actions => {
      let watts = WATTS.essential, discomfort = 0, switches = 0;
      actions.forEach((a,i) => {
        const r = s.rooms[i]; watts += WATTS[a.cooling] + (a.light ? WATTS.light : 0);
        if (r.occupied) {
          const p = predict(r,a.cooling,s);
          discomfort += Math.pow(p.perceived-s.target,2) + (r.lux < 300 && !a.light ? 6 : 0);
        }
        if (r.last !== a.cooling) switches++;
      });
      const rate = watts/1000*s.tariff;
      const score = -8*discomfort - ENERGY_WEIGHT[s.mode]*(watts/1000) - 0.5*switches;
      return { actions, watts, rate, score, discomfort, feasible: rate <= s.budget + 1e-9 };
    }).sort((a,b) => b.score-a.score || a.watts-b.watts);
    const feasible = candidates.filter(c => c.feasible);
    const chosen = feasible[0] || candidates.reduce((a,b) => a.watts < b.watts ? a : b);
    const warnings = [];
    if (!feasible.length) warnings.push('Essential load alone exceeds the spending limit. Controllable appliances are off; the 150 W essential load stays on.');
    else if (chosen !== candidates[0]) warnings.push('The spending limit rules out a higher-comfort plan. The best affordable plan is selected.');
    const reasons = chosen.actions.map((a,i) => {
      const r=s.rooms[i];
      if (!r.occupied) return 'Room vacant: cooling and lighting are off.';
      const light = a.light ? 'Low daylight: light on.' : r.lux >= 300 ? 'Enough daylight: light off.' : 'Low daylight, but light is off under the selected plan.';
      const thermal = r.temp <= s.target+0.5 ? 'At or below the cooling threshold: cooling off.' : `${a.cooling === 'ac' ? 'AC' : a.cooling === 'fan' ? 'Fan' : 'Cooling off'} selected by the ${s.mode} utility score within the spending limit.`;
      return `${thermal} ${light}`;
    });
    return { ...chosen, reasons, warnings, candidates, feasibleCount: feasible.length, totalCount: candidates.length };
  }
  function step(s) {
    const plan=evaluate(s);
    const next=JSON.parse(JSON.stringify(s));
    next.rooms.forEach((r,i) => { r.temp=predict(s.rooms[i],plan.actions[i].cooling,s).actual; r.last=plan.actions[i].cooling; });
    const kwh=plan.watts/1000*STEP_MINUTES/60;
    next.minutes+=STEP_MINUTES; next.energy+=kwh; next.cost+=kwh*s.tariff;
    next.history.push({ minutes:next.minutes, watts:plan.watts, kwh, cost:kwh*s.tariff, totalEnergy:next.energy, totalCost:next.cost,
      mode:s.mode, tariff:s.tariff, budget:s.budget, actions:plan.actions.map(a=>({...a})), temperatures:next.rooms.map(r=>r.temp) });
    return next;
  }
  function scenario(name) {
    const s=initialState();
    if(name==='away') s.rooms.forEach(r=>r.occupied=false);
    if(name==='heat') {s.outdoor=40; s.budget=35;s.rooms.forEach((r,i)=>{r.occupied=true;r.temp=32+i;r.lux=500;});}
    if(name==='budget') {s.budget=2.5;s.rooms.forEach(r=>{r.occupied=true;r.temp=30;r.lux=100;});}
    if(name==='daylight') {s.outdoor=25;s.rooms.forEach(r=>{r.occupied=true;r.temp=24;r.lux=650;});}
    return s;
  }
  const api={ WATTS, ENERGY_WEIGHT, STEP_MINUTES, initialState, evaluate, step, predict, scenario };
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.HomeAgent=api;
})(typeof globalThis!=='undefined'?globalThis:this);
