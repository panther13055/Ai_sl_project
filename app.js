'use strict';
const A=HomeAgent,$=id=>document.getElementById(id);
let state=A.initialState(),timer=null;
const money=n=>'₹'+n.toFixed(2);
const coolingName=v=>v==='ac'?'AC':v==='fan'?'Fan':'Cooling off';

function stop(){
  if(timer)clearInterval(timer);
  timer=null;
  $('run').textContent='Run simulation';
  $('run').setAttribute('aria-pressed','false');
  $('hero-status-text').textContent='Monitoring sensors and evaluating plans.';
}

function buildRooms(){
  $('rooms').innerHTML=state.rooms.map((r,i)=>`<article class="room" id="room-${i}">
    <div class="room-top"><h3>${r.name}</h3><button class="occupancy" data-room="${i}" aria-label="Toggle occupancy of ${r.name}"></button></div>
    <div class="room-temp" id="temp-display-${i}"></div>
    <label for="temp-${i}">Temperature <span>°C</span></label>
    <input id="temp-${i}" data-index="${i}" data-field="temp" type="range" min="15" max="40" step="0.5">
    <label for="lux-${i}">Daylight <span id="lux-display-${i}"></span></label>
    <input id="lux-${i}" data-index="${i}" data-field="lux" type="range" min="0" max="1000" step="10">
    <div class="appliances" id="devices-${i}"></div>
    <div class="room-watts" id="watts-${i}"></div>
  </article>`).join('');
  document.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>{
    const r=state.rooms[+b.dataset.room];r.occupied=!r.occupied;render();
  }));
  document.querySelectorAll('[data-field]').forEach(el=>el.addEventListener('input',()=>{
    state.rooms[+el.dataset.index][el.dataset.field]=+el.value;render();
  }));
}


function comfortBaseline(){
  let watts=A.WATTS.essential;
  state.rooms.forEach(r=>{
    if(!r.occupied)return;
    const cooling=r.temp>state.target+0.5?'ac':'off';
    watts+=A.WATTS[cooling]+(r.lux<300?A.WATTS.light:0);
  });
  return watts;
}
function actionText(actions){
  return actions.map((a,i)=>state.rooms[i].name+': '+(state.rooms[i].occupied?(coolingName(a.cooling)+(a.light?' + Light':'')):'Vacant')).join(' · ');
}
function simClock(minutes){
  const total=18*60+minutes;
  return String(Math.floor(total/60)%24).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
}
function renderAgentOps(p){
  const baseline=comfortBaseline();
  const reduction=baseline?((baseline-p.watts)/baseline*100):0;
  const comfort=Math.max(0,Math.min(100,100-p.discomfort*4));
  const rejected=p.totalCount-p.feasibleCount;
  $('ops-plans').textContent=p.totalCount;
  $('ops-budget').textContent=p.feasible?'PASS':'LIMIT';
  $('ops-budget-note').textContent=p.feasible?money(p.rate)+'/h ≤ '+money(state.budget)+'/h':'No feasible controllable plan';
  $('ops-comfort').textContent=Math.round(comfort)+'/100';
  $('ops-saving').textContent=(reduction>=0?'↓ ':'↑ ')+Math.abs(reduction).toFixed(1)+'%';
  $('ops-utility').textContent=p.score.toFixed(1);
  $('ops-cycle').textContent='Cycle '+state.history.length;
  $('pipe-sense').textContent=state.rooms.filter(r=>r.occupied).length+' occupied · '+state.rooms.length+' rooms';
  $('pipe-generate').textContent=p.totalCount+' candidate plans';
  $('pipe-budget').textContent=rejected+' rejected · '+p.feasibleCount+' affordable';
  $('pipe-action').textContent=p.actions.map(a=>coolingName(a.cooling)+(a.light?'+Light':'')).join(' / ');
  $('baseline-watts').textContent=baseline.toLocaleString()+' W';
  $('agent-watts').textContent=p.watts.toLocaleString()+' W';
  const scale=Math.max(1,baseline,p.watts);
  $('baseline-bar').style.width=Math.max(4,baseline/scale*100)+'%';
  $('agent-bar').style.width=Math.max(4,p.watts/scale*100)+'%';

  const now=simClock(state.minutes);
  const log=[
    ['SENSE','Sensor snapshot captured',state.rooms.filter(r=>r.occupied).length+' occupied rooms · outdoor '+state.outdoor+'°C'],
    ['PLAN',p.totalCount+' candidate plans generated','Light, fan and AC combinations evaluated'],
    ['FILTER',rejected+' plans rejected by spending limit',p.feasibleCount+' remain affordable at '+money(state.budget)+'/h'],
    ['DECIDE','Highest-utility affordable plan selected',actionText(p.actions)],
    ['ACT',state.history.length?'Latest 5-minute step recorded':'Ready to apply selected plan',state.history.length?state.energy.toFixed(3)+' kWh · '+money(state.cost)+' session cost':'Press +5 min or Run simulation']
  ];
  $('activity-log').innerHTML=log.map((x,i)=>`<div class="log-row"><time>${now}</time><span class="log-tag tag-${x[0].toLowerCase()}">${x[0]}</span><div><b>${x[1]}</b><small>${x[2]}</small></div></div>`).join('');

  const hist=state.history.slice(-5).reverse();
  $('ops-history').innerHTML=hist.length?hist.map(h=>{
    const acts=h.actions.map((a,i)=>state.rooms[i].name+': '+coolingName(a.cooling)+(a.light?'+Light':'')).join(' · ');
    return `<tr><td>${simClock(h.minutes)}</td><td><span class="table-pill">${h.mode}</span></td><td>${acts}</td><td>${h.watts.toLocaleString()} W</td><td>${money(h.cost)}</td><td><span class="status-clean">Selected</span></td></tr>`;
  }).join(''):`<tr class="empty-row"><td colspan="6">No completed steps yet. The current plan is ready; run the simulation to build decision history.</td></tr>`;
}

