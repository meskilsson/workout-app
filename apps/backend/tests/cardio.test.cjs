require('tsx/cjs');
const {test,mock}=require('node:test'); const assert=require('node:assert/strict'); const {Types}=require('mongoose');
const Draft=require('../src/models/WorkoutDraft.ts').default, Template=require('../src/models/WorkoutTemplate.ts').default, Session=require('../src/models/WorkoutSession.ts').default;
const {updateWorkoutDraftTrainingSchema}=require('../src/schemas/workoutDraft.schema.ts');
const {createWorkoutSessionSchema}=require('../src/schemas/workoutSessionSchemas.ts');
const {createWorkoutTemplateSchema}=require('../src/schemas/workoutTemplateSchemas.ts');
const service=require('../src/services/workoutDraftService.ts');
const sessionService=require('../src/services/workoutSessionService.ts');
const id='0123456789abcdef01234567', user='0123456789abcdef01234568', bike='0123456789abcdef01234569';
const config={format:'intervals',rounds:8,workSeconds:30,restSeconds:90}, completion={elapsedSeconds:870,completedRounds:8,manual:false};
test('DTO validation rejects invalid configurations and incompatible fields; legacy strength remains valid',()=>{
 assert(updateWorkoutDraftTrainingSchema.safeParse({exerciseId:bike,training:config}).success);
 for(const training of [{...config,rounds:0},{...config,rounds:2.5},{...config,restSeconds:-1},{...config,workSeconds:NaN},{...config,durationSeconds:5}]) assert(!updateWorkoutDraftTrainingSchema.safeParse({exerciseId:bike,training}).success);
 const session={startedAt:'2026-10-08T10:00:00Z',endedAt:'2026-10-08T10:15:00Z',exercises:[{exerciseId:id,exerciseName:'Bench',sets:[{weight:20,reps:8}]},{exerciseId:bike,exerciseName:'Bike',training:config,cardioCompletion:completion,sets:[]}]};
 assert(createWorkoutSessionSchema.safeParse(session).success);
 assert(!createWorkoutSessionSchema.safeParse({...session,exercises:[{...session.exercises[1],cardioCompletion:undefined}]}).success);
 assert(!createWorkoutSessionSchema.safeParse({...session,exercises:[{...session.exercises[1],sets:[{weight:20,reps:8}]}]}).success);
 assert(!createWorkoutTemplateSchema.safeParse({name:'Mixed',exercises:[{exerciseId:bike,training:config,plannedSets:[{reps:5}]}]}).success);
});
test('additive Mongo models roundtrip ordered mixed plans and actual completion; legacy documents validate',async()=>{
 const exercises=[{exerciseId:id,exerciseName:'Bench',sets:[{weight:20,reps:8}]},{exerciseId:bike,exerciseName:'Bike',training:config,sets:[]}];
 const draft=new Draft({userId:user,exercises});await draft.validate(); const restored=new Draft(draft.toObject());
 assert.deepEqual(restored.exercises[1].training,config);assert.equal(restored.exercises[0].training,undefined);assert.equal(restored.exercises[0].sets[0].reps,8);
 const session=new Session({userId:user,startedAt:new Date(),endedAt:new Date(),exercises:[exercises[0],{...exercises[1],cardioCompletion:completion}]});await session.validate();assert.equal(session.toObject().exercises[1].cardioCompletion.elapsedSeconds,870);
 const template=new Template({name:'Mixed',exercises:exercises.map((e,order)=>({exercise:e.exerciseId,exerciseName:e.exerciseName,order,training:e.training,plannedSets:e.sets}))});await template.validate();assert.deepEqual(new Template(template.toObject()).exercises[1].training,config);
});
test('configuration updates retain ownership filters, clear only target sets, and save/reopen config',async()=>{
 const draft=new Draft({_id:id,userId:user,status:'building',exercises:[{exerciseId:id,exerciseName:'Bench',sets:[{id:'f8f6de5c-e305-4bba-b62b-a5375d3b79b6',weight:20,reps:8}]},{exerciseId:bike,exerciseName:'Bike',sets:[]}]});
 mock.method(Draft,'findOne',async filter=>{assert.equal(filter.userId,user);return draft;});
 mock.method(Draft,'findOneAndUpdate',async(filter,update,options)=>{assert.equal(filter.userId,user);assert.equal(options.runValidators,true);assert.equal(filter['exercises.exerciseId'].toString(),bike);draft.exercises[1].training=update.$set['exercises.$.training'];draft.exercises[1].sets=update.$set['exercises.$.sets'];return draft;});
 try {const saved=await service.updateWorkoutDraftTraining(id,{exerciseId:bike,training:config},user);assert.deepEqual(saved.exercises[1].training,config);assert.equal(saved.exercises[0].sets[0].weight,20);assert.deepEqual((await service.getWorkoutDraftById(id,user)).exercises[1].training,config);
 await assert.rejects(()=>service.updateWorkoutDraftTraining(id,{exerciseId:bike,training:config,cardioCompletion:completion},user));
 }finally{mock.restoreAll();}
});
test('session service persists actual cardio and strength together, rejecting config-only completion',async()=>{
 let saved;
 mock.method(Session,'create',async value=>{saved=new Session(value);await saved.validate();return saved;});
 try { await sessionService.createWorkoutSession({startedAt:new Date().toISOString(),exercises:[{exerciseId:id,exerciseName:'Bench',sets:[{weight:20,reps:8}]},{exerciseId:bike,exerciseName:'Bike',training:config,cardioCompletion:completion,sets:[]}]},user);
 assert.deepEqual(saved.exercises[1].training,config);assert.equal(saved.exercises[1].cardioCompletion.completedRounds,8);assert.equal(saved.exercises[0].sets[0].weight,20);
 await assert.rejects(()=>sessionService.createWorkoutSession({exercises:[{exerciseName:'Bike',training:config,sets:[]}]},user));
 }finally{mock.restoreAll();}
});

