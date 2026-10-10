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
 const draft={_id:draftId,userId,status:'active',selectedMuscleGroups:['chest','back'],exercises:exercises.map((e,j)=>({exerciseId:e._id,exerciseName:e.name,sets:Array.from({length:3},(_,i)=>({id:`f8f6de5c-e305-4bba-b62b-a5375d3b79b${j*3+i}`,weight:j?25:40,reps:8+i}))}))};
 const templates=['Upper body essentials','Full body strength','Push day'].map((name,i)=>({_id:'0123456789abcdef0123458'+i,name,description:'A balanced strength session. Build consistency with focused, controlled sets.',category:'strength',isPublic:true,exercises:exercises.map((e,order)=>({_id:e._id,exerciseId:e._id,exerciseName:e.name,exercise:e,plannedSets:[{weight:40,reps:8},{weight:40,reps:8}],order}))}));
 let scenario='populated', guest=false, routePath='/', mutationDelay=0;
 const requestCounts = new Map();
 const workoutRequests=[]; let savedStatus='active', loseCompletion=false;
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
   const delay=item.request.method==='OPTIONS' ? 0 : scenario==='loading' && !isAuth ? 2200 : item.request.method!=='GET' ? mutationDelay : 150;
   if(url.pathname.includes('/auth/me'))payload={user:guest?null:{_id:userId,name:'Alex',email:'alex@example.com',username:'alex',role:'user'}};
   else if(url.pathname.includes('/auth/')) {responseCode=400;payload={message:'Check your details and try again.'};}
   else if(url.pathname.includes('/workout-sessions')){payload=sessions.find(x=>url.pathname.endsWith(x._id)) ?? (scenario==='empty'?[]:sessions); if(scenario==='empty' && !Array.isArray(payload))payload={...payload,exercises:[]};}
   else if(url.pathname.includes('/workout-drafts'))payload={...draft,purpose:routePath.includes('template')?'template':'workout',status:routePath.startsWith('/workout/')?'active':'building',exercises:scenario==='empty'?[]:draft.exercises};
   else if(url.pathname.includes('/exercises'))payload=exercises.find(e=>url.pathname.endsWith(e._id)) ?? {exercises:scenario==='empty'?[]:exercises,total:scenario==='empty'?0:3,totalPages:1};
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
 ['home','/',false,'Ready for your next session?'],['home-alias','/homepage',true,'Ready for your next session?'],
 ['guest-library','/library',true,'Exercise library'],['guest-exercise','/exercises/'+exerciseId,true,'Barbell bench press'],['guest-templates','/templates/pre-made',true,'Browse templates'],['guest-template-details','/templates/pre-made/templates-details/'+templates[0]._id,true,'Upper body essentials'],
 ['login','/login',true,'Log in'],['signup','/signup',true,'Create account'],
 ['workout-select','/workout-select',false,'Choose muscle groups'],['template-select','/workout-select?purpose=template',false,'Choose workout muscles'],
 ['exercise-select','/exercise-select/'+draftId,false,'Edit exercises'],['workout-summary','/workout-summary/'+draftId,false,'Workout summary'],
 ['template-summary','/workout-summary/'+draftId+'?template',false,'Workout summary'],['workout','/workout/'+draftId,false,'Barbell bench press'],
 ['result','/workout-result/'+sessions[0]._id,false,'Workout saved'],['library','/library',false,'Exercise library'],
 ['exercise-details','/exercises/'+exerciseId,false,'Barbell bench press'],['create-exercise','/create-exercise',false,'Create exercise'],['edit-exercise','/edit-exercise/'+exerciseId,false,'Edit exercise'],
 ['templates','/templates',false,'Browse templates'],['public-templates','/templates/pre-made',false,'Browse templates'],['my-templates','/templates/my',false,'My templates'],
 ['public-template-details','/templates/pre-made/templates-details/'+templates[0]._id,false,'Upper body essentials'],['my-template-details','/templates/my/templates-details/'+templates[0]._id,false,'Upper body essentials'],
 ['create-template','/templates/create',false,'Create a template'],['profile','/profile',false,'Your profile'],['history','/profile/workouts',false,'Workout history'],
 ['session-details','/profile/workouts/'+sessions[0]._id,false,'Workout details'],['my-exercises','/profile/exercises',false,'My exercises'],['settings','/profile/settings',false,'Account settings'],
 ];
 const routeMatches = route => !process.env.UI_CHECK_ROUTES || process.env.UI_CHECK_ROUTES.split(',').includes(route[0]);
 async function visit(route,mode,width,state='populated') {
  scenario=state;guest=route[2];routePath=route[1];await metrics(width,width===844?390:width<1000?812:900);
  await evalValue("localStorage.setItem('color_theme', '"+mode+"')");
  await send('Page.navigate',{url:base+routePath});await wait(state==='loading'?500:1000);
  const info=await evalValue("({width:innerWidth,scroll:document.documentElement.scrollWidth,text:document.body.innerText,busy:!!document.querySelector('[aria-busy=true]'),shapes:document.querySelectorAll('[class*=shape]').length,heading:!!document.querySelector('h1,h2'),fonts:[...document.querySelectorAll('input:not([type=checkbox]),select,textarea')].map(x=>parseFloat(getComputedStyle(x).fontSize))})");
  assert(info.scroll<=info.width+1,route[0]+' '+state+' horizontal overflow');
  if(width<1000)assert(info.fonts.every(x=>x>=16),route[0]+' input font size');
  assert.equal(await evalValue("document.documentElement.dataset.theme"),mode);
  if(state==='populated') {assert(info.text.toLowerCase().includes(route[3].toLowerCase()),route[0]+' missing populated content: '+info.text);assert(info.heading);}
  if(state==='loading')assert(info.busy && info.shapes>0,route[0]+' missing skeleton');
  if(state==='error')assert(info.text.includes('Unable to load'),route[0]+' missing error');
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
 const asyncNames=['exercise-select','workout-summary','workout','result','library','exercise-details','edit-exercise','public-templates','my-templates','public-template-details','my-template-details','history','session-details','my-exercises'];
 const emptyNames=['exercise-select','public-template-details','my-template-details','result','session-details','workout-summary','library','public-templates','my-templates','history','my-exercises'];
 if(process.env.UI_CHECK_PHASE!=='interactions')for(const mode of ['light','dark']) {
  for(const route of routes.filter(r=>routeMatches(r) && asyncNames.includes(r[0]))) {await visit(route,mode,375,'loading');await wait(2300);await visit(route,mode,375,'error');}
  for(const route of routes.filter(r=>routeMatches(r) && emptyNames.includes(r[0]))) {await visit(route,mode,375,'empty');assert(!await evalValue("document.querySelector('[class*=shape]')!==null"));}
 }
 if(process.env.UI_CHECK_PHASE==='pages'){console.log('PASS: targeted routes and applicable states');await wait(1000);await send('Fetch.disable');await send('Browser.close');return;}
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
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});await wait(100);
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
 const motion=await evalValue("getComputedStyle(document.querySelector('[class*=shape]'),'::after').animationName");assert.equal(motion,'none');console.log('skeleton',JSON.stringify(skeleton),'reduced-motion',motion);
 await wait(900);
 await evalValue("(()=>{const input=document.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'test');input.dispatchEvent(new Event('input',{bubbles:true}));})()");await wait(500);
 const refresh=await evalValue("({cards:document.querySelectorAll('[class*=exerciseCard]').length,shapes:document.querySelectorAll('[class*=shape]').length})");assert(refresh.cards>0);assert.equal(refresh.shapes,0);console.log('refresh retains cards',JSON.stringify(refresh));
 assert.equal(browserErrors.length,0,JSON.stringify(browserErrors));
 console.log('PASS: both modes, narrow portrait, landscape, desktop, focus, dialog, skeleton accessibility, reduced motion, retained refresh content');
 await wait(1000); await send('Fetch.disable'); await send('Browser.close');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{ws?.close();browser?.kill();server.close();});
