(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const names = ['ねじれすぎ。','枝、増えた。','そこだけ細い。','稲妻ですか。','片方だけ大忙し。','途中で引き返した。'];
 const shapes = [
 ['M40 8 C80 24 12 40 58 57 S16 88 58 110 S28 142 40 157','M55 8 C95 28 27 43 73 60 S31 91 73 114 S43 145 55 157'],
 ['M45 8 L45 157 M45 70 L16 123 M45 95 L73 145 M45 43 L72 90','M58 8 L62 157 M61 75 L94 130 M60 52 L84 98'],
 ['M43 8 L47 65 L50 105 L42 157','M58 8 L64 63 L52 95 L66 157'],
 ['M43 8 L60 38 L32 69 L61 98 L33 128 L43 157','M57 8 L74 38 L46 69 L75 98 L47 128 L57 157'],
 ['M40 8 L40 157','M58 8 L63 157 M61 50 L86 83 M62 75 L92 114 M63 105 L86 147'],
 ['M42 8 L43 95 L26 73 L25 136 L42 157','M57 8 L58 93 L77 67 L78 130 L58 157']
 ];
 function wood(type=-1, held=false, power=0, flex=0) {
   const paths = type === -1 ? [`M43 8 Q${43-flex*7} 82 43 157`,`M57 8 Q${57+flex*7} 82 57 157`] : type < 0 ? ['M43 8 L43 157','M57 8 L57 157'] : shapes[type];
   const spread = type === -2 ? 18 : held ? power * .075 : 0;
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${held?'0 0 230 240':'0 0 100 165'}"><g transform="${held?'translate(50 14) scale(1.3)':''}">${paths.map((p,i)=>`<path d="${p}" transform="translate(${i?spread:-spread} 0)" fill="none" stroke="#9f7044" stroke-width="${type===2&&i===0?5:9}" stroke-linecap="round" stroke-linejoin="round"/><path d="${p}" transform="translate(${i?spread:-spread} 0)" fill="none" stroke="#efd29b" stroke-width="${type===2&&i===0?2:5}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</g></svg>`;
 }
 let state='title', failures=0, power=0, center=50, pointer=null, started=0, frame=0, timers=[], muted=false, audio=null, creak=null, gazeTimer=null, staffArrived=false;
 const later = (fn, ms) => { const id=setTimeout(fn,ms); timers.push(id); return id; };
 const guilt = n => Math.min(100, Math.round(100*(1-Math.exp(-Math.pow(n/8,2)))));
 const radius = n => Math.min(48, 5 + Math.max(0,n-4)*1.8);
 function choose(){center=18+Math.random()*64;}
 function initAudio(){try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch{}}
 function noise(kind){if(muted||!audio)return;try{const duration=kind==='hold'?.07:kind==='success'?.13:.22;const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,kind==='success'?4:2);const source=audio.createBufferSource(),gain=audio.createGain(),filter=audio.createBiquadFilter();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=kind==='success'?2400:kind==='hold'?450:950;gain.gain.value=kind==='hold'?.035:.28;source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();}catch{}}
 function stopHold(){clearInterval(creak);creak=null;cancelAnimationFrame(frame);pointer=null;}
 function gaze(mode){$('staff').dataset.gaze=mode;}
 const STAFF_ARRIVAL_COUNT = 3;
 function staffUpdate(){
   clearInterval(gazeTimer);
   $('staffNote').textContent='';
   if(failures < STAFF_ARRIVAL_COUNT){$('staff').dataset.presence='absent';gaze('normal');return;}
   gaze('player');
   if(staffArrived){
     if(failures>10 && $('staff').dataset.presence!=='near' && $('staff').dataset.presence!=='advancing'){
       $('staff').dataset.presence='advancing';
       later(()=>{if($('staff').dataset.presence==='advancing')$('staff').dataset.presence='near';},2400);
     }
     return;
   }
   staffArrived=true;
   $('staff').dataset.presence='approaching';
   later(()=>{if($('staff').dataset.presence==='approaching')$('staff').dataset.presence='far';},3200);
 }

 function reset(){stopHold();timers.forEach(clearTimeout);timers=[];clearInterval(gazeTimer);failures=0;staffArrived=false;$('staff').dataset.presence='absent';power=0;state='ready';$('pile').replaceChildren();$('sparkles').replaceChildren();$('scene').classList.remove('focus-pile');$('result').classList.add('hidden');$('title').classList.add('hidden');$('count').textContent='0';$('guide').textContent='長押し → 離す';$('callout').textContent='';$('staffNote').textContent='';gaze('normal');fresh();}
 function fresh(newPair=true){state='ready';if(newPair)choose();power=0;$('fill').style.width='0%';$('held').innerHTML=wood(-1,true);$('held').style.marginLeft='0px';$('press').disabled=false;$('press').textContent='長押しして、割る';}
 function animate(now){if(state!=='holding')return;const phase=((now-started)/1450)%2;power=(phase<1?phase:2-phase)*100;$('fill').style.width=power+'%';$('held').innerHTML=wood(-1,true,power,Math.exp(-Math.pow((power-center)/7,2)));$('held').style.marginLeft=(power>70?Math.sin(now*.07)*(power-70)/15:0)+'px';frame=requestAnimationFrame(animate);}
 function down(e){if(state!=='ready'||pointer!==null||e.isPrimary===false||e.button>0)return;e.preventDefault();initAudio();state='holding';pointer=e.pointerId;started=performance.now();try{$('press').setPointerCapture(pointer);}catch{}$('press').textContent='離して、割る';if(failures===0)$('guide').textContent='離す';noise('hold');creak=setInterval(()=>noise('hold'),180);frame=requestAnimationFrame(animate);}
 function release(e){if(state!=='holding'||(e&&e.pointerId!==pointer))return;if(e)e.preventDefault();const elapsed=performance.now()-started,phase=(elapsed/1450)%2;power=(phase<1?phase:2-phase)*100;stopHold();state='breaking';$('press').disabled=true;$('held').style.marginLeft='0px';try{navigator.vibrate?.(25);}catch{}if(Math.abs(power-center)<=radius(failures))success();else fail();}
 function cancel(){if(state!=='holding')return;stopHold();fresh(false);if(failures===0)$('guide').textContent='長押し → 離す';}
 function fail(){const type=Math.floor(Math.random()*6);noise('fail');$('held').innerHTML=wood(type,true);$('callout').textContent=names[type];$('press').textContent='……新しい箸を。';later(()=>{failures++;$('count').textContent=failures;$('guide').textContent='';addPile(type);staffUpdate();$('callout').textContent='';fresh();},1200);}
 function addPile(type){const holder=document.createElement('div');holder.innerHTML=wood(type);const svg=holder.firstElementChild;const index=failures-1;svg.style.left=(index%2===0?-5:53)+(Math.sin(index*2.4)*8)+'%';svg.style.top=Math.max(-8,66-Math.floor(index/2)*4)+'%';svg.style.transform=`rotate(${(index%2===0?-22:20)+Math.sin(index)*19}deg)`;svg.dataset.type=type;$('pile').append(svg);if($('pile').children.length>60)$('pile').firstElementChild.remove();}
 function success(){state='success';clearInterval(gazeTimer);noise('success');$('held').innerHTML=wood(-2,true);$('callout').textContent='きれいに割れた！';$('press').textContent='いただきま……';for(let i=0;i<16;i++){const s=document.createElement('span');s.className='spark';s.textContent='✦';s.style.left=(12+Math.random()*76)+'%';s.style.top=(38+Math.random()*42)+'%';s.style.animationDelay=(Math.random()*.35)+'s';$('sparkles').append(s);}later(()=>{$('sparkles').replaceChildren();$('callout').textContent=failures?'……この山。':'……あ。';$('scene').classList.add('focus-pile');if(!staffArrived)gaze('pile');},1500);later(()=>{if(staffArrived){gaze('player');$('staffNote').textContent='……';}$('callout').textContent='';},2800);later(()=>{$('total').textContent=failures;$('guilt').textContent=guilt(failures);$('comment').textContent=failures<=2?'まあ、これはある。':failures<=5?'ちょっと使いすぎた。':failures<=8?'割り箸の山を見ないようにしている。':failures<=12?'店員さんと目を合わせられない。':'割り箸代、払ったほうがいいですか？';state='result';$('result').classList.remove('hidden');},4100);}
 $('start').addEventListener('click',()=>{initAudio();reset();});$('title').addEventListener('click',e=>{if(e.target.closest('#start'))return;initAudio();reset();});$('again').addEventListener('click',reset);$('press').addEventListener('pointerdown',down);window.addEventListener('pointerup',release);$('press').addEventListener('pointercancel',cancel);$('press').addEventListener('lostpointercapture',cancel);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});$('press').addEventListener('contextmenu',e=>e.preventDefault());$('press').addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&!e.repeat)down({preventDefault:()=>e.preventDefault(),pointerId:-1,isPrimary:true,button:0});});$('press').addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter')release({preventDefault:()=>e.preventDefault(),pointerId:-1});});$('sound').addEventListener('click',()=>{muted=!muted;$('sound').textContent=muted?'音 OFF':'音 ON';});$('held').innerHTML=wood(-1,true);$('staff').dataset.presence='absent';
 // Read-only diagnostics for local verification; no gameplay controls are exposed.
 window.HashiDiagnostics={guilt,radius,wood,get state(){return state;},get failures(){return failures;},get power(){return power;},get center(){return center;}};
})();