test('template start/edit/save and repeat preserve cardio configuration without copying completion',async()=>{
 const Exercise=require('../src/models/Exercises.ts').default;
 const templates=require('../src/services/workoutTemplateService.ts');
 const template={_id:new Types.ObjectId(id),createdBy:new Types.ObjectId(user),isPublic:false,name:'Intervals',exercises:[{exercise:{_id:new Types.ObjectId(bike),primaryMuscles:[]},exerciseName:'Air Bike',order:0,plannedSets:[],training:config}]};
 let captured;
 mock.method(Template,'findById',()=>({populate:async()=>template}));
 mock.method(Template,'findOne',()=>({populate:async()=>template}));
 mock.method(Draft,'create',async value=>{captured=value;return new Draft(value);});
 mock.method(Draft,'updateMany',async()=>({}));
 try {
  await templates.startWorkoutFromTemplate(id,user);assert.deepEqual(captured.exercises[0].training,config);assert.equal(captured.exercises[0].cardioCompletion,undefined);
  await templates.createTemplateEditDraft(id,user);assert.deepEqual(captured.exercises[0].training,config);
  const editDraft=new Draft({_id:id,userId:user,purpose:'template',status:'building',exercises:[{exerciseId:bike,exerciseName:'Air Bike',training:config,sets:[]}]});
  mock.method(editDraft,'save',async()=>editDraft);mock.method(Draft,'findOne',async()=>editDraft);
  mock.method(Template,'create',async value=>{captured=value;return new Template(value);});
  await templates.createWorkoutTemplateFromDraft(id,user,{name:'Intervals'});assert.deepEqual(captured.exercises[0].training,config);
  mock.method(Session,'findOne',async()=>new Session({_id:id,userId:user,exercises:[{exerciseId:bike,exerciseName:'Air Bike',training:config,cardioCompletion:completion,sets:[]}]}));
  mock.method(Exercise,'find',async()=>[{id:bike,primaryMuscles:[],name:'Air Bike'}]);
  await sessionService.repeatWorkoutSession(id,user);assert.deepEqual(captured.exercises[0].training,config);assert.equal(captured.exercises[0].cardioCompletion,undefined);
 } finally {mock.restoreAll();}
});

test('reselecting a legacy cardio activity retains strength data while new cardio entries get a plan',async()=>{
 const Exercise=require('../src/models/Exercises.ts').default;
 const draft=new Draft({_id:id,userId:user,status:'building',selectedMuscleGroups:[],exercises:[{exerciseId:bike,exerciseName:'Legacy rowing',sets:[{weight:20,reps:8}]}]});
 mock.method(Draft,'findOne',async()=>draft);mock.method(draft,'save',async()=>draft);
 mock.method(Exercise,'find',async()=>[{_id:new Types.ObjectId(bike),name:'Legacy rowing',exerciseType:'cardio'},{_id:new Types.ObjectId(id),name:'Air Bike',exerciseType:'cardio'}]);
 try {const result=await service.updateWorkoutDraftExercises(id,{exerciseIds:[bike,id]},user);assert.equal(result.exercises[0].training,undefined);assert.equal(result.exercises[0].sets[0].reps,8);assert.deepEqual(result.exercises[1].training,{format:'cardio',durationSeconds:600});assert.equal(result.exercises[1].cardioCompletion,undefined);}finally{mock.restoreAll();}
});
test('administrative template creation preserves validated training configuration',async()=>{
 const Exercise=require('../src/models/Exercises.ts').default, {saveResource}=require('../src/controllers/adminController.ts');
 let saved;
 mock.method(Exercise,'find',async()=>[{id:bike,name:'Air Bike'}]);mock.method(Template,'create',async value=>{saved=value;return value;});
 const response={status(){return this;},json(){}};
 try {await saveResource('templates',false)({user:{id:user},validatedBody:{name:'Intervals',exercises:[{exerciseId:bike,training:config,plannedSets:[]}]}},response);assert.deepEqual(saved.exercises[0].training,config);}finally{mock.restoreAll();}
});
