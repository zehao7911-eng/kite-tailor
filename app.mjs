import {BeaconHost} from './sdk.mjs';
const game='kite-tailor', key=game+'-v1';
const designs=[
  ['Apricot Dawn', ['#e7a353','#cf6961','#7da48c','#f2cf88'], [195,105,292,208,195,323,98,208]],
  ['Bluebell', ['#709dc3','#c4a9d5','#535e9a','#e9bd87'], [188,100,304,200,201,325,91,221]],
  ['Meadow Finch', ['#edc76e','#db826a','#638d72','#aec596'], [195,125,315,191,195,335,75,191]],
  ['Berry Moon', ['#bd7288','#764d79','#e8aa99','#86b7ae'], [195,96,271,217,195,338,119,217]],
  ['Sea Glass', ['#64a9a5','#eec27c','#416f92','#a6c9be'], [176,105,307,212,219,323,85,209]],
  ['Festival Silk', ['#ed9865','#cc5c60','#566f99','#e8ca75'], [195,93,312,227,195,338,78,227]]
];
const el=id=>document.getElementById(id);
const validLevel=n=>Number.isInteger(n)&&n>=0&&n<designs.length;
const bounded=(n,max)=>Number.isInteger(n)?Math.max(0,Math.min(max,n)):0;
function clean(value){
  const profile={stars:designs.map((_,i)=>bounded(value?.profile?.stars?.[i],3)),gold:value?.profile?.gold===true,confetti:value?.profile?.confetti===true};
  const first=profile.stars.indexOf(0);
  const level=validLevel(value?.run?.level)&&value.run.level<=(first<0?5:first)?value.run.level:0;
  const fitted=Array.from({length:4},(_,i)=>value?.run?.fitted?.[i]===true);
  const hits=fitted.every(Boolean)?bounded(value?.run?.hits,3):0;
  return {profile,run:{level,fitted,hits,misses:bounded(value?.run?.misses,999),mistakes:bounded(value?.run?.mistakes,999)}};
}
let local;
try{local=JSON.parse(localStorage.getItem(key));}catch{}
let {profile,run}=clean(local);
let selected=null, flying=false, active=false, phaseTime=0, caughtCycle=-1, drag=null, sound=true, audio, support={};
const marks=['◈','✿','☼','✦'];
const order=[2,0,3,1];
const host=new BeaconHost(window,{
  status(value){support=value;rewardText();},
  reward(value){
    if(profile[value])return;
    profile[value]=true;save();render();
    announce(value==='gold'?'Gold embroidery unlocked':'Festival ribbons unlocked');
  },
  load(value){
    const remote=clean(value);
    profile.stars=profile.stars.map((n,i)=>Math.max(n,remote.profile.stars[i]));
    profile.gold ||= remote.profile.gold;
    profile.confetti ||= remote.profile.confetti;
    if(!local&&!active&&selected===null)run=remote.run;
    render();save();
  }
});
function save(){
  const value={game,v:1,profile,run};
  try{localStorage.setItem(key,JSON.stringify(value));}catch{}
  host.save(value);
}
function start(){
  if(active)return;
  active=true;host.start();
}
function rewardText(){
  const notes=[];
  if(support.gold)notes.push(profile.gold?'Gold embroidery earned':'Like in GameWave for gold embroidery');
  if(support.confetti)notes.push(profile.confetti?'Festival ribbons earned':'Comment in GameWave for festival ribbons');
  el('rewards').hidden=!notes.length;
  el('rewards').textContent=notes.join(' · ')+(notes.length?' · Once per saved profile.':'');
}
function announce(text){el('status').textContent=text;}
function chime(f){
  if(!sound)return;
  try{
    audio ||= new AudioContext();audio.resume().catch(()=>{});
    const oscillator=audio.createOscillator(), gain=audio.createGain(), t=audio.currentTime;
    oscillator.frequency.value=f;gain.gain.setValueAtTime(.085,t);
    gain.gain.exponentialRampToValueAtTime(.001,t+.24);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(t+.25);
  }catch{}
}
function scenery(){
  let detail='';
  for(let i=0;i<45;i++){
    const x=(i*79+13)%390,y=355+(i*19)%74,h=4+i%9;
    detail+='<path d="M'+x+' '+y+'q-2 -'+h+' -5 -'+(h+2)+'m5 '+(h+2)+'q2 -'+h+' 6 -'+(h+1)+'" fill="none" stroke="#bdd09a" stroke-opacity=".55"/>';
    if(i%3===0)detail+='<circle cx="'+(x-5)+'" cy="'+(y-h-2)+'" r="2" fill="'+(i%2?'#ffe2a1':'#efac93')+'"/>';
  }
  for(const [x,y] of [[24,322],[46,319],[347,318],[370,328]]){
    detail+='<path d="M'+x+' '+y+'v-16" stroke="#674f43" stroke-width="3"/><path d="M'+(x-11)+' '+(y-9)+'l11 -27 11 27z" fill="#50796e"/><path d="M'+(x-8)+' '+(y-19)+'l8 -22 8 22z" fill="#6d9380"/>';
  }
  el('scenery').innerHTML=detail;
}
function kite(){
  const [,colors,points]=designs[run.level];
  const corners=Array.from({length:4},(_,i)=>points.slice(i*2,i*2+2));
  const middle=[195,211];
  const color=profile.gold?'#ffe7a0':'#f9e7bf';
  let art='';
  for(let i=0;i<4;i++){
    const a=corners[i],b=corners[(i+1)%4];
    const path='M'+a.join(' ')+'L'+b.join(' ')+'L'+middle.join(' ')+'Z';
    const x=(a[0]+b[0]+middle[0])/3,y=(a[1]+b[1]+middle[1])/3;
    const fill=run.fitted[i]?colors[i]:'#3d6567';
    art+='<g data-slot="'+i+'"><path d="'+path+'" fill="'+fill+'" stroke="'+color+'" stroke-width="1.6"/>';
    if(run.fitted[i])art+='<path d="'+path+'" fill="url(#weave)"/><circle cx="'+x+'" cy="'+y+'" r="17" fill="none" stroke="'+color+'" stroke-dasharray="2 3"/>';
    art+='<text x="'+x+'" y="'+(y+6)+'" text-anchor="middle" fill="'+color+'" font-size="21">'+marks[i]+'</text></g>';
  }
  if(run.fitted.every(Boolean)){
    art+='<path d="M'+corners[0].join(' ')+'L'+corners[2].join(' ')+'M'+corners[1].join(' ')+'Q195 189 '+corners[3].join(' ')+'" fill="none" stroke="#4d473f" stroke-opacity=".4" stroke-width="2" pointer-events="none"/>';
    art+='<path d="M'+corners[2].join(' ')+'q35 19 14 35t15 38" fill="none" stroke="#f5db9b" stroke-width="2"/>';
    for(let i=0;i<3;i++)art+='<path d="M'+(210+i*4)+' '+(343+i*13)+'l-12 -5 1 10z m0 0l12 -5 -1 10z" fill="'+colors[i]+'"/>';
  }
  if(run.hits===3&&profile.confetti){
    for(let i=0;i<14;i++)art+='<path d="M'+(67+i*19)+' '+(78+(i*43)%242)+'l7 -5" stroke="'+colors[i%4]+'" stroke-width="4"/>';
  }
  el('kite').innerHTML=art;
}
function render(){
  const [name,colors]=designs[run.level];
  const sewn=run.fitted.every(Boolean), done=run.hits===3;
  el('chapter').textContent='PATTERN '+String(run.level+1).padStart(2,'0')+' / 06';
  el('name').textContent=name;
  el('board').style.display=flying||done?'none':'';
  el('kite').removeAttribute('transform');
  kite();
  el('tray').hidden=sewn;
  el('launch').hidden=!sewn||flying||done;
  el('launch').textContent=run.hits?'Continue flight ↑':'Release the kite ↑';
  el('flight').hidden=!flying||done;
  el('result').hidden=!done;
  el('next').hidden=run.level===5;
  const score=1+Number(run.mistakes===0)+Number(run.misses===0);
  if(done){
    el('stars').textContent='★'.repeat(score)+'☆'.repeat(3-score);
    el('rating').textContent='Three gusts caught · '+run.misses+' missed';
  }
  el('tray').replaceChildren(...order.map(i=>{
    const button=document.createElement('button');
    button.className='piece';button.disabled=run.fitted[i];
    button.setAttribute('aria-label','Fabric '+marks[i]);
    button.setAttribute('aria-pressed',String(selected===i));
    button.innerHTML='<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M4 32L25 5L44 35Z" fill="'+colors[i]+'" stroke="#ffddaa" stroke-dasharray="2 2"/><text x="25" y="29" text-anchor="middle" fill="#fff2cf">'+marks[i]+'</text></svg>'+marks[i];
    button.onclick=()=>{selected=i;render();announce('Tap the matching stitched symbol');};
    button.onpointerdown=e=>{
      if(drag||button.disabled)return;
      drag={id:e.pointerId,i,x:e.clientX,y:e.clientY,ghost:null};
      button.setPointerCapture(e.pointerId);
    };
    button.onpointermove=e=>{
      if(drag?.id!==e.pointerId)return;
      if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7){
        drag.ghost=button.querySelector('svg').cloneNode(true);
        drag.ghost.classList.add('ghost');document.body.append(drag.ghost);
      }
      if(drag.ghost){drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';}
    };
    button.onpointerup=e=>{
      if(drag?.id!==e.pointerId)return;
      const moved=!!drag.ghost;drag.ghost?.remove();drag=null;
      if(!moved)return;
      const slot=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');
      if(slot)fit(i,Number(slot.dataset.slot));
      else announce('Drop fabric onto its stitched outline');
    };
    button.onpointercancel=()=>{drag?.ghost?.remove();drag=null;};
    return button;
  }));
  const first=profile.stars.indexOf(0);
  el('patterns').replaceChildren(...designs.map(([label],i)=>{
    const button=document.createElement('button');
    button.textContent=String(i+1).padStart(2,'0')+(profile.stars[i]?' ★':'');
    button.disabled=first>=0&&i>first;
    button.classList.toggle('current',i===run.level);
    button.setAttribute('aria-label',label);
    button.onclick=()=>select(i);
    return button;
  }));
  rewardText();
}
function fit(i,slot){
  if(run.fitted[slot]||run.fitted[i])return;
  if(i!==slot){run.mistakes++;save();announce('Try the panel with the same symbol');return;}
  start();run.fitted[i]=true;selected=null;chime(420+80*i);save();render();
  announce(run.fitted.every(Boolean)?'All four panels stitched. Ready to fly!':'Panel stitched · '+run.fitted.filter(Boolean).length+' / 4');
}
function select(level){
  host.end();active=false;flying=false;selected=null;
  run={level,fitted:[false,false,false,false],hits:0,misses:0,mistakes:0};
  render();save();announce('Drag a fabric panel to its matching symbol');
}
el('art').onclick=e=>{
  const target=e.target.closest('[data-slot]');
  if(!flying&&selected!==null&&target)fit(selected,Number(target.dataset.slot));
};
el('launch').onclick=()=>{
  if(!run.fitted.every(Boolean)||run.hits===3)return;
  start();flying=true;phaseTime=performance.now();caughtCycle=-1;render();chime(510);
  announce('Tap when the needle reaches the green zone');
};
const windPhase=now=>(now-phaseTime)*(.0022+run.level*.00018);
function meter(now){return .5-.5*Math.cos(windPhase(now));}
const half=()=>.18-run.level*.013;
el('tug').onclick=()=>{
  if(!flying||run.hits===3)return;
  const now=performance.now(),cycle=Math.floor(windPhase(now)/(2*Math.PI));
  if(cycle===caughtCycle){announce('Wait for the next gust');return;}
  if(Math.abs(meter(now)-.67)>half()){
    run.misses++;save();chime(220);announce('Missed the gust. Try the next one.');return;
  }
  caughtCycle=cycle;run.hits++;chime(620+run.hits*110);
  if(run.hits===3){
    profile.stars[run.level]=Math.max(profile.stars[run.level],1+Number(run.mistakes===0)+Number(run.misses===0));
    flying=false;active=false;host.end();render();announce('Your kite has caught the wind');
  }else announce('Gust caught · '+run.hits+' / 3');
  save();
};
el('next').onclick=()=>select(run.level+1);
el('replay').onclick=()=>select(run.level);
el('sound').onclick=()=>{sound=!sound;el('sound').textContent=sound?'♪ Sound':'Sound off';el('sound').setAttribute('aria-pressed',String(sound));};
addEventListener('pagehide',()=>{save();host.stop();});
addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();if(flying){flying=false;render();announce('Ready to continue your flight');}}});
function frame(now){
  if(flying){
    el('meter').firstElementChild.style.cssText='left:'+((.67-half())*100)+'%;width:'+(half()*200)+'%';
    el('meter').lastElementChild.style.left=(meter(now)*100)+'%';
    const y=-run.hits*26-8*Math.sin(now/350);
    el('kite').setAttribute('transform','translate('+Math.sin(now/500)*12+' '+y+') rotate('+Math.sin(now/420)*5+' 195 211)');
  }
  requestAnimationFrame(frame);
}
scenery();render();announce(run.hits===3?'Your kite has caught the wind':run.fitted.every(Boolean)?'Ready to fly':'Drag a fabric panel to its matching symbol');
host.poll();requestAnimationFrame(frame);
