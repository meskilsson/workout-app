const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../dist');
const base = 'http://127.0.0.1:8768';
const draftId = '0123456789abcdef01234567';
const userId = '0123456789abcdef01234568';
const exerciseId = '0123456789abcdef01234569';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = http.createServer((req,res) => {
  const pathname = new URL(req.url,base).pathname;
  let file = path.join(root,pathname);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root,'index.html');
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');
  res.end(fs.readFileSync(file));
});
let browser, ws;
(async()=> {
 await new Promise(resolve=>server.listen(8768,'127.0.0.1',resolve));
 browser=spawn(process.env.UI_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
 '--headless=new','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=9227',
 '--user-data-dir='+path.join(process.env.TEMP,'workout-mobile-check-'+Date.now()),'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
 browser.on('error',e=>console.error(e)); browser.stderr.on('data',d=>process.stderr.write(d));
 let tabs;
 for(let i=0;i<200;i++){try{tabs=await(await fetch('http://127.0.0.1:9227/json/list')).json();if(tabs.length)break;}catch{}await wait(100);}
 assert(tabs?.length,'Headless browser did not start');
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 let sequence=0;const pending=new Map();
 function send(method,params={}){const id=++sequence;return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},15000);pending.set(id,{resolve:v=>{clearTimeout(timeout);resolve(v)},reject:e=>{clearTimeout(timeout);reject(e)}});ws.send(JSON.stringify({id,method,params}));});}
 const exercise={_id:exerciseId,name:'Barbell bench press',exerciseType:'strength',equipment:'barbell',difficulty:'beginner',primaryMuscles:['chest'],secondaryMuscles:['triceps','shoulders'],isCustom:true,description:'A controlled compound movement for a balanced strength session.',instructions:'Keep control throughout the movement.'};
 const exercises=[exercise,{...exercise,_id:'0123456789abcdef01234570',name:'Seated cable row',equipment:'cable',primaryMuscles:['back'],secondaryMuscles:['biceps']},{...exercise,_id:'0123456789abcdef01234571',name:'Dumbbell overhead shoulder press',equipment:'dumbbell',primaryMuscles:['shoulders'],secondaryMuscles:['triceps']}];
 exercises.push({...exercise,_id:'0123456789abcdef01234572',name:'Assault Bike / Air Bike',exerciseType:'cardio',primaryMuscles:[]}, {...exercise,_id:'0123456789abcdef01234573',name:'Stationary Bike',exerciseType:'cardio',primaryMuscles:[]});
 const draft={_id:draftId,userId,status:'active',selectedMuscleGroups:['chest','back'],exercises:exercises.map((e,j)=>({exerciseId:e._id,exerciseName:e.name,sets:Array.from({length:3},(_,i)=>({id:`f8f6de5c-e305-4bba-b62b-a5375d3b79b${j*3+i}`,weight:j?25:40,reps:8+i}))}))};
 draft.exercises[3].sets=[];draft.exercises[3].training={format:'intervals',rounds:8,workSeconds:30,restSeconds:90};draft.exercises[4].sets=[];draft.exercises[4].training={format:'cardio',durationSeconds:60};
 exercises.push({...exercise,_id:'0123456789abcdef01234574',name:'Abdominal Crunch',primaryMuscles:['core'],secondaryMuscles:[]});
 let exerciseReads=0;
 const mutations=[];
 const templates=['Upper body essentials','Full body strength','Push day'].map((name,i)=>({_id:'0123456789abcdef0123458'+i,name,description:'A balanced strength session. Build consistency with focused, controlled sets.',category:'strength',isPublic:true,exercises:exercises.map((e,order)=>({_id:e._id,exerciseId:e._id,exerciseName:e.name,exercise:e,plannedSets:[{weight:40,reps:8},{weight:40,reps:8}],order}))}));
 let scenario='populated', guest=false, routePath='/', mutationDelay=0, draftReadDelay=0;
 const browserErrors=[];
 const sessions=[0,1].map(i=>({_id:'0123456789abcdef0123459'+i,userId,startedAt:'2026-10-0'+(5-i)+'T09:00:00Z',endedAt:'2026-10-0'+(5-i)+'T09:45:00Z',duration:2700,exercises:draft.exercises}));
 ws.addEventListener('message',async event=>{
  const packet=JSON.parse(event.data);if(packet.id){const job=pending.get(packet.id);if(job){pending.delete(packet.id);packet.error?job.reject(Error(JSON.stringify(packet.error))):job.resolve(packet.result);}return;}
  if(packet.method==='Runtime.exceptionThrown') browserErrors.push(packet.params.exceptionDetails);
  if(packet.method==='Fetch.requestPaused'){
   const item=packet.params;const url=new URL(item.request.url);let payload={},responseCode=200;
   const isAuth=url.pathname.includes('/auth/');
   if(item.request.method==='GET' && url.pathname.includes('/exercises'))exerciseReads++;
   const delay=item.request.method==='OPTIONS' ? 0 : item.request.method==='GET' && url.pathname.includes('/workout-drafts/') ? (draftReadDelay || 150) : scenario==='loading' && !isAuth ? 2200 : item.request.method!=='GET' ? mutationDelay : 150;
   if(url.pathname.includes('/auth/me'))payload={user:guest?null:{_id:userId,name:'Alex',email:'alex@example.com',username:'alex',role:'user'}};
   else if(url.pathname.includes('/auth/')) {responseCode=400;payload={message:'Check your details and try again.'};}
   else if(url.pathname.includes('/workout-sessions')){payload=sessions.find(x=>url.pathname.endsWith(x._id)) ?? (scenario==='empty'?[]:sessions); if(scenario==='empty' && !Array.isArray(payload))payload={...payload,exercises:[]};}
   else if(url.pathname.includes('/workout-drafts')){ if(url.pathname.endsWith('/workout-drafts') && item.request.method==='POST'){const body=JSON.parse(item.request.postData);draft.selectedMuscleGroups=body.selectedMuscleGroups;draft.includeCardio=body.includeCardio;draft.status="building";} if(url.pathname.endsWith('/training') && item.request.method==='PATCH'){const body=JSON.parse(item.request.postData);mutations.push(body);const e=draft.exercises.find(e=>e.exerciseId===body.exerciseId);e.training=body.training;e.cardioCompletion=body.cardioCompletion;if(body.training.format!=='strength')e.sets=[];}if(url.pathname.endsWith('/exercises') && item.request.method==='PATCH'){const ids=JSON.parse(item.request.postData).exerciseIds;draft.exercises=ids.map(id=>{const e=exercises.find(e=>e._id===id);return {exerciseId:id,exerciseName:e.name,sets:[{id:'set-'+id,weight:null,reps:null}],training:{format:'strength'}};});}payload={...draft,purpose:routePath.includes('template')?'template':'workout',status:draft.status,exercises:scenario==='empty'?[]:draft.exercises};}
   else if(url.pathname.includes('/exercises')){const muscles=url.searchParams.get('muscles')?.split(',')??[];const filtered=exercises.filter(e=>(!url.searchParams.get('exerciseType') || e.exerciseType===url.searchParams.get('exerciseType')) && (!muscles.length || [...(e.primaryMuscles??[]),...(e.secondaryMuscles??[])].some(m=>muscles.includes(m)) || (url.searchParams.get('includeCardio')==='true' && e.exerciseType==='cardio')));payload=exercises.find(e=>url.pathname.endsWith(e._id)) ?? {exercises:scenario==='empty'?[]:filtered,total:scenario==='empty'?0:filtered.length,totalPages:1};}
   else if(url.pathname.includes('/workout-templates')){payload=templates.find(t=>url.pathname.endsWith(t._id)) ?? (scenario==='empty'?[]:templates); if(scenario==='empty' && !Array.isArray(payload))payload={...payload,exercises:[]};}
   else if(url.pathname.includes('/users/'))payload={_id:userId,name:'Alex',email:'alex@example.com',username:'alex',role:'user'};
   else {responseCode=404;payload={message:'Mock endpoint not found: '+url.pathname};}
   if(scenario==='error' && !isAuth && item.request.method!=='OPTIONS'){responseCode=503;payload={message:'Unable to load this content. Please try again.'};}
   if(item.request.method==='OPTIONS'){responseCode=200;payload={};}
   await wait(delay);
   await send('Fetch.fulfillRequest',{requestId:item.requestId,responseCode,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:base},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Methods',value:'GET, POST, PATCH, PUT, DELETE, OPTIONS'},{name:'Access-Control-Allow-Headers',value:'Content-Type'}],body:Buffer.from(JSON.stringify(payload)).toString('base64')}).catch(()=>{});
  }
 });
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*/api/*'}]});
 async function evalValue(expression){const data=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(data.exceptionDetails)throw Error(JSON.stringify(data.exceptionDetails));return data.result.value;}
 async function metrics(width,height){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});}

 await send('Page.addScriptToEvaluateOnNewDocument',{source: `window.cardioIntervals = new Set(); const nativeSetInterval = window.setInterval.bind(window), nativeClearInterval = window.clearInterval.bind(window); window.setInterval = (callback, delay, ...args) => { const id = nativeSetInterval(callback, delay, ...args); if (delay === 200) window.cardioIntervals.add(id); return id; }; window.clearInterval = id => { window.cardioIntervals.delete(id); nativeClearInterval(id); };`});
 async function visit(path,width=375) { routePath=path;await metrics(width,width<1000?812:1000);await send('Page.navigate',{url:base+path});await wait(1100); }
 async function click(label,card=3) {await evalValue(`(()=>{const root=document.querySelectorAll('section[class*=exerciseCard]')[${card}];const b=[...root.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b)throw Error('Missing '+${JSON.stringify(label)});b.click();})()`);await wait(300);}
 async function text(card=3) {return evalValue(`document.querySelectorAll('section[class*=exerciseCard]')[${card}].textContent`);}
 async function offset(ms) { await evalValue(`window.originalNow??=Date.now;Date.now=()=>window.originalNow()+${ms}`);await wait(350); }
 if(process.env.CARDIO_CHECK_PHASE!=='selection-summary') {
 await visit('/workout-summary/'+draftId);
 assert((await evalValue('document.body.textContent')).includes('Total: 14:30'));
 const setFormat = f => evalValue(`(()=>{const s=document.querySelectorAll('form select')[3];s.value=${JSON.stringify(f)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await setFormat('cardio');await wait(100);
 assert(await evalValue("[...document.querySelectorAll('button')].find(b=>b.textContent==='Start workout').disabled"));
 await setFormat('intervals');await wait(100);
 await evalValue("document.querySelectorAll('form')[3].requestSubmit()");await wait(500);
 assert.equal(mutations.length,1);assert.deepEqual(mutations[0].training,{format:'intervals',rounds:8,workSeconds:30,restSeconds:90});
 assert(!await evalValue("[...document.querySelectorAll('button')].find(b=>b.textContent==='Start workout').disabled"));
 assert(await evalValue('document.documentElement.scrollWidth <= innerWidth + 1'));
 console.log('PASS: mixed configuration editing, save gating, interval total, mobile builder');
 for (const width of [320, 375, 480, 768, 1024, 1440]) {
  await metrics(width, 900); await wait(150);
  const layout = await evalValue(`(() => {
    const form = document.querySelectorAll('form')[3];
    const bounds = [...form.querySelectorAll('input,select,fieldset')].map(el => el.getBoundingClientRect());
    const card = form.closest('section') || form.parentElement;
    const cardBounds = card.getBoundingClientRect();
    const durations = [...form.querySelectorAll('fieldset fieldset')].map(el => el.getBoundingClientRect());
    return {
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      contained: bounds.every(b => b.left >= cardBounds.left && b.right <= cardBounds.right + 1),
      touchTargets: [...form.querySelectorAll('input,select')].every(el => el.getBoundingClientRect().height >= 44),
      durations: durations.map(b => ({ top: b.top, bottom: b.bottom, width: b.width }))
    };
  })()`);
  assert(!layout.overflow, `${width}px summary overflow`);
  assert(layout.contained, `${width}px interval fields outside card`);
  assert(layout.touchTargets, `${width}px interval controls too small`);
  assert.equal(layout.durations.length, 2);
  if (width <= 480) assert(layout.durations[1].top >= layout.durations[0].bottom, `${width}px durations should stack`);
  if (width >= 768) assert(Math.abs(layout.durations[0].top - layout.durations[1].top) < 1, `${width}px durations should sit side by side`);
  if (process.env.CARDIO_SCREENSHOT_DIR) {
    await evalValue("document.querySelectorAll('form')[3].scrollIntoView({block:'center'})"); await wait(100);
    const shot = await send('Page.captureScreenshot', {format:'png'});
    fs.mkdirSync(process.env.CARDIO_SCREENSHOT_DIR, {recursive:true});
    fs.writeFileSync(path.join(process.env.CARDIO_SCREENSHOT_DIR, 'summary-'+width+'.png'), Buffer.from(shot.data,'base64'));
  }
 }
 console.log('PASS: responsive interval summary at 320, 375, 480, 768, 1024 and 1440px');

 for(const width of [375,1440]) {
  await visit('/workout/'+draftId,width);
  assert((await text()).includes('Ready'));
  assert(await evalValue('document.documentElement.scrollWidth <= innerWidth + 1'));
  await click('Start cardio');assert((await text()).includes('Work'));assert.equal(await evalValue('window.cardioIntervals.size'),1);
  if(process.env.CARDIO_SCREENSHOT_DIR) {
   await evalValue("document.querySelectorAll('section[class*=exerciseCard]')[3].scrollIntoView({block:'center'})");await wait(200);
   const shot=await send('Page.captureScreenshot',{format:'png'});
   fs.mkdirSync(process.env.CARDIO_SCREENSHOT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.CARDIO_SCREENSHOT_DIR,'cardio-'+width+'.png'),Buffer.from(shot.data,'base64'));
  }
  assert((await evalValue('document.body.textContent')).includes('Cardio session controls its work and rest phases'));
  await offset(31000);assert((await text()).includes('Rest'));
  await click('Pause');const paused=await evalValue("document.querySelectorAll('[aria-label=\"Phase countdown\"]')[0].textContent");
  assert.equal(await evalValue('window.cardioIntervals.size'),0);
  await offset(99000);assert.equal(await evalValue("document.querySelectorAll('[aria-label=\"Phase countdown\"]')[0].textContent"),paused);
  await send('Page.navigate',{url:base+'/workout/'+draftId});await wait(1100);
  assert((await text()).includes('Paused (Rest)'));assert.equal(await evalValue("document.querySelectorAll('[aria-label=\"Phase countdown\"]')[0].textContent"),paused);
  await click('Resume');await offset(400000);assert((await text()).includes('Round 4 of 8'));
  await offset(900000);assert((await text()).includes('Completed'));assert((await text()).includes('8 of 8 rounds completed'));
  assert(await evalValue("document.querySelectorAll('progress')[0].value===8"));assert.equal(await evalValue('window.cardioIntervals.size'),0);
  await click('Reset session');assert((await text()).includes('Ready'));
  await click('Start cardio');await click('Start cardio',4);assert((await text()).includes('Paused (Work)'));assert((await text(4)).includes('Work'));assert.equal(await evalValue('window.cardioIntervals.size'),1);
  await offset(970000);assert((await text(4)).includes('Completed'));
  await click('Reset session',4);await click('Reset session');
  await evalValue('Date.now=window.originalNow;window.originalNow=undefined;localStorage.clear()');
  console.log('PASS: '+width+'px countdown, pause/reload/resume, delayed phases, completion, reset, exclusive timer ownership');
 }
 // Unmounting a running component leaves its timestamp snapshot and cleans up callbacks.
 await visit('/workout/'+draftId);await click('Start cardio');
 await visit('/workout-summary/'+draftId);assert.equal(await evalValue('window.cardioIntervals.size'),0);
 assert(!(await evalValue('document.body.textContent')).includes('Cardio session controls its work and rest phases'));
 await visit('/workout/'+draftId);assert((await text()).includes('Work'));
 await click('Complete manually');assert((await text()).includes('Completed manually'));
 }
 draft.selectedMuscleGroups=[];draft.exercises=[];
 await visit('/workout-select');
 assert(await evalValue("!!document.querySelector('[aria-label=\"Cardio\"]')"));
 assert(!await evalValue("!!document.querySelector('[aria-label=\"Cardio / intervals\"]')"));
 await evalValue("document.querySelector('[aria-label=\"Cardio\"]').click()");await wait(100);
 await evalValue("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Continue').click()");await wait(1200);
 assert((await evalValue('document.body.textContent')).includes('Assault Bike / Air Bike'));
 assert((await evalValue('document.body.textContent')).includes('Stationary Bike'));
 assert(!(await evalValue('document.body.textContent')).includes('Barbell bench press'));
 assert(!(await evalValue('document.body.textContent')).includes('Dumbbell overhead shoulder press'));
 await evalValue("(()=>{const input=document.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'bike');input.dispatchEvent(new Event('input',{bubbles:true}));})()");await wait(800);
 assert(!(await evalValue('document.body.textContent')).includes('Barbell bench press'));
 console.log('PASS: Cardio label and cardio-only exercise selection, including searching');
 await visit('/workout-select');
 await evalValue("document.querySelector('[aria-label=\"Cardio\"]').click();document.querySelector('[aria-label=\"Abs\"]').click()");await wait(100);
 await evalValue("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Continue').click()");await wait(1200);
 assert.equal(draft.includeCardio,true);assert.deepEqual(draft.selectedMuscleGroups,['core']);
 const mixedText=await evalValue('document.body.textContent');
 assert(mixedText.includes('Abs and Cardio'));assert(mixedText.includes('Abdominal Crunch'));assert(mixedText.includes('Assault Bike / Air Bike'));assert(mixedText.includes('Stationary Bike'));assert(!mixedText.includes('Barbell bench press'));
 await send('Page.reload');await wait(1200);
 assert((await evalValue('document.body.textContent')).includes('Abdominal Crunch'));assert((await evalValue('document.body.textContent')).includes('Assault Bike / Air Bike'));
 console.log('PASS: Abs plus Cardio includes both categories and retains selection across reload');
 await evalValue('[...document.querySelectorAll("[role=button]")].find(card=>card.textContent.includes("Abdominal Crunch")).click()');await wait(100);
 const beforeReads=exerciseReads;
 await evalValue('window.dispatchEvent(new Event("offline"))');await wait(50);await evalValue('window.dispatchEvent(new Event("online"))');await wait(600);
 assert(exerciseReads>beforeReads,'exercise library did not refetch on reconnect');
 assert(await evalValue('[...document.querySelectorAll("[role=button][aria-pressed=true]")].some(card=>card.textContent.includes("Abdominal Crunch"))'),'background refetch erased unsaved exercise selection');
 console.log('PASS: unsaved workout exercise selection survives reconnect refetch');
 draftReadDelay=1800;
 await evalValue('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Continue").click()');await wait(450);
 assert.equal(await evalValue('location.pathname'),'/workout-summary/'+draftId);
 assert(await evalValue('[...document.querySelectorAll("h3")].some(h=>h.textContent.includes("Abdominal Crunch"))'),'saved selection missing on first summary render');
 await wait(1900);
 assert(await evalValue('[...document.querySelectorAll("h3")].some(h=>h.textContent.includes("Abdominal Crunch"))'),'summary lost selection after draft refresh');
 draftReadDelay=0;
 console.log('PASS: selected exercise appears on first summary render before delayed GET and stays after refresh');



 assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
 console.log('PASS: navigation cleanup and restoration, manual completion, no browser runtime errors');
 await send('Fetch.disable');await send('Browser.close');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{ws?.close();browser?.kill();server.close();});
