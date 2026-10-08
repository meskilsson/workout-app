const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateTraining, trainingTotalSeconds, validateCardioCompletion } = require('../../../packages/shared/src/training.ts');
const { createCardioTimer, cardioTimerAction: action, reconcileCardioTimer: tick, cardioTimerView: view, cardioCompletion, isCardioTimerState } = require('../../../packages/shared/src/cardioTimer.ts');
const config = { format: 'intervals', rounds: 8, workSeconds: 30, restSeconds: 90 };
test('interval totals include only rests between rounds; single and zero-rest rounds', () => {
 assert.equal(trainingTotalSeconds(config), 870);
 assert.equal(trainingTotalSeconds({...config, rounds: 1}),30);
 assert.equal(trainingTotalSeconds({...config, restSeconds: 0}),240);
});
test('configuration rejects incompatible, nonfinite, fractional and oversized values', () => {
 for (const c of [{...config,rounds:0},{...config,rounds:1.5},{...config,rounds:101},{...config,workSeconds:Infinity},{...config,workSeconds:0},{...config,restSeconds:-1},{...config,restSeconds:NaN},{...config,durationSeconds:60},{...config,workSeconds:21600}, {format:'cardio',durationSeconds:10,targetDistance:0,distanceUnit:'km'}, {format:'cardio',durationSeconds:10,targetDistance:5}, {format:'strength',workSeconds:10}]) assert.throws(()=>validateTraining(c));
 assert.deepEqual(validateTraining({format:'cardio',durationSeconds:30,targetDistance:2,distanceUnit:'km'}),{format:'cardio',durationSeconds:30,targetDistance:2,distanceUnit:'km'});
});
test('ready requires explicit start, work/rest transitions, no final rest or repeated completion', () => {
 let s=createCardioTimer(); assert.equal(tick(s,config,100000).status,'ready');
 s=action(s,config,'start',1000); assert.equal(view(s,config,1000).phase,'Work');
 assert.equal(view(tick(s,config,31000),config,31000).phase,'Rest');
 assert.equal(view(s,config,121000).round,2); assert.equal(view(s,config,121000).phase,'Work');
 s=tick(s,config,871000); assert.equal(s.status,'completed'); assert.equal(view(s,config,871000).completedRounds,8);
 assert.equal(tick(s,config,10000000),s); assert.equal(action(s,config,'complete',10000000),s);
 assert.deepEqual(cardioCompletion(s,config),{elapsedSeconds:870,completedRounds:8,manual:false});
});
test('pause freezes time, resume preserves fraction of second, reset returns to ready', () => {
 let s=action(createCardioTimer(),config,'start',1000); s=action(s,config,'pause',2450);
 assert.equal(view(s,config,999999).elapsed,1.45);
 s=action(s,config,'resume',1000000); assert.equal(view(s,config,1000550).elapsed,2);
 s=action(s,config,'reset',1000600); assert.deepEqual(s,createCardioTimer()); assert.equal(cardioCompletion(s,config),undefined);
});
test('delayed callbacks reconcile multiple phases and survive a serialized refresh', () => {
 const s=action(createCardioTimer(),config,'start',1000), restored=JSON.parse(JSON.stringify(s));
 assert(isCardioTimerState(restored)); assert(!isCardioTimerState({...restored,startedAt:null}));
 assert.equal(view(tick(restored,config,376000),config,376000).round,4);
 assert.equal(view(restored,config,406000).phase,'Rest');
 assert.equal(tick(restored,config,999999).status,'completed');
});
test('single-round and zero-rest sessions go straight to next work or completion', () => {
 for(const c of [{...config,rounds:1},{...config,restSeconds:0}]) {
  const s=action(createCardioTimer(),c,'start',1000);
  if(c.rounds>1) {assert.equal(view(s,c,31000).phase,'Work');assert.equal(view(s,c,31000).round,2);}
  assert.equal(tick(s,c,1000+trainingTotalSeconds(c)*1000).status,'completed');
 }
});
test('continuous cardio and manual completion distinguish planned from actual time', () => {
 const c={format:'cardio',durationSeconds:600};
 let s=action(createCardioTimer(),c,'start',1000); s=action(s,c,'complete',11000);
 assert.deepEqual(cardioCompletion(s,c),{elapsedSeconds:10,completedRounds:0,manual:true});
 assert.throws(()=>validateCardioCompletion({...cardioCompletion(s,c),manual:false},c));
 assert.equal(validateCardioCompletion(cardioCompletion(s,c),c).elapsedSeconds,10);
 assert.equal(tick(action(createCardioTimer(),c,'start',0),c,600000).status,'completed');
});

test('cardio snapshots isolate users, clear on completion/logout and block late callbacks', () => {
 const memory=new Map();global.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k),get length(){return memory.size;},key:i=>[...memory.keys()][i]??null};
 const {workoutScope,saveCardioSnapshot,readCardioSnapshot,clearDraftSnapshots,clearUserSnapshots}=require('../src/utils/workoutProgressStorage.ts');
 const a=workoutScope('cardio-user-a','cardio-draft'),b=workoutScope('cardio-user-b','cardio-draft');
 saveCardioSnapshot(a,'bike',{config,state:createCardioTimer()});assert(readCardioSnapshot(a,'bike'));assert.equal(readCardioSnapshot(b,'bike'),null);
 clearDraftSnapshots('cardio-draft');assert.equal(readCardioSnapshot(a,'bike'),null);saveCardioSnapshot(a,'bike',{state:createCardioTimer()});assert.equal(readCardioSnapshot(a,'bike'),null);
 saveCardioSnapshot(b,'bike',{config,state:createCardioTimer()});clearUserSnapshots('cardio-user-b');assert.equal(readCardioSnapshot(b,'bike'),null);
});