function render(){
  try{
    const p=A.evaluate(state);
    renderAgentOps(p);
    $('power').innerHTML=`${p.watts.toLocaleString()} <em>W</em>`;
    $('rate').innerHTML=`${money(p.rate)} <em>/ h</em>`;
    $('energy').innerHTML=`${state.energy.toFixed(3)} <em>kWh</em>`;
    $('cost').textContent=money(state.cost);
    $('energy-time').textContent=state.minutes+' minutes simulated';
    const min=18*60+state.minutes;
    $('sim-time').textContent=String(Math.floor(min/60)%24).padStart(2,'0')+':'+String(min%60).padStart(2,'0')+(min>=1440?' +'+Math.floor(min/1440)+'d':'');
    for(const k of ['budget','target','outdoor','tariff'])$(k).value=state[k];
    $('budget-label').textContent=money(state.budget)+' / h';
    $('target-label').textContent=state.target+'°C';
    $('outdoor-label').textContent=state.outdoor+'°C';
    $('tariff-label').textContent=money(state.tariff)+' / kWh';

    document.querySelectorAll('[data-mode]').forEach(b=>{
      const selected=b.dataset.mode===state.mode;
      b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);
    });

    state.rooms.forEach((r,i)=>{
      const a=p.actions[i];
      $('room-'+i).classList.toggle('vacant',!r.occupied);
      const b=document.querySelector(`[data-room="${i}"]`);
      b.textContent=r.occupied?'Occupied':'Vacant';b.setAttribute('aria-pressed',r.occupied);
      $('temp-display-'+i).innerHTML=r.temp.toFixed(1)+'<span> °C</span>';
      $('lux-display-'+i).textContent=r.lux+' lux';
      $('temp-'+i).value=r.temp;$('lux-'+i).value=r.lux;
      $('devices-'+i).innerHTML=[
        ['Light',a.light?'ON':'OFF'],
        ['Fan',a.cooling==='fan'?'ON':'OFF'],
        ['Air conditioner',a.cooling==='ac'?'ON':'OFF']
      ].map(([name,value])=>`<div><span>${name}</span><b class="${value==='OFF'?'off':''}">${value}</b></div>`).join('');
      $('watts-'+i).textContent=(A.WATTS[a.cooling]+(a.light?A.WATTS.light:0))+' W controllable load';
    });

    $('decision-summary').innerHTML=p.actions.map((a,i)=>`<div class="plan-row"><b>${state.rooms[i].name}</b><span>${state.rooms[i].occupied ? coolingName(a.cooling)+(a.light?' + Light':'') : 'Vacant · All off'}</span></div>`).join('');
    $('decision-caption').textContent=`${state.mode[0].toUpperCase()+state.mode.slice(1)} mode selected · ${money(p.rate)}/h · utility score ${p.score.toFixed(1)}.`;
    $('alert').hidden=!p.warnings.length;$('alert').textContent=p.warnings.join(' ');
    $('candidate-count').textContent=p.feasibleCount+' / '+p.totalCount+' plans affordable';
    $('reasons').innerHTML=p.reasons.map((r,i)=>`<div class="reason-item"><b>${state.rooms[i].name}</b><p>${r}</p></div>`).join('');

    const ranked=p.candidates.filter(c=>c.feasible).slice(0,3);
    $('rankings').innerHTML=ranked.length?ranked.map((c,i)=>`<div class="rank-row"><span>#${i+1} · ${c.actions.map(a=>coolingName(a.cooling)+(a.light?'+Light':'')).join(' / ')}</span><strong>Score ${c.score.toFixed(1)} · ${money(c.rate)}/h</strong></div>`).join(''):'<p class="field-note">No controllable plan meets this spending limit.</p>';

    const hist=state.history.slice(-24),max=Math.max(1000,...hist.map(h=>h.watts));
    $('chart').innerHTML=hist.length?hist.map(h=>`<div class="bar" style="height:${Math.max(3,h.watts/max*100)}%" title="Minute ${h.minutes}: ${h.watts} W" role="img" aria-label="Minute ${h.minutes}: ${h.watts} watts"></div>`).join(''):'<div class="chart-empty">Run the simulation or click +5 min to record energy use.</div>';
    $('chart-caption').textContent=hist.length?`Peak in view: ${Math.max(...hist.map(h=>h.watts)).toLocaleString()} W · ${state.history.length} steps recorded`:'No measurements yet.';
    $('export').disabled=!state.history.length;
  }catch(err){
    stop();
    $('alert').hidden=false;
    $('alert').textContent='Simulation paused: '+err.message;
  }
}

