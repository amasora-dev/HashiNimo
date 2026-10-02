const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let now=0,next=1;const scheduled=new Map(),intervals=new Map();
class Element{constructor(){this.listeners={};this.style={};this.dataset={};this.children=[];this.classList={add:()=>{},remove:()=>{}};this.textContent='';}addEventListener(t,f){(this.listeners[t]||=[]).push(f);}fire(t,e={}){for(const f of this.listeners[t]||[])f(e);}set innerHTML(v){this.html=v;this.firstElementChild=new Element();}get innerHTML(){return this.html;}append(e){this.children.push(e);e.remove=()=>this.children.splice(this.children.indexOf(e),1);}replaceChildren(){this.children=[];}get firstElementChild(){return this.first||this.children[0];}set firstElementChild(v){this.first=v;}setPointerCapture(){}}
const elements={};const doc=new Element();doc.getElementById=id=>elements[id]||=new Element();doc.createElement=()=>new Element();const win=new Element();
const context={document:doc,window:win,navigator:{},performance:{now:()=>now},Math:Object.create(Math),setTimeout:(fn,ms)=>{let id=next++;scheduled.set(id,{fn,time:now+ms});return id;},clearTimeout:id=>scheduled.delete(id),setInterval:fn=>{let id=next++;intervals.set(id,fn);return id;},clearInterval:id=>intervals.delete(id),requestAnimationFrame:()=>next++,cancelAnimationFrame:()=>{}};
context.Math.random=()=>.5;vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8'),context);
const api=win.HashiDiagnostics;const el=id=>doc.getElementById(id);function tick(ms){const end=now+ms;while(true){const item=[...scheduled].sort((a,b)=>a[1].time-b[1].time)[0];if(!item||item[1].time>end)break;now=item[1].time;scheduled.delete(item[0]);item[1].fn();}now=end;}
const evt={pointerId:1,button:0,isPrimary:true,preventDefault(){}};function hold(ms){el('press').fire('pointerdown',evt);now+=ms;win.fire('pointerup',evt);}
el('start').fire('click');assert.equal(api.state,'ready');hold(0);win.fire('pointerup',evt);assert.equal(api.state,'breaking');tick(1200);assert.equal(api.failures,1);assert.equal(el('pile').children.length,1);
for(let i=0;i<19;i++){hold(0);tick(1200);}assert.equal(api.failures,20);assert.equal(el('pile').children.length,20);assert.ok(api.radius(20)>api.radius(0));assert.equal(el('staff').dataset.presence,'near');
el('press').fire('pointerdown',evt);el('press').fire('pointercancel');assert.equal(api.state,'ready');assert.equal(api.failures,20);
hold(725);assert.equal(api.state,'success');tick(2800);assert.equal(el('staff').dataset.presence,'near');tick(1300);assert.equal(api.state,'result');assert.equal(el('total').textContent,20);
el('again').fire('click');assert.equal(api.failures,0);assert.equal(el('pile').children.length,0);assert.equal(el('staff').dataset.gaze,'normal');assert.equal(api.state,'ready');hold(725);tick(4100);assert.equal(api.state,'result');assert.equal(api.failures,0);
for(let n=0;n<1000;n++)assert.ok(api.guilt(n)>=0&&api.guilt(n)<=100);for(let t=0;t<6;t++)assert.ok(api.wood(t).includes('<path'));
el('again').fire('click');for(let i=0;i<80;i++){hold(0);tick(1200);}assert.equal(api.failures,80);assert.equal(el('pile').children.length,60);
console.log('PASS: success/failure, duplicate release, 80 failures, six shapes, gaze, assistance, cancellation, ending, guilt, replay, missing audio/vibration.');

el('again').fire('click');for(let i=0;i<2;i++){hold(0);tick(1200);}assert.equal(api.failures,2);assert.equal(el('staff').dataset.presence,'absent');
hold(0);tick(1200);assert.equal(api.failures,3);assert.equal(el('staff').dataset.presence,'approaching');assert.equal(el('staff').dataset.gaze,'player');
tick(3200);assert.equal(el('staff').dataset.presence,'far');for(let i=3;i<10;i++){hold(0);tick(1200);}assert.equal(el('staff').dataset.presence,'far');hold(0);tick(1200);assert.equal(api.failures,11);assert.equal(el('staff').dataset.presence,'advancing');tick(2400);assert.equal(el('staff').dataset.presence,'near');
hold(725);tick(4100);assert.equal(el('staff').dataset.gaze,'player');assert.equal(el('staff').dataset.presence,'near');
el('again').fire('click');assert.equal(el('staff').dataset.presence,'absent');assert.equal(api.failures,0);
for(let i=0;i<3;i++){hold(0);tick(1200);}assert.equal(el('staff').dataset.presence,'approaching');el('again').fire('click');tick(4000);assert.equal(el('staff').dataset.presence,'absent');
console.log('PASS: hidden until 2, approach at 3, sustained neutral gaze, ending gaze, replay cancels arrival.');

assert.equal(api.radius(0),5);assert.equal(api.radius(4),5);assert.ok(api.radius(5)>5);assert.ok(api.radius(8)<8+6*2.5);console.log('PASS: far through 10, advance at 11, narrower success window with gradual assistance.');

for(const roll of [.05,.95]){
 context.Math.random=()=>roll;
 el('again').fire('click');
 const target=api.center;
 assert.ok(roll<.5?target<25:target>75);
 hold(725);assert.equal(api.state,'breaking');tick(1200);
 const samePair=api.center;
 el('press').fire('pointerdown',evt);context.Math.random=()=>.5;el('press').fire('pointercancel');assert.equal(api.center,samePair);
 hold(samePair*14.5);assert.equal(api.state,'success');tick(4100);
}
assert.notEqual(api.wood(-1,true,50,0),api.wood(-1,true,50,1));
console.log('PASS: success positions across gauge, center fails at low/high targets, exact target succeeds, cancellation preserves pair, flex cue changes shape.');
