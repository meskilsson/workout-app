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
 if(['localized-exercise-ui','language-controls'].includes(process.env.UI_CHECK_PHASE)) {
  exercise.isCustom=false;
  exercise.translations={sv:{name:'Bänkpress',description:'Bröstpress med skivstång på en plan bänk.',instructions:'Sänk stången kontrollerat mot bröstet och pressa upp.'}};
 }
 const draft={_id:draftId,userId,status:'active',selectedMuscleGroups:['chest','back'],exercises:exercises.map((e,j)=>({exerciseId:e._id,exerciseName:e.name,sets:Array.from({length:3},(_,i)=>({id:`f8f6de5c-e305-4bba-b62b-a5375d3b79b${j*3+i}`,weight:j?25:40,reps:8+i}))}))};
 if(process.env.UI_CHECK_PHASE==='web-timers') {
  draft.exercises[1].training={format:'intervals',rounds:3,workSeconds:2,restSeconds:1};
  draft.exercises[1].sets=[];
 }
 if(process.env.UI_CHECK_PHASE==='direct-start') {
  exercises[1].exerciseType='cardio';exercises[1].name='Cycling';
  draft.exercises[1]={...draft.exercises[1],exerciseName:'Cycling',training:{format:'cardio',durationSeconds:600},sets:[]};
 }
 const templates=['Upper body essentials','Full body strength','Push day'].map((name,i)=>({_id:'0123456789abcdef0123458'+i,name,description:'A balanced strength session. Build consistency with focused, controlled sets.',category:'strength',isPublic:true,exercises:exercises.map((e,order)=>({_id:e._id,exerciseId:e._id,exerciseName:e.name,exercise:e,plannedSets:[{weight:40,reps:8},{weight:40,reps:8}],order}))}));
 let scenario='populated', guest=false, routePath='/', mutationDelay=0, formFailure='field';
 const requestCounts = new Map();
 const workoutRequests=[]; let savedStatus='active', loseCompletion=false;
 let startFailure='', draftPurpose='workout';
 const browserErrors=[];
 const sessions=[0,1].map(i=>({_id:'0123456789abcdef0123459'+i,userId,startedAt:'2026-10-0'+(5-i)+'T09:00:00Z',endedAt:'2026-10-0'+(5-i)+'T09:45:00Z',duration:2700,exercises:draft.exercises}));
 ws.addEventListener('message',async event=>{
  const packet=JSON.parse(event.data);if(packet.id){const job=pending.get(packet.id);if(job){pending.delete(packet.id);packet.error?job.reject(Error(JSON.stringify(packet.error))):job.resolve(packet.result);}return;}
  if(packet.method==='Runtime.exceptionThrown') browserErrors.push(packet.params.exceptionDetails);
  if(packet.method==='Fetch.requestPaused'){
   const item=packet.params;const url=new URL(item.request.url);let payload={},responseCode=200;
   const requestKey=item.request.method+':'+url.pathname;
   requestCounts.set(requestKey,(requestCounts.get(requestKey)||0)+1);
   const isAuth=url.pathname.includes('/auth/');
   const delay=item.request.method==='OPTIONS' ? 0 : (scenario==='loading' && !isAuth || scenario==='auth-loading') ? 2200 : item.request.method!=='GET' ? mutationDelay : 150;
   if(url.pathname.includes('/auth/me'))payload={user:guest?null:{_id:userId,name:'Alex',email:'alex@example.com',username:'alex',role:['animation-additions','form-errors','localization'].includes(process.env.UI_CHECK_PHASE)?'admin':'user'}};
   else if(url.pathname.includes('/auth/')) {responseCode=400;payload=process.env.UI_CHECK_PHASE==='localization-states'?{code:'INVALID_CREDENTIALS',message:'Invalid email or password'}:{message:'Check your details and try again.'};}
   else if(process.env.UI_CHECK_PHASE==='localization' && url.pathname.endsWith('/api/admin/dashboard')) payload={users:5,admins:2,workouts:68,exercises:201,sharedExercises:183,templates:13,sharedTemplates:6,drafts:5};
   else if(url.pathname.includes('/api/admin/')) { const resource=url.pathname.split('/')[3];const items=resource==='templates'?templates:resource==='sessions'?sessions:exercises;payload=items.find(x=>url.pathname.endsWith(x._id)) ?? {items,total:items.length,page:1,limit:20}; }
   else if(url.pathname.includes('/workout-sessions')){payload=sessions.find(x=>url.pathname.endsWith(x._id)) ?? (scenario==='empty'?[]:sessions); if(scenario==='empty' && !Array.isArray(payload))payload={...payload,exercises:[]};}
   else if(url.pathname.includes('/workout-drafts'))payload={...draft,purpose:routePath.includes('template')?'template':'workout',status:routePath.startsWith('/workout/')?'active':'building',exercises:scenario==='empty'?[]:draft.exercises};
   else if(url.pathname.includes('/exercises'))payload=exercises.find(e=>url.pathname.endsWith(e._id)) ?? {exercises:scenario==='empty'?[]:exercises,total:scenario==='empty'?0:3,totalPages:['motion','exercise-ux'].includes(process.env.UI_CHECK_PHASE)?2:1};
   else if(url.pathname.includes('/workout-templates')){payload=templates.find(t=>url.pathname.endsWith(t._id)) ?? (scenario==='empty'?[]:templates); if(scenario==='empty' && !Array.isArray(payload))payload={...payload,exercises:[]};}
   else if(url.pathname.includes('/users/'))payload={_id:userId,name:'Alex',email:'alex@example.com',username:'alex',role:'user'};
   else {responseCode=404;payload={message:'Mock endpoint not found: '+url.pathname};}
   if(scenario==='error' && !isAuth && item.request.method!=='OPTIONS'){responseCode=503;payload={message:'Unable to load this content. Please try again.'};}
   if(process.env.UI_CHECK_PHASE==='query-migration' && item.request.method==='PATCH' && url.pathname.startsWith('/api/exercises/')) {
    const index=exercises.findIndex(e=>url.pathname.endsWith(e._id));
    assert(index>=0);exercises[index]={...exercises[index],...JSON.parse(item.request.postData)};payload=exercises[index];
   }
   if(process.env.UI_CHECK_PHASE==='query-migration' && item.request.method==='DELETE' && url.pathname.startsWith('/api/exercises/')) {
    const index=exercises.findIndex(e=>url.pathname.endsWith(e._id));
    assert(index>=0);exercises.splice(index,1);payload={message:'Exercise deleted'};
   }
   if(process.env.UI_CHECK_PHASE==='query-migration' && item.request.method==='DELETE' && url.pathname.startsWith('/api/workout-sessions/')) {
    const index=sessions.findIndex(s=>url.pathname.endsWith(s._id));
    assert(index>=0);payload=sessions.splice(index,1)[0];
   }
   if(process.env.UI_CHECK_PHASE==='workout-migration' && url.pathname.includes('/workout-drafts') && item.request.method!=='OPTIONS') {
    workoutRequests.push({ method:item.request.method, path:url.pathname });
    payload={...draft,status:savedStatus,completedSessionId:savedStatus==='completed'?sessions[0]._id:null};
    if(url.pathname.endsWith('/complete')) {
     savedStatus='completed';payload=sessions[0];
     if(loseCompletion) {loseCompletion=false;await send('Fetch.failRequest',{requestId:item.requestId,errorReason:'ConnectionClosed'});return;}
    }
    if(url.pathname.endsWith('/abandon'))savedStatus='abandoned';
   }
   if(process.env.UI_CHECK_PHASE==='direct-start' && item.request.method==='POST' && (url.pathname.endsWith('/repeat') || url.pathname.includes('/workout-templates/') && url.pathname.endsWith('/start'))) {savedStatus='building';payload={...draft,status:'building',purpose:'workout'};}
   if(process.env.UI_CHECK_PHASE==='direct-start' && url.pathname.includes('/workout-drafts') && item.request.method!=='OPTIONS') {
    workoutRequests.push({method:item.request.method,path:url.pathname});
    if(url.pathname.endsWith('/start')) {
     if(startFailure==='reject'){responseCode=503;payload={message:'Try again.'};}
     else {savedStatus='active';if(startFailure==='lost'){startFailure='';await send('Fetch.failRequest',{requestId:item.requestId,errorReason:'ConnectionClosed'});return;}}
    }
    if(url.pathname.endsWith('/training')) {
     const input=JSON.parse(item.request.postData);const entry=draft.exercises.find(e=>e.exerciseId===input.exerciseId);entry.training=input.training;
    }
    if(responseCode===200)payload={...draft,purpose:draftPurpose,status:savedStatus};
   }
   if(process.env.UI_CHECK_PHASE==='form-errors' && item.request.method!=='GET' && item.request.method!=='OPTIONS') {
    responseCode=formFailure==='server'?500:400;
    payload=formFailure==='server'?{message:'MongoServerError: internal details'}:formFailure==='mixed'?{errors:[{field:'name',message:'Choose another name.'},{field:'unknown',message:'This record is unavailable.'}]}:formFailure==='field'?{errors:[{path:['email'],message:'Use another email address.'},{field:'name',message:'Choose another name.'}]}:{message:'Unable to save. Please try again.'};
    if(formFailure==='network') {await send('Fetch.failRequest',{requestId:item.requestId,errorReason:'ConnectionClosed'});return;}
   }
   if(process.env.UI_CHECK_PHASE==='exercise-history' && url.pathname.includes('/workout-drafts')) {
    if(item.request.method==='PATCH' && url.pathname.endsWith('/sets')) {
     const body=JSON.parse(item.request.postData);draft.exercises.find(exercise=>exercise.exerciseId===body.exerciseId).sets=body.sets;
    }
    if(item.request.method==='PATCH' && url.pathname.endsWith('/replace')) {
     const oldId=url.pathname.split('/').at(-2),{replacementExerciseId}=JSON.parse(item.request.postData);
     const target=exercises.find(exercise=>exercise._id===replacementExerciseId);
     draft.exercises[draft.exercises.findIndex(exercise=>exercise.exerciseId===oldId)]={exerciseId:target._id,exerciseName:target.name,sets:Array.from({length:4},(_,i)=>({id:`f8f6de5c-e305-4bba-b62b-a5375d3b790${i}`,weight:i?30:10,reps:i?8:12,isWarmup:i===0}))};
    }
    payload={...draft,purpose:'workout',status:'active'};
   }
   if(process.env.UI_CHECK_PHASE==='workout-markers' && url.pathname.includes('/workout-drafts')) {
    if(item.request.method==='PATCH' && url.pathname.endsWith('/supersets')) {
     const {pairs}=JSON.parse(item.request.postData);
     for(const exercise of draft.exercises) delete exercise.supersetId;
     pairs.forEach((pair,index)=>pair.forEach(id=>{draft.exercises.find(exercise=>exercise.exerciseId===id).supersetId=`f8f6de5c-e305-4bba-b62b-a5375d3b79${String(index).padStart(2,'0')}`;}));
    }
    if(item.request.method==='PATCH' && url.pathname.endsWith('/sets')) {
     const body=JSON.parse(item.request.postData);draft.exercises.find(exercise=>exercise.exerciseId===body.exerciseId).sets=body.sets;
    }
    if(item.request.method==='PATCH' && url.pathname.endsWith('/order')) {
     const {exerciseIds}=JSON.parse(item.request.postData);draft.exercises=exerciseIds.map(id=>draft.exercises.find(exercise=>exercise.exerciseId===id));
    }
    payload={...draft,purpose:'workout',status:'active'};
   }
   if(item.request.method==='OPTIONS'){responseCode=200;payload={};}
   await wait(delay);
   await send('Fetch.fulfillRequest',{requestId:item.requestId,responseCode,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:base},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Methods',value:'GET, POST, PATCH, PUT, DELETE, OPTIONS'},{name:'Access-Control-Allow-Headers',value:'Content-Type'}],body:Buffer.from(JSON.stringify(payload)).toString('base64')}).catch(()=>{});
  }
 });
 await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*/api/*'}]});
 async function evalValue(expression){const data=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(data.exceptionDetails)throw Error(JSON.stringify(data.exceptionDetails));return data.result.value;}
 async function metrics(width,height){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await send('Emulation.setTouchEmulationEnabled',{enabled:width<1000,maxTouchPoints:1});}
 await send('Page.navigate',{url:base}); await wait(800);
 const routes=[
 ['home','/',false,'Your training'],['home-alias','/homepage',true,'Your training'],
 ['guest-library','/library',true,'Exercise Library'],['guest-exercise','/exercises/'+exerciseId,true,'Barbell bench press'],['guest-templates','/templates/pre-made',true,'Browse workouts'],['guest-template-details','/templates/pre-made/templates-details/'+templates[0]._id,true,'Upper body essentials'],
 ['login','/login',true,'Log in'],['signup','/signup',true,'Register'],
 ['workout-select','/workout-select',false,'Choose muscle groups'],['template-select','/workout-select?purpose=template',false,'Choose workout muscles'],
 ['exercise-select','/exercise-select/'+draftId,false,'Edit exercises'],['workout-summary','/workout-summary/'+draftId,false,'Workout summary'],
 ['template-summary','/workout-summary/'+draftId+'?template',false,'Template review'],['workout','/workout/'+draftId,false,'Barbell bench press'],
 ['result','/workout-result/'+sessions[0]._id,false,'Workout saved'],['library','/library',false,'Exercise Library'],
 ['exercise-details','/exercises/'+exerciseId,false,'Barbell bench press'],['create-exercise','/create-exercise',false,'Create exercise'],['edit-exercise','/edit-exercise/'+exerciseId,false,'Edit exercise'],
 ['templates','/templates',false,'Browse workouts'],['public-templates','/templates/pre-made',false,'Browse workouts'],['my-templates','/templates/my',false,'My templates'],
 ['public-template-details','/templates/pre-made/templates-details/'+templates[0]._id,false,'Upper body essentials'],['my-template-details','/templates/my/templates-details/'+templates[0]._id,false,'Upper body essentials'],
 ['create-template','/templates/create',false,'Create a template'],['profile','/profile',false,'Your profile'],['history','/profile/workouts',false,'Workout history'],
 ['session-details','/profile/workouts/'+sessions[0]._id,false,'Workout details'],['my-exercises','/profile/exercises',false,'My exercises'],['settings','/profile/settings',false,'Account settings'],
 ];
 const routeMatches = route => !process.env.UI_CHECK_ROUTES || process.env.UI_CHECK_ROUTES.split(',').includes(route[0]);
 async function visit(route,mode,width,state='populated') {
  scenario=state;guest=route[2];routePath=route[1];await metrics(width,width===1225?527:width===844?390:width<1000?812:900);
  await evalValue("localStorage.setItem('color_theme', '"+mode+"')");
  await send('Page.navigate',{url:base+routePath});await wait(state.endsWith('loading')?500:1000);
  const info=await evalValue("({width:innerWidth,scroll:document.documentElement.scrollWidth,text:document.body.innerText,busy:!!document.querySelector('[aria-busy=true]'),shapes:document.querySelectorAll('[class*=shape]').length,heading:!!document.querySelector('h1,h2'),fonts:[...document.querySelectorAll('input:not([type=checkbox]),select,textarea')].map(x=>parseFloat(getComputedStyle(x).fontSize))})");
  assert(info.scroll<=info.width+1,route[0]+' '+state+' horizontal overflow');
  if(width<1000)assert(info.fonts.every(x=>x>=16),route[0]+' input font size');
  assert.equal(await evalValue("document.documentElement.dataset.theme"),mode);
  if(state==='populated') {const en=require('../src/i18n/locales/en.json'),sv=require('../src/i18n/locales/sv.json');const language=await evalValue('document.documentElement.lang');const key=Object.keys(en).find(key=>en[key]===route[3]);const expected=language==='sv' && key ? sv[key] : language==='sv' && ['localized-exercise-ui','language-controls'].includes(process.env.UI_CHECK_PHASE) && route[3]===exercise.name ? exercise.translations.sv.name : route[3];assert(info.text.toLowerCase().includes(expected.toLowerCase()),route[0]+' missing populated content: '+info.text);assert(info.heading);}
  if(state.endsWith('loading'))assert(info.busy && info.shapes>0,route[0]+' missing skeleton');
  if(state==='error')assert(info.text.includes('Servern kunde inte slutf') || info.text.includes('The server could not complete your request') || route[0]==='workout' && info.text.includes('Unable to restore your workout'),route[0]+' missing friendly error');
  if(state==='populated' && route[0].includes('library'))assert(await evalValue("[...document.querySelectorAll('article')].every(card=>{const figure=card.querySelector('figure'),text=card.querySelector('[class*=exerciseText]');return figure && figure.getBoundingClientRect().top>=text.getBoundingClientRect().bottom && figure.getBoundingClientRect().bottom<=card.getBoundingClientRect().bottom+1})"),'Library figure overlaps or is clipped');
  const shot=await send('Page.captureScreenshot' ,{format:'png'});fs.writeFileSync(path.join(process.env.TEMP,'complete-'+route[0]+'-'+mode+'-'+width+'-'+state+'.png'),Buffer.from(shot.data,'base64'));
  console.log('PASS',route[0],mode,width,state);
 }
 async function checkRecovery(mode,width=375) {
  scenario='error';guest=false;routePath='/workout/'+draftId;await metrics(width,width===375?812:900);
  const key='workout-current:'+userId, progressKey='workout-progress:'+userId+':'+draftId+':sets';
  const progress=JSON.stringify({[exerciseId]:[{id:draft.exercises[0].sets[0].id,weight:'40',reps:'8',isCompleted:true}]});
  await evalValue('localStorage.clear();localStorage.setItem("color_theme",'+JSON.stringify(mode)+');localStorage.setItem('+JSON.stringify(key)+','+JSON.stringify(JSON.stringify(draftId))+');localStorage.setItem('+JSON.stringify(progressKey)+','+JSON.stringify(progress)+')');
  await send('Page.navigate',{url:base+routePath});await wait(800);
  assert(await evalValue("document.body.innerText.includes('Unable to restore your workout')"));
  assert.equal(await evalValue('localStorage.getItem('+JSON.stringify(progressKey)+')'),progress);
  assert(await evalValue("document.documentElement.scrollWidth<=innerWidth+1"));
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(process.env.TEMP,'complete-recovery-'+mode+'-'+width+'-error.png'),Buffer.from(shot.data,'base64'));
  scenario='populated';await evalValue("[...document.querySelectorAll('button')].find(b=>b.textContent==='Retry').click()");await wait(1000);
  assert(await evalValue("!!document.querySelector('[aria-pressed=true]')"));
  console.log('PASS recovery retains progress and retry restores checked set',mode,width);
 }



 if(process.env.UI_CHECK_PHASE==='exercise-history') {
  const original=structuredClone(draft.exercises);
  for(const mode of ['light','dark']) for(const width of [375,1440]) {
   draft.exercises=[structuredClone(original[0]),structuredClone(original[2])];
   await evalValue('localStorage.clear()');
   await visit(routes.find(route=>route[0]==='workout'),mode,width);
   await evalValue("(()=>{const input=[...document.querySelectorAll('[class*=exerciseCard]')][1].querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'55');input.dispatchEvent(new Event('input',{bubbles:true}));})()");await wait(100);
   await evalValue("document.querySelector('summary[aria-label]').click();[...document.querySelectorAll('button')].find(button=>button.textContent==='Change exercise').click()");await wait(1100);
   assert(await evalValue('location.search.includes("replace='+exerciseId+'")'));
   assert(await evalValue("document.querySelector('h1').textContent.includes('Change exercise')"));
   assert.equal(draft.exercises[1].sets[0].weight,'55','edited partner not saved before navigation');
   await evalValue("[...document.querySelectorAll('[role=button][aria-pressed]')].find(card=>card.textContent.includes('Seated cable row')).click()");await wait(100);
   assert.equal(await evalValue("document.querySelectorAll('[role=button][aria-pressed=true]:not([aria-disabled=true])').length"),1);
   await evalValue("[...document.querySelectorAll('button')].find(button=>button.textContent==='Change exercise').click()");await wait(1100);
   assert(await evalValue("location.pathname.startsWith('/workout/')"));
   assert.equal(draft.exercises[0].exerciseId,exercises[1]._id);
   assert(await evalValue("document.querySelector('[class*=exerciseCard] h2').textContent.includes('Seated cable row')"));
   assert.equal(await evalValue("document.querySelector('[class*=exerciseCard]').querySelectorAll('input').length"),8);
   assert.equal(await evalValue("document.querySelector('[class*=exerciseCard]').querySelectorAll('button[aria-label^=\"Complete warm-up set\"]').length"),1);
   assert.equal(await evalValue("document.querySelectorAll('button[aria-pressed=true]').length"),0,'history restored completed state');
   assert.equal(await evalValue("[...document.querySelectorAll('[class*=exerciseCard]')][1].querySelector('input').value"),'55');
   await send('Page.navigate',{url:base+'/workout/'+draftId});await wait(900);
   assert(await evalValue("document.querySelector('[class*=exerciseCard] h2').textContent.includes('Seated cable row')"));
   assert.equal(await evalValue("document.querySelector('[class*=exerciseCard]').querySelectorAll('input').length"),8);
   console.log('PASS replace targeted exercise, prefill warm-up/working sets unchecked, preserve edited partner and reload',mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='workout-header') {
  for(const language of ['en','sv']) for(const mode of ['light','dark']) for(const width of [320,375,430,640,844,1440]) {
   await evalValue('localStorage.clear();localStorage.setItem("workout-language",'+JSON.stringify(language)+')');
   await visit(routes.find(route=>route[0]==='workout'),mode,width);
   if(width<=640) {
    const headers=await evalValue(`Array.from(document.querySelectorAll('[class*=exerciseHeader]')).map(header=>{
     const rect=selector=>{const r=header.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,center:r.top+r.height/2};};
     return {drag:rect('[class*=dragHandle]'),title:rect('h2'),add:rect('[class*=addSetButton]'),menu:rect('summary'),progress:rect('[class*=exerciseProgress]')};
    })`);
    assert(headers.length>0);
    for(const h of headers) {
     for(const item of [h.title,h.add,h.menu])assert(Math.abs(item.center-h.drag.center)<1,'header controls not aligned: '+JSON.stringify(h));
     assert(h.drag.right<=h.title.left && h.title.right<=h.add.left && h.add.right<=h.menu.left,'overlapping header elements');
     assert(h.progress.top>=Math.max(h.drag.bottom,h.title.bottom,h.add.bottom,h.menu.bottom),'progress overlaps main row');
    }
   }
   console.log('PASS workout header alignment',language,mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='web-timers') {
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
   window.__timerFrequencies=[];
   window.__permissionPrompts=0;
   if ('Notification' in window) {
    let permission='default';
    Object.defineProperty(Notification,'permission',{get:()=>permission});
    Notification.requestPermission=()=>{window.__permissionPrompts++;permission='denied';return Promise.resolve(permission);};
   }
   window.AudioContext=class {
    state='running';currentTime=0;destination={};
    resume(){this.state='running';return Promise.resolve();}
    createOscillator(){return {frequency:{setValueAtTime:n=>window.__timerFrequencies.push(n)},connect(){},disconnect(){},start(){},stop(){}};}
    createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
   };
  `});
  for(const mode of ['light','dark']) for(const width of [375,1440]) {
   await evalValue('localStorage.clear();localStorage.setItem("rest-duration:'+userId+'","2000")');
   await visit(routes.find(route=>route[0]==='workout'),mode,width);
   assert.equal(await evalValue('window.__permissionPrompts'),0,'automatic notification permission prompt');
   mutationDelay=1800;
   await evalValue("document.querySelector('button[aria-label^=\"Complete set\"]').click()"); await wait(150);
   assert(await evalValue("!!document.querySelector('button[aria-label=\"Pause rest timer\"]')"),'rest waited for save');
   assert(await evalValue("!!document.querySelector('[aria-pressed=true]')"));
   await wait(2300);mutationDelay=0;
   assert.equal(await evalValue('window.__timerFrequencies.filter(n=>n===880).length'),2);
   await evalValue("[...document.querySelectorAll('button')].find(button=>button.textContent==='Start cardio').click()");await wait(100);
   routePath='/library';await evalValue("document.querySelector('a[href=\"/library\"]').click()");await wait(3300);
   const active=await evalValue('JSON.parse(localStorage.getItem("workout-progress:'+userId+':'+draftId+':web-timers")).cardio["'+draft.exercises[1].exerciseId+'"]');
   assert.equal(active.state.status,'running','route change stopped cardio');
   routePath='/workout/'+draftId;
   await evalValue("[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Resume workout')).click()");await wait(700);
   assert(await evalValue("[...document.querySelectorAll('button')].some(button=>button.textContent==='Pause')"));
   await evalValue("[...document.querySelectorAll('button')].find(button=>button.textContent==='Pause').click()");await wait(150);
   await send('Page.navigate',{url:base+routePath});await wait(900);
   assert(await evalValue("[...document.querySelectorAll('button')].some(button=>button.textContent==='Resume')"),'paused cardio did not restore');
   assert.equal(await evalValue('window.__timerFrequencies.length'),0,'restoration replayed cues');
   await evalValue("[...document.querySelectorAll('button')].find(button=>button.textContent==='Resume').click()");await wait(5000);
   const done=await evalValue('JSON.parse(localStorage.getItem("workout-progress:'+userId+':'+draftId+':web-timers")).cardio["'+draft.exercises[1].exerciseId+'"]');
   assert.equal(done.state.status,'completed');
   assert.equal(await evalValue('window.__timerFrequencies.filter(n=>n===1100).length'),2,'final activity cue');
   await evalValue("document.querySelector('button[aria-label=\"Set rest duration\"]').click()");await wait(100);
   assert(await evalValue("document.body.innerText.includes('Enable background alerts')"));
   assert(await evalValue("document.documentElement.scrollWidth<=innerWidth+1"));
   const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(process.env.TEMP,`web-timers-${mode}-${width}.png`),Buffer.from(shot.data,'base64'));
   await evalValue("[...document.querySelectorAll('button')].find(button=>button.textContent==='Enable background alerts').click()");await wait(100);
   assert(await evalValue("document.body.innerText.includes('Notifications are blocked')"));
   await evalValue("[...document.querySelectorAll('button')].find(button=>button.textContent==='Enable background alerts').click()");await wait(50);
   assert.equal(await evalValue('window.__permissionPrompts'),1,'denied permission prompted repeatedly');
   console.log('PASS immediate rest, single cue, route-owned cardio, paused reload and timer settings',mode,width);
  }
  const compiledClaims=require('typescript').transpileModule(fs.readFileSync(path.join(__dirname,'../src/utils/timerClaims.ts'),'utf8'),{compilerOptions:{target:99,module:1}}).outputText;
  const target=await send('Target.createTarget',{url:base+'/timer-sw.js'});await wait(300);
  const secondTab=(await(await fetch('http://127.0.0.1:9227/json/list')).json()).find(tab=>tab.id===target.targetId);
  const secondSocket=new WebSocket(secondTab.webSocketDebuggerUrl);await new Promise(resolve=>secondSocket.addEventListener('open',resolve,{once:true}));
  const claimExpression='(async()=>{const exports={};'+compiledClaims+';return exports.claimTimerEvent("browser-multi-tab-claim");})()';
  const secondResult=new Promise((resolve,reject)=>{secondSocket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id===1){if(message.result?.exceptionDetails)reject(Error(JSON.stringify(message.result.exceptionDetails)));else resolve(message.result.result.value);}});secondSocket.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:claimExpression,returnByValue:true,awaitPromise:true}}));});
  const winners=await Promise.all([evalValue(claimExpression),secondResult]);assert.equal(winners.filter(Boolean).length,1);
  secondSocket.close();await send('Target.closeTarget',{targetId:target.targetId});
  console.log('PASS atomic event claim across two real same-origin browser tabs');
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='workout-markers') {
  const originalExercises=structuredClone(draft.exercises);
  for(const mode of ['light','dark']) for(const width of [375,1440]) {
   draft.exercises=structuredClone(originalExercises);
   await evalValue('localStorage.clear();sessionStorage.clear()');
   await visit(routes.find(route=>route[0]==='workout'),mode,width);
   await evalValue("document.querySelector('summary[aria-label]').click();[...document.querySelectorAll('button')].find(button=>button.textContent==='Add warm-up set').click()");await wait(1000);
   assert(await evalValue("!!document.querySelector('button[aria-label^=\"Complete warm-up set\"]')"));
   assert.equal(draft.exercises[0].sets[0].isWarmup,true);
   assert(await evalValue("(()=>{const marker=document.querySelector('button[aria-label^=\"Complete warm-up set\"]'),input=marker.parentElement.querySelector('input'),a=marker.getBoundingClientRect(),b=input.getBoundingClientRect();return a.right<=b.left && Math.abs((a.top+a.height/2)-(b.top+b.height/2))<2;})()"));
   assert.deepEqual(await evalValue("[...document.querySelectorAll('[class*=exerciseCard]')][0] && [...document.querySelectorAll('[class*=exerciseCard]')[0].querySelectorAll('button[aria-label^=\"Complete set\"]')].map(button=>button.textContent.trim())"),['1','2','3']);
   await evalValue("(()=>{const warmup=document.querySelector('button[aria-label^=\"Complete warm-up set\"]');for(const input of warmup.parentElement.querySelectorAll('input')){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'10');input.dispatchEvent(new Event('input',{bubbles:true}));}})()");await wait(100);
   await evalValue("document.querySelector('button[aria-label^=\"Complete warm-up set\"]').click()");await wait(600);
   assert(await evalValue("document.querySelector('button[aria-label^=\"Completed warm-up set\"]').getAttribute('aria-pressed')==='true'"));
   await evalValue("(()=>{const button=document.querySelector('button[aria-label^=\"Complete set\"]').parentElement.querySelector('button[aria-haspopup=menu]');button.focus();button.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));})()");await wait(100);
   assert(await evalValue("document.activeElement.getAttribute('role')==='menuitem' && document.activeElement.textContent.includes('Delete set')"));
   await evalValue("document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");await wait(50);
   assert(await evalValue("!document.querySelector('[role=menu]') && document.activeElement.getAttribute('aria-haspopup')==='menu'"));
   await evalValue("document.activeElement.click()");await wait(50);
   await evalValue("document.querySelector('[role=menuitem]').click()");await wait(1000);
   assert.deepEqual(await evalValue("[...document.querySelectorAll('[class*=exerciseCard]')[0].querySelectorAll('button[aria-label^=\"Complete set\"]')].map(button=>button.textContent.trim())"),['1','2']);


   await evalValue("document.querySelector('summary[aria-label]').click();[...document.querySelectorAll('button')].find(button=>button.textContent==='Create superset').click()");await wait(150);
   assert(await evalValue("!!document.querySelector('[role=dialog]')"));
   await evalValue("[...document.querySelectorAll('[role=dialog] button')].find(button=>button.textContent.includes('"+draft.exercises[1].exerciseName+"')).click()");await wait(600);
   assert.equal(await evalValue("document.querySelectorAll('[class*=supersetCard]').length"),1);
   assert.equal(await evalValue("document.querySelector('[class*=supersetCard]').querySelectorAll('h2').length"),2);
   assert(await evalValue("document.documentElement.scrollWidth<=innerWidth+1"));
   const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(process.env.TEMP,`workout-markers-${mode}-${width}.png`),Buffer.from(shot.data,'base64'));
   await send('Page.navigate',{url:base+'/workout/'+draftId});await wait(1000);
   assert.equal(await evalValue("document.querySelectorAll('[class*=supersetCard]').length"),1);
   assert(await evalValue("!!document.querySelector('button[aria-label^=\"Completed warm-up set\"]')"));
   await evalValue("document.querySelector('summary[aria-label]').click();[...document.querySelectorAll('button')].find(button=>button.textContent==='Separate exercises').click()");await wait(500);
   assert.equal(await evalValue("document.querySelectorAll('[class*=supersetCard]').length"),0);
   console.log('PASS superset pairing, headers, warm-up autosave, reload and separation',mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='language-controls') {
  for(const mode of ['light','dark'])for(const width of [375,1225,1440]) {
   await evalValue('localStorage.setItem("workout-language","en")');
   await visit(routes.find(route=>route[0]==='workout'),mode,width);
   const before=await evalValue(`JSON.stringify([...document.querySelectorAll('main input')].map(input=>[input.type,input.value,input.checked]))`);
   async function openLanguage() {
    if(width<=1400)await evalValue(`document.querySelector('button[aria-controls="mobile-menu"]').click()`);
    await wait(60);
    await evalValue(`[...document.querySelectorAll('button[aria-haspopup=menu]')].find(button=>button.getClientRects().length).click()`);await wait(60);
   }
   await openLanguage();
   await evalValue(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}))`);
   assert.equal(await evalValue('document.activeElement.lang'),'sv');
   await evalValue('document.activeElement.click()');await wait(400);
   assert.equal(await evalValue('document.documentElement.lang'),'sv');
   assert(await evalValue(`document.querySelector('main').textContent.includes('Bänkpress')`));
   assert.equal(await evalValue(`JSON.stringify([...document.querySelectorAll('main input')].map(input=>[input.type,input.value,input.checked]))`),before);
   if(width<=1400)await evalValue(`document.querySelector('button[aria-controls="mobile-menu"]').click()`);
   // Guest controls must also fit, including the existing register action.
   await visit(routes.find(route=>route[0]==='login'),mode,width);
   await openLanguage();
   assert(await evalValue(`(()=>{const rect=document.querySelector('[role=menu]').getBoundingClientRect();return rect.left>=0 && rect.right<=innerWidth && rect.bottom<=innerHeight})()`));
   const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(process.env.TEMP,`compact-menu-${mode}-${width}.png`),Buffer.from(shot.data,'base64'));
   await evalValue(`document.querySelector('h1').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
   assert.equal(await evalValue('!!document.querySelector("[role=menu]")'),false);
   console.log('PASS keyboard language switch, retained workout inputs, guest dropdown containment',mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));await send('Page.navigate',{url:'about:blank'});await wait(200);await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='localized-exercise-ui') {
  for(const language of (process.env.UI_CHECK_LANGUAGES?.split(',') ?? ['en','sv']))for(const mode of ['light','dark'])for(const width of (process.env.UI_CHECK_WIDTHS?.split(',').map(Number) ?? [320,375,844,1225,1440])) {
   await evalValue('localStorage.setItem("workout-language",'+JSON.stringify(language)+')');
   for(const name of ['home','library','public-templates','workout-select','exercise-select','workout','exercise-details','history','session-details','result','public-template-details'].filter(name=>routeMatches(routes.find(route=>route[0]===name)))) {
    await visit(routes.find(route=>route[0]===name),mode,width);
    if(['library','exercise-select'].includes(name)) {
     assert(await evalValue(`(()=>{const input=document.querySelector('input[type=search]').getBoundingClientRect();const button=document.querySelector('button[aria-haspopup=dialog]').getBoundingClientRect();return button.left>=input.right && Math.abs(input.bottom-button.bottom)<=1})()`),'sort button should align beside search');
     await evalValue(`document.querySelector('button[aria-haspopup=dialog]').click()`);await wait(200);
     assert.equal(await evalValue(`document.querySelectorAll('[role=dialog] input[type=radio]').length`),3);
     await evalValue(`document.querySelector('[role=dialog] input[value=name]').click()`);await wait(300);
     assert.equal(await evalValue(`document.querySelector('button[aria-haspopup=dialog]').getAttribute('aria-expanded')`),'false');
    }
    if(['library','exercise-select','workout','exercise-details','history','session-details','result','public-template-details'].includes(name)) {
     const text=await evalValue('document.body.innerText');
     assert(text.toLowerCase().includes((language==='sv'?'Bänkpress':exercise.name).toLowerCase()),name+' translated exercise name missing: '+text);
     if(name==='library')assert(text.toLowerCase().includes('seated cable row'),'custom exercise must keep original name');
    }
   }
   await visit(routes.find(route=>route[0]==='home'),mode,width);
   if(width<=1400) {
    await evalValue(`document.querySelector('button[aria-controls="mobile-menu"]').click()`);await wait(100);
    await evalValue(`document.querySelector('#mobile-menu button[aria-haspopup=menu]').click()`);await wait(80);
    assert(await evalValue(`(()=>{const menu=document.querySelector('[role=menu]').getBoundingClientRect();const select=document.querySelector('#mobile-menu select').getBoundingClientRect();return menu.left>=0 && menu.right<=innerWidth && select.width<=150 && menu.bottom<=innerHeight})()`),'mobile dropdown must stay contained');
    await evalValue(`document.querySelector('[role=menu]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);await wait(50);
    assert.equal(await evalValue(`document.querySelector('#mobile-menu button[aria-haspopup=menu]').getAttribute('aria-expanded')`),'false');
    await evalValue(`document.querySelector('#mobile-menu select').value=${JSON.stringify(mode==='light'?'dark':'light')};document.querySelector('#mobile-menu select').dispatchEvent(new Event('change',{bubbles:true}))`);await wait(100);
    assert.equal(await evalValue('document.documentElement.dataset.theme'),mode==='light'?'dark':'light');
   }
   console.log('PASS localized exercises, custom fallback, shared sorting and compact menu',language,mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));await send('Page.navigate',{url:'about:blank'});await wait(200);await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='language-motion') {
  for(const mode of ['light','dark'])for(const width of [375,1440]) {
   await evalValue("localStorage.setItem('workout-language','en')");await visit(routes.find(route=>route[0]==='login'),mode,width);
   await evalValue(`(()=>{const input=document.getElementById('email');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'alex@example.com');input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('button[aria-haspopup=menu]').click()})()`);await wait(80);
   await evalValue(`document.querySelectorAll('[role=menuitemradio]')[1].click()`);await wait(70);
   const shadow=await evalValue(`getComputedStyle(document.querySelector('[class*=appLayout]')).textShadow`);assert(!shadow.endsWith(' 0px 0px 0px'));
   assert.equal(await evalValue(`!!document.querySelector('[class*=languageWave]')`),false);
   assert.notEqual(await evalValue(`getComputedStyle(document.querySelector('button[aria-haspopup=menu] > span')).transform`),'none');
   assert.equal(await evalValue('document.documentElement.lang'),'sv');await wait(420);
   assert.equal(await evalValue('!!document.querySelector("[role=menu]")'),false);
   assert.equal(await evalValue(`Number(getComputedStyle(document.querySelector('[class*=appLayout]')).textShadow.endsWith(' 0px 0px 0px'))`),1);
   assert.equal(await evalValue(`document.getElementById('email').value`),'alex@example.com');
   await evalValue(`document.querySelector('button[aria-haspopup=menu]').click()`);await wait(50);
   await evalValue(`document.querySelectorAll('[role=menuitemradio]')[0].click()`);await wait(50);
   await evalValue(`document.querySelectorAll('[role=menuitemradio]')[1].click()`);await wait(450);
   assert.equal(await evalValue('document.documentElement.lang'),'sv');assert.equal(await evalValue(`Number(getComputedStyle(document.querySelector('[class*=appLayout]')).textShadow.endsWith(' 0px 0px 0px'))`),1);
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(50);
   await evalValue(`document.querySelector('button[aria-haspopup=menu]').click()`);await wait(50);await evalValue(`document.querySelectorAll('[role=menuitemradio]')[0].click()`);await wait(30);
   assert.equal(await evalValue('!!document.querySelector("[role=menu]")'),false);assert.equal(await evalValue(`Number(getComputedStyle(document.querySelector('[class*=appLayout]')).textShadow.endsWith(' 0px 0px 0px'))`),1);
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
   console.log('PASS language icon flip and text shadow, delayed checkmark dismissal, rapid changes, retained inputs and reduced motion',mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));await send('Page.navigate',{url:'about:blank'});await wait(200);await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='localization-states') {
  for(const language of (process.env.UI_CHECK_LANGUAGES?.split(',') ?? ['en','sv']))for(const mode of ['light','dark'])for(const width of [375,1440]) {
   await evalValue('localStorage.setItem("workout-language",'+JSON.stringify(language)+')');
   for(const name of ['library','history','public-templates','exercise-select']) {
    const route=routes.find(route=>route[0]===name);
    for(const state of ['loading','empty','error']) {
     await visit(route,mode,width,state);
     assert.equal(await evalValue('document.documentElement.lang'),language);
    }
   }
   await visit(routes.find(route=>route[0]==='login'),mode,width);
   await evalValue('document.querySelector("form").requestSubmit()');await wait(80);
   assert.equal(await evalValue('document.activeElement.id'),'email');
   assert(await evalValue('document.activeElement.getBoundingClientRect().top>=document.querySelector("nav").getBoundingClientRect().bottom'));
   assert(await evalValue('document.querySelector("[role=alert]").textContent.includes('+JSON.stringify(language==='sv'?'obligatoriskt':'is required')+')'));
   await evalValue('document.querySelector("button[aria-haspopup=menu]").click()');await wait(80);
   await evalValue('document.querySelector("h1").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}))');
   assert.equal(await evalValue('!!document.querySelector("[role=menu]")'),false);

   await evalValue(`(()=>{for(const [id,value] of [['email','alex@example.com'],['password','wrongpassword']]){const input=document.getElementById(id);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));} document.querySelector('form').requestSubmit()})()`);await wait(350);
   assert(await evalValue('document.querySelector("[role=alert]").textContent.includes('+JSON.stringify(language==='sv'?'Fel e-postadress':'Invalid email or password')+')'));
   assert.equal(await evalValue('document.querySelector("button[type=submit]").disabled'),false);
   assert.equal(await evalValue('document.getElementById("email").value'),'alex@example.com');
   console.log('PASS translated loading/empty/error states, mobile focus scrolling, and outside-click dismissal',language,mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Page.navigate',{url:'about:blank'});await wait(200);await send('Browser.close');return;
 }

 if(process.env.UI_CHECK_PHASE==='localization') {
  const english=require('../src/i18n/locales/en.json'),swedish=require('../src/i18n/locales/sv.json');
  const clickLanguage=async label=>{await evalValue(`document.querySelector('button[aria-haspopup="menu"]').click()`);await wait(80);await evalValue(`[...document.querySelectorAll('[role=menuitemradio]')].find(b=>b.textContent===${JSON.stringify(label)}).click()`);await wait(240);};
  guest=true;routePath='/login';await evalValue('localStorage.clear()');await send('Page.navigate',{url:base+'/login'});await wait(900);
  assert.equal(await evalValue('document.documentElement.lang'),'en');
  await evalValue('document.querySelector("form").requestSubmit()');await wait(100);
  assert.equal(await evalValue('document.activeElement.id'),'email');
  assert(await evalValue(`document.querySelector('[aria-invalid=true]').getAttribute('aria-describedby')`));
  await clickLanguage('Svenska');
  assert.equal(await evalValue('document.documentElement.lang'),'sv');
  assert(await evalValue(`document.querySelector('[role=alert]').textContent.includes('obligatoriskt')`));
  await evalValue(`(()=>{const input=document.getElementById('email');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'alex@example.com');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await wait(100);
  assert.equal(await evalValue(`document.getElementById('email').getAttribute('aria-invalid')`),null);
  await clickLanguage('English');assert.equal(await evalValue(`document.getElementById('email').value`),'alex@example.com');
  await evalValue(`document.querySelector('button[aria-haspopup=menu]').focus()`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown'});await wait(80);
  assert.equal(await evalValue('document.activeElement.getAttribute("role")'),'menuitemradio');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown'});
  assert.equal(await evalValue('document.activeElement.textContent'),'Svenska');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
  assert.equal(await evalValue('document.activeElement.getAttribute("aria-haspopup")'),'menu');
  assert.equal(await evalValue('!!document.querySelector("[role=menu]")'),false);
  await clickLanguage('Svenska');await send('Page.reload');await wait(900);assert.equal(await evalValue('document.documentElement.lang'),'sv');
  await evalValue(`localStorage.setItem('workout-language','unsupported')`);await send('Page.reload');await wait(900);assert.equal(await evalValue('document.documentElement.lang'),'en');
  const adminRoutes=['overview','users','exercises','templates','sessions'].map(section=>['admin-'+section,section==='overview'?'/admin':'/admin/'+section,false,'Admin dashboard']);
  for(const language of (process.env.UI_CHECK_LANGUAGES?.split(',') ?? ['en','sv'])) for(const mode of ['light','dark']) for(const width of [375,1440]) {
   await evalValue('localStorage.setItem("workout-language",'+JSON.stringify(language)+')');
   for(const route of [...routes,...adminRoutes]) {
    await visit(route,mode,width);
    assert.equal(await evalValue('document.documentElement.lang'),language);
    const text=await evalValue('document.body.innerText');
    assert(!/\b(?:common|Navbar|WorkoutPage|AdminPage)\.[a-zA-Z]/.test(text),'exposed translation key');
    if(language==='sv') assert(!/\b(?:Log in|Choose muscle groups|Create shared exercise|Search exercises|Account settings|No description\.)\b/.test(text),'English UI left on '+route[0]+': '+text);
   }
   console.log('PASS all routes translated',language,mode,width);
  }
  await evalValue(`localStorage.setItem('workout-language','en')`);await visit(routes.find(r=>r[0]==='workout'),'dark',375);
  await evalValue(`document.querySelector('button[aria-label="Complete set and start rest timer"]').click()`);await wait(400);
  await evalValue(`document.querySelector('button[aria-label="Pause workout timer"]').click();document.querySelector('button[aria-label="Pause rest timer"]').click()`);await wait(150);
  const before=await evalValue(`JSON.stringify([...document.querySelectorAll('input')].map(input=>input.value))`);
  await clickLanguage('Svenska');
  assert.equal(await evalValue('document.querySelectorAll("button[aria-pressed=true]").length'),1);
  assert.equal(await evalValue(`JSON.stringify([...document.querySelectorAll('input')].map(input=>input.value))`),before);
  assert(await evalValue(`!!document.querySelector('button[aria-label="Starta tr\u00e4ningstimern"]')`));
  assert(await evalValue(`!!document.querySelector('button[aria-label="Starta vilotimern"]')`));
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  console.log('PASS language persistence, keyboard, inline validation updates, retained inputs, checked sets and paused timers');
  await send('Page.navigate',{url:'about:blank'});await wait(200);await send('Browser.close');return;
 }

 if(process.env.UI_CHECK_PHASE==='exercise-ux') {
  for(const mode of ['light','dark'])for(const width of [320,390,844,1440]) {
   await visit(routes.find(r=>r[0]==='exercise-select'),mode,width);
   assert.equal(await evalValue(`[...document.querySelectorAll('[class*=cardDummy]')].every(e=>getComputedStyle(e).display==='none')`),width<=900);
   const selected=await evalValue('document.querySelectorAll("[role=button][aria-pressed=true]").length');
   assert(await evalValue(`!!(document.querySelector('[class*=pagination]').compareDocumentPosition(document.querySelector('[aria-labelledby="chosen-exercises-heading"]')) & Node.DOCUMENT_POSITION_FOLLOWING)`));
   await evalValue(`(()=>{const b=document.querySelector('button[aria-haspopup="dialog"]');b.focus();b.click();})()`);await wait(200);
   assert.equal(await evalValue('document.querySelectorAll("[role=dialog] input[type=radio]").length'),3);
   assert(await evalValue('document.documentElement.scrollWidth<=innerWidth+1'));
   await evalValue(`document.querySelector('[role=dialog] input[value=name]').click()`);await wait(700);
   assert.equal(await evalValue('!!document.querySelector("[role=dialog]")'),false);
   assert.equal(await evalValue('document.activeElement.getAttribute("aria-haspopup")'),'dialog');
   assert.equal(await evalValue('document.querySelectorAll("[role=button][aria-pressed=true]").length'),selected);
   assert(await evalValue('document.activeElement.getAttribute("aria-label").includes("Name")'));
   const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(process.env.TEMP,'exercise-ux-'+mode+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
   await visit(routes.find(r=>r[0]==='exercise-select'),mode,width,'loading');
   assert(await evalValue('document.documentElement.scrollWidth<=innerWidth+1'));
   console.log('PASS compact sorting, focus return, retained selection, responsive diagrams and skeletons',mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Page.navigate',{url:'about:blank'});await wait(200);await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='direct-start') {
  for(const mode of ['light','dark'])for(const width of [375,1440]) {
   draft.exercises[1].training={format:'cardio',durationSeconds:600};
   savedStatus='building';draftPurpose='workout';startFailure='';workoutRequests.length=0;mutationDelay=350;
   await visit(routes.find(r=>r[0]==='exercise-select'),mode,width);
   await evalValue(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Start workout');b.click();b.click();})()`);await wait(1400);
   assert.equal(await evalValue('location.pathname'),'/workout/'+draftId);
   assert.equal(workoutRequests.filter(r=>r.method==='PATCH' && r.path.endsWith('/exercises')).length,1);
   assert.equal(workoutRequests.filter(r=>r.path.endsWith('/start')).length,1);
   assert(await evalValue(`document.body.innerText.includes('Start cardio') && !!document.querySelector('button[aria-label="Complete set and start rest timer"]')`));
   await evalValue(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Intervals').click()`);await wait(150);
   assert.equal(await evalValue(`!!document.querySelector('[role=dialog] select[name="training.format"]')`),false);
   await evalValue(`document.querySelector('[role=dialog] form').requestSubmit()`);await wait(650);
   assert.equal(draft.exercises[1].training.format,'intervals');
   assert(await evalValue(`document.body.innerText.includes('Round 1 of 8')`));
   assert(await evalValue('document.documentElement.scrollWidth<=innerWidth+1'));
   console.log('PASS direct start, duplicate prevention, automatic mixed controls and optional intervals',mode);
   savedStatus='building';startFailure='reject';await visit(routes.find(r=>r[0]==='exercise-select'),mode,width);
   await evalValue(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Start workout').click()`);await wait(1500);
   assert.equal(await evalValue('location.pathname'),'/exercise-select/'+draftId);
   assert(await evalValue(`!![...document.querySelectorAll('button')].find(b=>b.textContent==='Start workout' && !b.disabled)`));
   startFailure='lost';await evalValue(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Start workout').click()`);await wait(1500);
   assert.equal(await evalValue('location.pathname'),'/workout/'+draftId);
   assert.equal(draft.exercises[1].training.format,'intervals');
   console.log('PASS failed start retry, lost response recovery and preserved training',mode);
   savedStatus='building';draftPurpose='template';await visit(routes.find(r=>r[0]==='exercise-select'),mode,width);
   await evalValue(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Review template').click()`);await wait(900);
   assert.equal(await evalValue('location.pathname'),'/workout-summary/'+draftId);
   assert(await evalValue(`document.body.innerText.includes('Save template') && !document.body.innerText.includes('Training format')`));
   console.log('PASS template review without mandatory training setup',mode);
   draftPurpose='workout';startFailure='';mutationDelay=0;
   for(const name of ['my-templates','public-templates','history','session-details']) {
    await visit(routes.find(r=>r[0]===name),mode,width);
    const starts=workoutRequests.filter(r=>r.path.endsWith('/start')).length;
    await evalValue(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(['history','session-details'].includes(name)?'Train again':'Start workout')}).click()`);await wait(800);
    assert.equal(await evalValue('location.pathname'),'/workout/'+draftId);
    assert.equal(workoutRequests.filter(r=>r.path.endsWith('/start')).length,starts+1);
    assert.equal(draft.exercises[1].training.format,'intervals');
    console.log('PASS prepared workout starts directly with saved settings',name,mode,width);
   }
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Page.navigate',{url:'about:blank'});await wait(200);await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='responsive-controls') {
  for(const mode of ['light','dark'])for(const width of [320,844]) {
   await visit(routes.find(route=>route[0]==='workout'),mode,width);
   await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
   await evalValue('document.querySelector("input").focus()');await wait(150);
   assert.equal(await evalValue('document.documentElement.dataset.viewportObstructed'),'true');
   await evalValue(`document.querySelector("input").blur();document.querySelector('[aria-label="Set rest duration"]').click()`);await wait(300);
   const dialog=await evalValue('(()=>{const d=document.querySelector("[role=dialog]");const r=d.getBoundingClientRect();return {width:r.width,height:r.height,viewport:visualViewport.height,overflow:document.documentElement.scrollWidth>innerWidth+1,scrollable:getComputedStyle(d).overflowY};})()');
   assert(!dialog.overflow);assert(dialog.height<=dialog.viewport+1);assert(dialog.width<=width);
   await send('Emulation.setPageScaleFactor',{pageScaleFactor:2});await wait(200);
   assert.equal(await evalValue('document.documentElement.dataset.viewportObstructed'),'true');
   assert(await evalValue('document.querySelector("[role=dialog]").getBoundingClientRect().height<=visualViewport.height+1'));
   await send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
   console.log('PASS touch focus, rest keypad, zoomed modal',mode,width);
   await visit(routes.find(route=>route[0]==='library'),mode,width,'loading');
   assert(await evalValue('!!document.querySelector("[role=status]")'));
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(150);
   assert.equal(await evalValue('Number(getComputedStyle(document.querySelector("[class*=pulse]")).opacity)'),0);
   for(let attempt=0;attempt<20 && await evalValue('document.querySelectorAll("[class*=shape]").length');attempt++)await wait(400);
   assert.equal(await evalValue('document.querySelectorAll("[class*=shape]").length'),0);
   await evalValue('(()=>{const e=document.querySelector("input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,"test");e.dispatchEvent(new Event("input",{bubbles:true}));})()');await wait(500);
   assert.equal(await evalValue('document.querySelectorAll("[class*=shape]").length'),0);
   assert(await evalValue('document.querySelectorAll("article").length>0'));
   await send('Emulation.setEmulatedMedia',{features:[]});
   console.log('PASS accessible skeletons, reduced motion and retained background refresh',mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='responsive-auth') {
  for(const mode of ['light','dark'])for(const width of [320,390,844,1440])for(const name of ['login','signup'])await visit(routes.find(route=>route[0]===name),mode,width,'auth-loading');
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  console.log('PASS responsive auth skeletons');
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='responsive-audit') {
  const loadingRoutes = new Set(['exercise-select','workout-summary','workout','result','library','exercise-details','edit-exercise','public-templates','my-templates','public-template-details','my-template-details','history','session-details','my-exercises']);
  for (const mode of ['light','dark']) for (const width of [320,390,844,1440]) {
   for (const route of routes) await visit(route,mode,width);
   for (const route of routes.filter(route=>loadingRoutes.has(route[0]))) await visit(route,mode,width,'loading');
  }
  for(const mode of ['light','dark'])for(const width of [320,844])for(const name of ['library','public-templates','my-templates','history','my-exercises','session-details']) {
   const route=routes.find(route=>route[0]===name);
   for(const state of ['empty','error'])await visit(route,mode,width,state);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  console.log('PASS responsive route/skeleton/empty/error audit in both themes, narrow portrait, landscape and desktop');
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='form-errors') {
  const set = async (selector,value) => { await evalValue(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});const p=e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);await wait(30); };
  const submit = async (selector='form') => {await evalValue(`document.querySelector(${JSON.stringify(selector)}).requestSubmit()`);await wait(450);};
  for(const mode of ['light','dark'])for(const width of [375,844,1440]) {
   await visit(routes.find(r=>r[0]==='signup'),mode,width);
   assert.equal(await evalValue('document.querySelectorAll("[aria-invalid=true]").length'),0);
   await submit();
   assert.equal(await evalValue('document.activeElement.id'),'name');
   assert.equal(await evalValue('document.querySelectorAll(".inline-field-error").length'),4);
   assert.equal(requestCounts.get('POST:/api/users')||0,0);
   await set('#name','Alex');assert.equal(await evalValue('document.querySelector("#name").hasAttribute("aria-invalid")'),false);
   await set('#email','not-an-email');await set('#username','ab');await set('#password','short');await submit();
   assert.equal(await evalValue('document.activeElement.id'),'email');
   assert.match(await evalValue('document.getElementById(document.activeElement.getAttribute("aria-describedby")).textContent'),/valid email/);
   await set('#email','alex@example.com');await set('#username','alex');await set('#password','secret123');
   formFailure='field';mutationDelay=700;
   const before=requestCounts.get('POST:/api/users')||0;
   await evalValue('document.querySelector("form").requestSubmit();document.querySelector("form").requestSubmit()');await wait(150);
   assert(await evalValue('document.querySelector("button[type=submit]").disabled'));
   await wait(1000);assert.equal(requestCounts.get('POST:/api/users'),before+1);
   assert.equal(await evalValue('document.activeElement.id'),'name','API field focus follows visual order, not response order');
   assert.equal(await evalValue('document.querySelector("#password").value'),'secret123');
   assert.equal(await evalValue('document.querySelector("button[type=submit]").disabled'),false);
   const visible=await evalValue('(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),m=document.getElementById(e.getAttribute("aria-describedby")).getBoundingClientRect();return {top:r.top,bottom:m.bottom,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1};})()');
   assert(visible.top>=0 && visible.bottom<=visible.height && !visible.overflow,JSON.stringify(visible));
   await set('#name','Alex Smith');assert.equal(await evalValue('document.activeElement.id'),'name');
   await set('#email','other@example.com');
   formFailure='server';mutationDelay=0;await submit();await wait(200);
   assert(await evalValue('document.querySelector("form").innerText.includes("Please try again")'));
   assert(!(await evalValue('document.body.innerText.includes("MongoServerError")')));
   assert.equal(await evalValue('document.querySelectorAll(".inline-field-error").length'),0);
   formFailure='network';await submit();await wait(200);
   assert(await evalValue('document.querySelector("form").innerText.includes("Check your connection")'));
   // A new document resets request counters used by the initial no-request assertion.
   requestCounts.delete('POST:/api/users');
   await visit(routes.find(r=>r[0]==='settings'),mode,width);
   await set('#newPassword','secret123');await set('#confirmPassword','different');await set('#currentPassword','old123');
   await submit('form:has(#newPassword)');assert.equal(await evalValue('document.activeElement.id'),'confirmPassword');
   assert.match(await evalValue('document.getElementById(document.activeElement.getAttribute("aria-describedby")).textContent'),/same password/);
   await set('#confirmPassword','secret123');assert.equal(await evalValue('document.querySelector("#confirmPassword").hasAttribute("aria-invalid")'),false);
   console.log('PASS inline validation, API mapping, correction, pending, values, scroll and password confirmation',mode,width);
  }
  for(const mode of ['light','dark']) {
   await visit(routes.find(r=>r[0]==='create-exercise'),mode,375);
   await submit();assert.equal(await evalValue('document.activeElement.id'),'name');
   await set('#name','Press');formFailure='mixed';await submit();await wait(200);
   assert.equal(await evalValue('document.activeElement.id'),'name');
   assert(await evalValue('document.querySelector("form").innerText.includes("This record is unavailable")'));
   await visit(['admin-exercises','/admin/exercises',false,'Admin dashboard'],mode,375);
   await evalValue('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Create shared exercise").click()');await wait(250);
   await submit('[role=dialog] form');assert.equal(await evalValue('document.activeElement.name'),'name');
   await evalValue('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent.trim()==="Cancel").click()');await wait(250);
   await visit(['admin-templates','/admin/templates',false,'Admin dashboard'],mode,375);
   await evalValue('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Create shared template").click()');await wait(250);
   await evalValue('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent.trim()==="Add exercise").click()');await wait(100);
   await set('[role=dialog] select[name$="training.format"]','intervals');
   assert.equal(await evalValue('document.querySelectorAll(".inline-field-error").length'),0);
   await set('[role=dialog] input[name$="training.rounds"]','0');
   await evalValue('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent.trim()==="Save configuration").click()');await wait(400);
   assert.equal(await evalValue('document.activeElement.name'),'exercises.0.training.rounds');
   assert.equal(await evalValue('document.querySelectorAll("form form").length'),0);
   await set('[role=dialog] input[name$="training.rounds"]','8');assert.equal(await evalValue('document.activeElement.hasAttribute("aria-invalid")'),false);
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
   await visit(routes.find(r=>r[0]==='workout'),mode,375);
   await evalValue(`document.querySelector('[aria-label="Set rest duration"]').click()`);await wait(250);
   assert.equal(await evalValue('document.querySelectorAll(".inline-field-error").length'),0);
   await set('[role=dialog] input[name=minutes]','0');await set('[role=dialog] input[name=seconds]','65');
   await submit('[role=dialog] form');assert.equal(await evalValue('document.activeElement.name'),'seconds');
   assert.match(await evalValue('document.getElementById(document.activeElement.getAttribute("aria-describedby")).textContent'),/0 and 59/);
   await set('[role=dialog] input[name=seconds]','0');await submit('[role=dialog] form');
   assert.match(await evalValue('document.getElementById(document.activeElement.getAttribute("aria-describedby")).textContent'),/between 1 second and 24 hours/);
   // Correct with the on-screen keypad, whose updates do not emit native input events.
   await evalValue('document.querySelector("input[name=minutes]").focus();[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent.trim()==="3").click()');await wait(100);
   assert.equal(await evalValue('document.querySelectorAll(".inline-field-error").length'),0);
   await submit('[role=dialog] form');assert.equal(await evalValue('!!document.querySelector("[role=dialog]")'),false);
   await send('Emulation.setEmulatedMedia',{features:[]});
   console.log('PASS exercise/admin forms, embedded training, reduced motion and keypad corrections',mode);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='auth-design') {
  for(const mode of ['light','dark'])for(const width of [320,375,1440])for(const name of ['login','signup']) {
   await visit(routes.find(r=>r[0]===name),mode,width);
   await evalValue('document.querySelector("form input").focus()');
   assert.equal(await evalValue('getComputedStyle(document.querySelector("form input")).borderBottomWidth'),'2px');
   assert.equal(await evalValue('getComputedStyle(document.querySelector("form input").parentElement).outlineStyle'),'none');
   mutationDelay=700;
   await evalValue('(()=>{for(const input of document.querySelectorAll("form input")){const value=input.type==="email"?"alex@example.com":input.type==="password"?"secret123":"Alex";Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,value);input.dispatchEvent(new Event("input",{bubbles:true}));}document.querySelector("form").requestSubmit();})()');
   await wait(150);assert(await evalValue('document.querySelector("button[type=submit]").disabled'));
   await wait(900);assert(await evalValue('!!document.querySelector("form [role=alert]")'));
   assert.equal(await evalValue('document.querySelector("button[type=submit]").disabled'),false);
   assert(await evalValue('document.documentElement.scrollWidth<=innerWidth+1'));
   mutationDelay=0;
   await evalValue('document.querySelector("[class*=bottomText] button").click()');await wait(700);
   assert.equal(await evalValue('location.pathname'),name==='login'?'/signup':'/login');
   console.log('PASS sliced auth focus, pending, errors and switching',name,mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='animation-additions') {
  const click = async text => { await evalValue('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+').click()'); await wait(300); };
  for(const mode of ['light','dark'])for(const width of [375,1440]) {
   await evalValue('localStorage.clear();sessionStorage.clear()');
   await visit(routes.find(r=>r[0]==='workout'),mode,width);
   const card='document.querySelector("[class*=exerciseCard]")';
   const rowCount=await evalValue(card+'.querySelectorAll("[data-completed]").length');
   await click('Add set');
   assert.equal(await evalValue(card+'.querySelectorAll("[data-completed]").length'),rowCount+1);
   await evalValue(card+'.querySelectorAll("button[aria-label^=Remove]")[3].click()');await wait(350);
   assert.equal(await evalValue(card+'.querySelectorAll("[data-completed]").length'),rowCount);
   await evalValue(card+'.querySelector("[aria-expanded]").click()');await wait(300);
   assert.equal(await evalValue(card+'.querySelector("[aria-expanded]").getAttribute("aria-expanded")'),'false');
   assert.equal(await evalValue('Math.round('+card+'.querySelector("[id^=sets-]").getBoundingClientRect().height)'),0);
   assert(await evalValue(card+'.querySelector("[id^=sets-]").inert'));
   await evalValue(card+'.querySelector("[aria-expanded]").click()');await wait(300);
   assert((await evalValue(card+'.querySelector("[id^=sets-]").getBoundingClientRect().height'))>100);
   await evalValue('window.dispatchEvent(new Event("rest-timer-completed"))');await wait(100);
   assert((await evalValue('new DOMMatrix(getComputedStyle(document.querySelector("footer strong[class*=time]")).transform).a'))>1);
   await wait(450);
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(50);
   await evalValue('window.dispatchEvent(new Event("rest-timer-completed"))');await wait(100);
   assert.equal(await evalValue('new DOMMatrix(getComputedStyle(document.querySelector("footer strong[class*=time]")).transform).a'),1);
   await send('Emulation.setEmulatedMedia',{features:[]});
   await click('End Workout');
   assert(await evalValue('document.querySelector("[role=dialog]").contains(document.activeElement)'));
   await click('Close');await wait(200);
   assert.equal(await evalValue('!!document.querySelector("[role=dialog]")'),false);
   for(const resource of ['exercises','templates','sessions']) {
    await visit(['admin-'+resource,'/admin/'+resource,false,'Admin dashboard'],mode,width);
    await click(resource==='sessions'?'Create workout record':resource==='templates'?'Create shared template':'Create shared exercise');
    if(resource!=='exercises') await click('Add exercise');
    const info=await evalValue('(()=>{const d=document.querySelector("[role=dialog]");return {overflow:document.documentElement.scrollWidth>innerWidth+1,fonts:[...d.querySelectorAll("input:not([type=checkbox]),select")].map(e=>parseFloat(getComputedStyle(e).fontSize)),fields:d.querySelectorAll("fieldset").length};})()');
    assert(!info.overflow);assert(info.fonts.every(x=>x>=16));assert(info.fields>0);
    const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(process.env.TEMP,'motion-admin-'+resource+'-'+mode+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
    await click('Cancel');await wait(200);
    await click('Details');
    assert(await evalValue('!!document.querySelector("[role=dialog] dl")'));
   }
   console.log('PASS new Motion interactions and admin editors',mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='rest-duration') {
  for(const mode of ['light','dark'])for(const width of [375,1440]) {
   await evalValue('localStorage.clear();sessionStorage.clear()');
   await visit(routes.find(r=>r[0]==='workout'),mode,width);
   assert.equal(await evalValue('document.querySelector("footer [class*=label]").textContent.trim()'),'Rest');
   assert.equal(await evalValue('document.querySelectorAll("footer button").length'),3);
   const click = async label => { await evalValue('document.querySelector('+JSON.stringify('button[aria-label="'+label+'"]')+').click()');await wait(250); };
   const setDuration = async seconds => {
    await click('Set rest duration');
    for(const [label,value] of [['Minutes',Math.floor(seconds/60)],['Seconds',seconds%60]]) {
     await evalValue('document.querySelector('+JSON.stringify('[role=dialog] input[aria-label="'+label+'"]')+').click()');
     for(const digit of String(value)) { await evalValue('[...document.querySelectorAll("[role=dialog] button")].find(b=>b.textContent.trim()==='+JSON.stringify(digit)+').click()');await wait(30); }
    }
    const modal=await evalValue('(()=>{const d=document.querySelector("[role=dialog]");const fields=[...d.querySelectorAll("input")].map(e=>e.getBoundingClientRect().toJSON());return {fields,scroll:document.documentElement.scrollWidth,width:innerWidth};})()');
    assert.equal(modal.fields.length,2);assert.equal(modal.fields[0].top,modal.fields[1].top);assert(modal.scroll<=modal.width+1);
    const preview=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(process.env.TEMP,'rest-keypad-'+mode+'-'+width+'.png'),Buffer.from(preview.data,'base64'));
    await evalValue('document.querySelector("[role=dialog] form").requestSubmit()');await wait(250);
   };
   const time = () => evalValue('document.querySelector("footer strong").textContent.trim()');
   await setDuration(180);assert.equal(await time(),'03:00');
   await click('Start rest timer');await wait(1100);
   await click('Pause rest timer');const paused=await time();await wait(1100);assert.equal(await time(),paused);
   await send('Page.reload');await wait(1000);assert.equal(await time(),paused);
   assert(await evalValue('!!document.querySelector("button[aria-label=\\"Start rest timer\\"]")'));
   await click('Reset rest timer');assert.equal(await time(),'03:00');
   await send('Page.reload');await wait(1000);assert.equal(await time(),'03:00');
   await evalValue('document.querySelector("button[aria-pressed]").click()');await wait(300);
   assert(await evalValue('!!document.querySelector("button[aria-label=\\"Pause rest timer\\"]")'));
   assert.equal(await time(),'03:00');
   await setDuration(240);assert.equal(await time(),'04:00');
   assert(await evalValue('!!document.querySelector("button[aria-label=\\"Pause rest timer\\"]")'));
   await click('Pause rest timer');await click('Reset rest timer');assert.equal(await time(),'04:00');
   assert(await evalValue('document.documentElement.scrollWidth<=innerWidth+1'));
   const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(process.env.TEMP,'rest-controls-'+mode+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
   console.log('PASS three rest controls, configured duration, pause, reload, set restart',mode,width);
  }
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='motion') {
  const row='document.querySelector("[data-completed]")';
  const card=row+'.closest("[data-exercise-completed]")';
  const fill=card+'.querySelector("[class*=exerciseCompletedFill]")';
  const ring=row+'.querySelector("[data-completion-ring]")';
  const complete=row+'.querySelector("button[aria-pressed]")';
  for(const mode of ['light','dark'])for(const width of [375,1440]) {
   await evalValue('localStorage.clear();sessionStorage.clear()');
   await visit(routes.find(r=>r[0]==='workout'),mode,width);
   const timerColors=await evalValue('(()=>{const button=document.querySelector("footer .button--secondary");const probe=document.createElement("i");probe.style.color="var(--color-blue-text)";button.parentElement.append(probe);const result={actual:getComputedStyle(button).color,expected:getComputedStyle(probe).color};probe.remove();return result;})()');
   assert.equal(timerColors.actual,timerColors.expected,'footer must preserve the timer button variant text color');
   assert.equal(await evalValue(row+'.dataset.completed'),'false');
   const bounds=await evalValue('JSON.stringify('+row+'.getBoundingClientRect().toJSON())');
   await evalValue(complete+'.click()');
   for(let i=0;i<100 && await evalValue(row+'.dataset.completed')!=='true';i++)await wait(10);
   assert.equal(await evalValue(card+'.dataset.exerciseCompleted'),'false','one completed set must not fill the card');
   assert.equal(await evalValue('getComputedStyle('+fill+').clipPath'),'polygon(0% 100%, 0% 100%, 0% 100%)');
   assert.equal(await evalValue(row+'.querySelectorAll("[class*=Fill]").length'),0,'individual sets must not fill');
   await evalValue('(()=>{const buttons='+card+'.querySelectorAll("button[aria-pressed]");buttons[1].click();buttons[2].click();})()');
   for(let i=0;i<100 && await evalValue(card+'.dataset.exerciseCompleted')!=='true';i++)await wait(10);
   await wait(80);
   const middle=await evalValue('({ring:Number(getComputedStyle('+ring+').opacity),green:getComputedStyle('+fill+').backgroundColor,clip:getComputedStyle('+fill+').clipPath})');
   assert.notEqual(middle.clip,'polygon(0% -100%, 200% 100%, 0% 100%)','fill jumped directly to completed state');
   assert.notEqual(middle.clip,'polygon(0% 100%, 0% 100%, 0% 100%)','fill did not start');
   assert(middle.ring>0,'user completion did not celebrate');
   await wait(500);
   assert.equal(await evalValue('getComputedStyle('+fill+').clipPath'),'polygon(0% -100%, 200% 100%, 0% 100%)');
   assert.equal(await evalValue('Number(getComputedStyle('+ring+').opacity)'),0);
   assert.equal(await evalValue('JSON.stringify('+row+'.getBoundingClientRect().toJSON())'),bounds,'completion shifted layout');
   const shot=await send('Page.captureScreenshot',{format:'png'});
   fs.writeFileSync(path.join(process.env.TEMP,'motion-completion-'+mode+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
   await evalValue(complete+'.click()');await wait(240);
   assert.equal(await evalValue('Number(getComputedStyle('+ring+').opacity)'),0,'completed click replayed celebration');
   await send('Page.reload');await wait(1000);
   assert.equal(await evalValue('getComputedStyle('+fill+').clipPath'),'polygon(0% -100%, 200% 100%, 0% 100%)');
   assert.equal(await evalValue('Number(getComputedStyle('+ring+').opacity)'),0,'restoration replayed celebration');
   await evalValue('(()=>{const input='+row+'.querySelector("input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"45");input.dispatchEvent(new Event("input",{bubbles:true}));})()');await wait(60);
   assert.equal(await evalValue(row+'.dataset.completed'),'false');
   await wait(500);
   assert.equal(await evalValue('getComputedStyle('+fill+').clipPath'),'polygon(0% 100%, 0% 100%, 0% 100%)');
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(30);
   await evalValue(complete+'.click();'+complete+'.click()');await wait(300);
   assert.equal(await evalValue(row+'.dataset.completed'),'true');
   assert.equal(await evalValue('getComputedStyle('+fill+').clipPath'),'polygon(0% -100%, 200% 100%, 0% 100%)');
   assert.equal(await evalValue('Number(getComputedStyle('+ring+').opacity)'),0);
   assert(await evalValue('document.documentElement.scrollWidth<=innerWidth+1'));
   await send('Emulation.setEmulatedMedia',{features:[]});
   await evalValue('[...'+card+'.querySelectorAll("button")].find(b=>b.textContent.trim()==="Add set").click()');await wait(500);
   assert.equal(await evalValue(card+'.dataset.exerciseCompleted'),'false','new incomplete set must clear the card fill');
   await evalValue('(()=>{const buttons='+card+'.querySelectorAll("button[aria-label=\\"Remove set\\"]");buttons[buttons.length-1].click();})()');await wait(600);
   assert.equal(await evalValue(card+'.dataset.exerciseCompleted'),'true','removing the incomplete set must recompute completion');
   console.log('PASS Motion completion: whole-card bottom-up fill/pop, undo, repeated clicks, restoration, reduced motion and stable layout',mode,width,middle.green);
  }
  for(const mode of ['light','dark'])for(const width of [375,1440]) {
   await visit(routes.find(r=>r[0]==='workout-select'),mode,width);
   await evalValue('document.querySelector("[role=button][aria-pressed]").click()');await wait(300);
   const selected=await evalValue('(()=>{const card=document.querySelector("[aria-pressed=true]");const probe=document.createElement("i");probe.style.color="var(--color-accent)";document.body.append(probe);const result={border:getComputedStyle(card).borderTopColor,expected:getComputedStyle(probe).color,shadow:getComputedStyle(card).boxShadow};probe.remove();return result;})()');
   assert.equal(selected.border,selected.expected,'Motion selection border lost its semantic color');
   assert.notEqual(selected.shadow,'none','Motion selection shadow was not restored');
   await visit(routes.find(r=>r[0]==='login'),mode,width);
   await evalValue('document.getElementById("email").focus()');await wait(240);
   assert.notEqual(await evalValue('getComputedStyle(document.getElementById("email")).boxShadow'),'none','pointer/programmatic focus lost its indicator');
   await evalValue('document.getElementById("email").blur()');await wait(240);
   const clearedShadow=await evalValue('getComputedStyle(document.getElementById("email")).boxShadow');
   assert(clearedShadow==='none' || /^rgba\([^)]*, 0\) 0px 0px 0px 0px$/.test(clearedShadow),'focus shadow remained visible after blur');
   await visit(routes.find(r=>r[0]==='settings'),mode,width);
   const point=await evalValue('(()=>{const rect=document.querySelector("[class*=sideNav] a[href=\\"/profile/workouts\\"]").getBoundingClientRect();return {x:rect.x+rect.width/2,y:rect.y+rect.height/2};})()');
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await wait(250);
   const offset=await evalValue('new DOMMatrix(getComputedStyle(document.querySelector("[class*=sideNav] a[href=\\"/profile/workouts\\"]")).transform).m41');
   assert(Math.abs(offset-(width>850?3:0))<0.1,'navigation hover lost its responsive offset');
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
   console.log('PASS declarative Motion selection and focus styles',mode,width);
  }
  await visit(routes.find(r=>r[0]==='workout'),'light',375);
  await evalValue('document.querySelector("button[aria-label^=Reorder]").focus()');
  for(const key of [' ','ArrowDown',' ']) {
   await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key===' '?'Space':key});
   await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key===' '?'Space':key});await wait(250);
  }
  assert(await evalValue('document.querySelector("[class*=exerciseCard] h2").textContent.includes("Seated cable row")'),'keyboard sorting failed');
  await visit(routes.find(r=>r[0]==='library'),'light',375);
  await evalValue('document.querySelector("[class*=pagination]").scrollIntoView({behavior:"instant"})');
  const beforeScroll=await evalValue('document.scrollingElement.scrollTop');
  assert(beforeScroll>100);
  await evalValue('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Next").click()');await wait(80);
  const middleScroll=await evalValue('document.scrollingElement.scrollTop');
  assert(middleScroll<beforeScroll && middleScroll>10,'pagination did not scroll continuously');
  await wait(500);
  assert((await evalValue('document.scrollingElement.scrollTop'))<middleScroll);
  console.log('PASS Motion keyboard sorting and pagination scroll');
  assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='workout-migration') {
  const click=async text=>{await evalValue('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+').click()');await wait(100);};
  for(const mode of ['light','dark']) {
   savedStatus='active';await evalValue('localStorage.clear();sessionStorage.clear()');
   await visit(routes.find(r=>r[0]==='workout'),mode,375);
   await evalValue('document.querySelector("button[aria-label=\\"Complete set and start rest timer\\"]").click()');await wait(400);
   await evalValue('document.querySelector("button[aria-label=\\"Pause workout timer\\"]").click();document.querySelector("button[aria-label=\\"Pause rest timer\\"]").click()');
   await evalValue('document.querySelector("a[href=\\"/library\\"]").click()');await wait(500);
   assert.equal(await evalValue('location.pathname'),'/library');
   await evalValue('history.back()');await wait(700);
   assert.equal(await evalValue('location.pathname'),'/workout/'+draftId);
   assert(await evalValue('!!document.querySelector("button[aria-label=\\"Start workout timer\\"]")'),'route navigation restarted paused duration');
   assert(await evalValue('!!document.querySelector("[aria-pressed=true]")'),'route navigation lost checked set');
   await click('End Workout');
   const before=workoutRequests.length;loseCompletion=mode==='dark';mutationDelay=200;
   await evalValue('document.querySelector("[role=dialog] .button--success").click()');await wait(100);
   assert(await evalValue('[...document.querySelectorAll("button")].filter(b=>/^(End Workout|Abandon Workout)$/.test(b.textContent)).every(b=>b.disabled)'));
   await wait(1700);mutationDelay=0;
   assert.equal(await evalValue('location.pathname'),'/workout-result/'+sessions[0]._id);
   const writes=workoutRequests.slice(before),complete=writes.findIndex(r=>r.path.endsWith('/complete'));
   assert(complete>0 && writes.slice(0,complete).filter(r=>r.method==='PATCH').length===3,'final set saves must precede completion');
   assert.equal(writes.filter(r=>r.path.endsWith('/complete')).length,1,'completion retried');
   assert(await evalValue('!localStorage.getItem("workout-current:'+userId+'")'),'completion retained workout reference');
   assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
   console.log('PASS client navigation/back preserves checked sets and paused timers; ordered completion, lost-response recovery and cleanup',mode);
  }
  savedStatus='active';await evalValue('localStorage.clear();sessionStorage.clear()');
  await visit(routes.find(r=>r[0]==='workout'), 'light',375);
  await click('Abandon Workout');await evalValue('document.querySelector("[role=dialog] .button--danger").click()');await wait(700);
  assert.equal(await evalValue('location.pathname'),'/workout-select');
  assert(await evalValue('!localStorage.getItem("workout-current:'+userId+'")'));
  console.log('PASS abandonment navigates to selection and clears reference');
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='query-migration') {
  const originalExercises=structuredClone(exercises),originalSessions=structuredClone(sessions);
  async function go(pathname) {routePath=pathname;await evalValue('history.pushState(null,"",'+JSON.stringify(pathname)+');window.dispatchEvent(new PopStateEvent("popstate"))');await wait(500);}
  async function enter(selector,value) {await evalValue('(()=>{const input=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,'+JSON.stringify(value)+');input.dispatchEvent(new Event("input",{bubbles:true}));})()');await wait(50);}
  for(const mode of ['light','dark']) {
   exercises.splice(0,exercises.length,...structuredClone(originalExercises));sessions.splice(0,sessions.length,...structuredClone(originalSessions));
   await visit(routes.find(r=>r[0]==='library'),mode,375);
   await go('/edit-exercise/'+exerciseId);
   await enter('#name','Unsaved exercise name');
   const readKey='GET:/api/exercises/library/'+exerciseId, beforeReads=requestCounts.get(readKey)||0;
   await evalValue('window.dispatchEvent(new Event("offline"))');await wait(50);await evalValue('window.dispatchEvent(new Event("online"))');await wait(500);
   assert((requestCounts.get(readKey)||0)>beforeReads,'background refetch did not run');
   assert.equal(await evalValue('document.querySelector("#name").value'),'Unsaved exercise name','refetch overwrote local form');
   mutationDelay=300;
   await evalValue('document.querySelector("form").requestSubmit()');await wait(100);
   assert(await evalValue('document.querySelector("button[type=submit]").disabled'));
   await wait(750);mutationDelay=0;
   await go('/library');assert(await evalValue('document.body.innerText.toLowerCase().includes("unsaved exercise name")'),'edit did not invalidate cached library');
   await go('/profile/exercises');
   const deleteKey='DELETE:/api/exercises/'+exerciseId,beforeDeletes=requestCounts.get(deleteKey)||0;
   await evalValue('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Delete").click()');await wait(100);
   await evalValue('document.querySelector("[role=dialog] .button--danger").click()');await wait(650);
   assert.equal(requestCounts.get(deleteKey),beforeDeletes+1);
   assert(await evalValue('!document.body.innerText.toLowerCase().includes("unsaved exercise name")'),'deleted exercise remained visible');
   await go('/library');assert.equal(await evalValue('document.querySelectorAll("article").length'),2,'delete did not invalidate library');
   await go('/profile/workouts');await evalValue('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Delete").click()');await wait(650);
   assert.equal(sessions.length,1);assert.equal(await evalValue('document.querySelectorAll("[class*=sessionCard]").length'),1,'deleted session remained cached');
   assert.equal(browserErrors.length,0);
   console.log('PASS query migration: unsaved edit survives refetch; edit/delete invalidate caches; session deletion updates history',mode);
  }
  await send('Fetch.disable');await send('Browser.close');return;
 }
 if(process.env.UI_CHECK_PHASE==='recovery') {for(const mode of ['light','dark'])for(const width of [375,1440])await checkRecovery(mode,width);await wait(1000);await send('Fetch.disable');await send('Browser.close');return;}
 if(process.env.UI_CHECK_PHASE!=='interactions')for(const mode of ['light','dark'])for(const width of (process.env.UI_CHECK_WIDTHS?.split(',').map(Number) || [375,1440]))for(const route of routes.filter(routeMatches))await visit(route,mode,width);
 if(process.env.UI_CHECK_PHASE==='populated'){assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));console.log('PASS: populated routes in both themes and viewport sizes');await send('Fetch.disable');await send('Browser.close');return;}
 const asyncNames=['exercise-select','workout-summary','workout','result','library','exercise-details','edit-exercise','public-templates','my-templates','public-template-details','my-template-details','history','session-details','my-exercises'];
 const emptyNames=['exercise-select','public-template-details','my-template-details','result','session-details','workout-summary','library','public-templates','my-templates','history','my-exercises'];
 if(process.env.UI_CHECK_PHASE!=='interactions')for(const mode of ['light','dark']) {
  for(const route of routes.filter(r=>routeMatches(r) && asyncNames.includes(r[0]))) {await visit(route,mode,375,'loading');await wait(2300);await visit(route,mode,375,'error');}
  for(const route of routes.filter(r=>routeMatches(r) && emptyNames.includes(r[0]))) {await visit(route,mode,375,'empty');assert(!await evalValue("document.querySelector('[class*=shape]')!==null"));}
 }
 if(process.env.UI_CHECK_PHASE==='pages'){assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));console.log('PASS: targeted routes and applicable states');await wait(1000);await send('Fetch.disable');await send('Browser.close');return;}
 if(!process.env.UI_CHECK_PHASE)for(const mode of ['light','dark'])await checkRecovery(mode);
 // Check keyboard selection, menus, every destructive dialog, and pending/error form feedback.
 for(const mode of ['light','dark']) {
  await visit(routes.find(r=>r[0]==='workout-select'),mode,375);
  assert(await evalValue("document.querySelector('button.button--primary').disabled"));
  await evalValue("document.querySelector('[role=button][aria-pressed]').focus()");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space'});
  assert(await evalValue("!!document.querySelector('[aria-pressed=true]')"));
  await evalValue("document.querySelector('[aria-label=\"Open menu\"]').click()");
  assert(await evalValue("document.querySelector('[aria-controls=\"mobile-menu\"]').getAttribute('aria-expanded')==='true'"));
  await evalValue("document.querySelector('[aria-label=\"Close menu\"]').click()");
  for(const [name,label] of [['my-templates','Delete'],['my-exercises','Delete'],['settings','Delete account'],['workout','Abandon Workout']]) {
   await visit(routes.find(r=>r[0]===name),mode,375);
   await evalValue("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==="+JSON.stringify(label)+").focus();document.activeElement.click()");await wait(100);
   assert(await evalValue("!!document.querySelector('[role=dialog][aria-modal=true][aria-labelledby]')"));
   assert(await evalValue("document.querySelector('[role=dialog]').contains(document.activeElement)"));
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',modifiers:8});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',modifiers:8});
   assert(await evalValue("document.querySelector('[role=dialog]').contains(document.activeElement)"));
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});await wait(220);
   assert(await evalValue("!document.querySelector('[role=dialog]')"));
   assert.equal(await evalValue("document.activeElement.textContent.trim()"),label);
  }
  await visit(routes.find(r=>r[0]==='template-summary'),mode,375);
  await evalValue("[...document.querySelectorAll('button')].find(b=>b.textContent==='Save template').click()");
  assert(await evalValue("!!document.querySelector('[role=dialog] input')"));
  scenario='error';mutationDelay=900;
  await evalValue("(()=>{const input=document.querySelector('[role=dialog] input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'My training routine');input.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('save-template-form').requestSubmit()})()");await wait(150);
  assert(await evalValue("document.querySelector('[role=dialog] button[type=submit]').disabled"));await wait(1100);
  assert(await evalValue("!!document.querySelector('[role=dialog] [role=alert]')"));scenario='populated';mutationDelay=0;
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
  await visit(routes.find(r=>r[0]==='login'),mode,375);mutationDelay=900;
  await evalValue("(()=>{for(const [id,value] of [['email','alex@example.com'],['password','secret123']]){const input=document.getElementById(id);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));} document.querySelector('form').requestSubmit();})()");await wait(150);
  assert(await evalValue("document.querySelector('button[type=submit]').disabled"));await wait(1100);
  assert(await evalValue("!!document.querySelector('[role=alert]')"));mutationDelay=0;
  for(const name of ['create-exercise','edit-exercise']) {
   await visit(routes.find(r=>r[0]===name),mode,375);scenario='error';mutationDelay=900;
   await evalValue("(()=>{const input=document.getElementById('name');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Custom cable row');input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('form').requestSubmit()})()");await wait(150);
   assert(await evalValue("document.querySelector('button[type=submit]').disabled"));await wait(1100);
   assert(await evalValue("!!document.querySelector('[role=alert]')"));scenario='populated';mutationDelay=0;
  }
  await visit(routes.find(r=>r[0]==='workout'),mode,375);scenario='error';mutationDelay=900;
  await evalValue("[...document.querySelectorAll('button')].find(b=>b.textContent==='Abandon Workout').click()");await wait(100);await evalValue("document.querySelector('[role=dialog] .button--danger').click()");await wait(150);
  assert(await evalValue("[...document.querySelectorAll('button')].filter(b=>/^(End Workout|Abandon Workout)$/.test(b.textContent)).every(b=>b.disabled)"));await wait(1100);
  assert(await evalValue("!!document.querySelector('[role=dialog] [role=alert]') && [...document.querySelectorAll('input')].filter(input=>/^(Weight|Reps) for /.test(input.getAttribute('aria-label')||'')).length===18"));scenario='populated';mutationDelay=0;
  await visit(routes.find(r=>r[0]==='settings'),mode,375);
  await evalValue("(()=>{for(const [id,value] of [['currentPassword','oldpassword'],['newPassword','secret123'],['confirmPassword','different']]){const input=document.getElementById(id);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));}document.getElementById('currentPassword').closest('form').requestSubmit();})()");await wait(100);
  assert(await evalValue("[...document.querySelectorAll('[role=alert]')].some(e=>e.textContent.includes('do not match'))"));
 }
 await evalValue("localStorage.clear();sessionStorage.clear()");
 scenario='populated';guest=false;routePath='/workout/'+draftId;
 await metrics(320,568);await send('Page.navigate',{url:base+'/workout/'+draftId});await wait(800);
 await evalValue("[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Complete set and start rest timer').click();"); await wait(500); await evalValue("[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Pause workout timer')?.click(); [...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Pause rest timer').click(); const select=document.querySelector('select');select.value='light';select.dispatchEvent(new Event('change',{bubbles:true}));");await wait(200);
 assert.equal(await evalValue("document.documentElement.dataset.theme"),'light');
 assert.equal(await evalValue("document.querySelector('[aria-pressed=true]')?.getAttribute('aria-pressed')"),'true');
 assert(await evalValue("!!document.querySelector('button[aria-label=\"Start workout timer\"]')"));
 await send('Page.navigate',{url:base+'/workout/'+draftId});await wait(1000);
 assert(await evalValue("!!document.querySelector('[aria-pressed=true]')"));
 assert(await evalValue("!!document.querySelector('button[aria-label=\"Start workout timer\"]')"));
 const pausedRest=await evalValue("document.querySelector('[class*=info] strong').textContent");await wait(1100);assert.equal(await evalValue("document.querySelector('[class*=info] strong').textContent"),pausedRest);
 console.log('PASS: theme switching and reload retain completed sets and paused timers');
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await evalValue("document.querySelector('input').focus()");await wait(100);
 assert.equal(await evalValue("getComputedStyle(document.querySelector('nav')).position"),'relative');
 await evalValue("document.querySelector('input').blur();[...document.querySelectorAll('button')].find(b=>b.textContent==='Abandon Workout').click()");await wait(100);
 const modal=await evalValue("({height:document.querySelector('.modal-shell').getBoundingClientRect().height,visible:visualViewport.height,scroll:document.documentElement.scrollWidth,width:innerWidth})");assert(modal.height<=modal.visible);assert(modal.scroll<=modal.width+1);console.log('focus/dialog',JSON.stringify(modal));
 await send('Page.navigate',{url:base+'/library'});await wait(200);
 const skeleton=await evalValue("({busy:!!document.querySelector('[aria-busy=true]'),announcement:!!document.querySelector('[role=status]'),scroll:document.documentElement.scrollWidth,width:innerWidth})");assert(skeleton.busy);assert(skeleton.announcement);assert(skeleton.scroll<=skeleton.width+1);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await wait(60);
 const reducedPulse=await evalValue("Number(getComputedStyle(document.querySelector('[class*=pulse]')).opacity)");assert.equal(reducedPulse,0);console.log('skeleton',JSON.stringify(skeleton),'reduced-motion opacity',reducedPulse);
 await wait(900);
 await evalValue("(()=>{const input=document.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'test');input.dispatchEvent(new Event('input',{bubbles:true}));})()");await wait(500);
 const refresh=await evalValue("({cards:document.querySelectorAll('[class*=exerciseCard]').length,shapes:document.querySelectorAll('[class*=shape]').length})");assert(refresh.cards>0);assert.equal(refresh.shapes,0);console.log('refresh retains cards',JSON.stringify(refresh));
 assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
 console.log('PASS: both modes, narrow portrait, landscape, desktop, focus, dialog, skeleton accessibility, reduced motion, retained refresh content');
 await wait(1000); await send('Fetch.disable'); await send('Browser.close');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{ws?.close();browser?.kill();server.close();});