function tick(){state=A.step(state);render();}
for(const k of ['budget','target','outdoor','tariff'])$(k).addEventListener('input',e=>{state[k]=+e.target.value;render();});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;render();}));
$('step').addEventListener('click',tick);
$('run').addEventListener('click',()=>{
  if(timer)stop();
  else{
    timer=setInterval(tick,1500);
    $('run').textContent='Pause simulation';
    $('run').setAttribute('aria-pressed','true');
    $('hero-status-text').textContent='Agent is applying a new plan every 5 simulated minutes.';
  }
});
$('reset').addEventListener('click',()=>{
  stop();state=A.initialState();$('scenario').value='evening';$('export-status').textContent='';buildRooms();render();
});
$('scenario').addEventListener('change',e=>{
  stop();state=A.scenario(e.target.value);$('export-status').textContent='';buildRooms();render();
});
$('export').addEventListener('click',()=>{
  const header='minutes,power_w,interval_kwh,interval_cost_inr,total_kwh,total_cost_inr,mode,tariff_inr_per_kwh,limit_inr_per_hour,living_cooling,living_light,bedroom_cooling,bedroom_light,study_cooling,study_light';
  const rows=state.history.map(h=>[h.minutes,h.watts,h.kwh.toFixed(6),h.cost.toFixed(6),h.totalEnergy.toFixed(6),h.totalCost.toFixed(6),h.mode,h.tariff,h.budget,...h.actions.flatMap(a=>[a.cooling,a.light?'on':'off'])].join(','));
  const url=URL.createObjectURL(new Blob([header+'\n'+rows.join('\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='HomePulse-session.csv';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);$('export-status').textContent='Session CSV downloaded.';
});
document.querySelectorAll('.side-nav a').forEach(a=>a.addEventListener('click',()=>{
  document.querySelectorAll('.side-nav a').forEach(x=>x.classList.remove('active'));a.classList.add('active');
}));
buildRooms();render();