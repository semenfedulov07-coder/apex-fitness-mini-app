'use client';

import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Clock,Dumbbell,TimerReset} from 'lucide-react';
import {toast} from 'sonner';
import {createId,dayKey,workoutFor,workoutKey} from '@/lib/apex/data';
import type {Exercise,Program,Route,SetLog,State} from '@/lib/apex/models';
import {haptic} from '@/lib/apex/telegram';
import {Bar,Btn,Eyebrow,Photo,Title} from './ui';

type Props={program:Program;week:number;day:number;state:State;update:(recipe:(s:State)=>State)=>void;go:(route:Route)=>void};

function defaultSets(exercise:Exercise,legacyDone=false):SetLog[]{return Array.from({length:exercise.sets},()=>({reps:exercise.reps.replace(/\D.*$/,'' )||exercise.reps,weight:exercise.defaultWeight,done:legacyDone}));}

export function WorkoutFlow({program,week,day,state,update,go}:Props){
  const workout=workoutFor(program,day);
  const key=workoutKey(program.id,week,day);
  const [activeIndex,setActiveIndex]=useState(0);
  const [timer,setTimer]=useState(0);
  const [startedAt]=useState(()=>Date.now());
  useEffect(()=>{if(timer<=0)return;const id=setTimeout(()=>setTimer(value=>value-1),1000);return()=>clearTimeout(id)},[timer]);
  const logs=useMemo(()=>Object.fromEntries(workout.exercises.map(exercise=>[exercise.id,state.setLogs[key]?.[exercise.id]||defaultSets(exercise,(state.exerciseChecks[key]||[]).includes(exercise.id))])),[key,state.setLogs,state.exerciseChecks,workout.exercises]);
  const totalSets=workout.exercises.reduce((sum,exercise)=>sum+exercise.sets,0);
  const doneSets=workout.exercises.reduce((sum,exercise)=>sum+(logs[exercise.id]||[]).filter(set=>set.done).length,0);
  const allDone=doneSets===totalSets;
  const exercise=workout.exercises[activeIndex];
  const exerciseSets=logs[exercise.id];
  const exerciseDone=exerciseSets.every(set=>set.done);
  const writeSets=(exerciseId:string,next:SetLog[])=>update(s=>{const workoutLogs={...(s.setLogs[key]||{}),[exerciseId]:next};const checked=new Set(s.exerciseChecks[key]||[]);if(next.every(set=>set.done))checked.add(exerciseId);else checked.delete(exerciseId);return {...s,setLogs:{...s.setLogs,[key]:workoutLogs},exerciseChecks:{...s.exerciseChecks,[key]:[...checked]}}});
  const changeSet=(index:number,field:'reps'|'weight',value:string)=>writeSets(exercise.id,exerciseSets.map((set,i)=>i===index?{...set,[field]:value}:set));
  const toggleSet=(index:number)=>{const done=!exerciseSets[index].done;writeSets(exercise.id,exerciseSets.map((set,i)=>i===index?{...set,done}:set));if(done&&index<exerciseSets.length-1)setTimer(exercise.rest);haptic()};
  const finish=()=>{
    if(!allDone)return;
    if(state.completed.includes(key)){go({page:'complete',id:program.id,week,day});return;}
    const duration=Math.max(1,Math.round((Date.now()-startedAt)/60000));
    update(s=>{const previous=s.workoutHistory.find(record=>record.key===key);return {...s,completed:s.completed.includes(key)?s.completed:[...s.completed,key],workoutStatus:{...s.workoutStatus,[key]:'completed'},workoutHistory:[...s.workoutHistory.filter(record=>record.key!==key),{id:previous?.id||createId(),key,programId:program.id,workoutId:workout.id,title:workout.title,date:new Date().toISOString(),duration,status:'completed',completedSets:doneSets,totalSets}],habits:{...s.habits,[dayKey()]:[...new Set([...(s.habits[dayKey()]||[]),'workout'])]}}});
    setTimer(0);haptic();go({page:'complete',id:program.id,week,day});
  };
  return <>
    <Title kicker={`${program.name} / НЕДЕЛЯ ${week+1}`} title={workout.title} copy={workout.subtitle}/>
    <section className="workout-console">
      <div className="workout-progress-head"><div><span>ПРОГРЕСС ТРЕНИРОВКИ</span><strong>{doneSets}<small> / {totalSets} подходов</small></strong></div><span>{Math.round(doneSets/totalSets*100)}%</span></div>
      <Bar value={Math.round(doneSets/totalSets*100)}/>
      <div className="workout-meta"><span><Clock/> 45–60 минут</span><span><Dumbbell/> {workout.exercises.length} упражнений</span></div>
    </section>
    <nav className="exercise-rail" aria-label="Упражнения">{workout.exercises.map((item,index)=>{const itemDone=(logs[item.id]||[]).every(set=>set.done);return <button key={item.id} className={`${index===activeIndex?'active':''} ${itemDone?'done':''}`} onClick={()=>setActiveIndex(index)} aria-label={`${index+1}. ${item.name}`}><span>{itemDone?<Check/>:String(index+1).padStart(2,'0')}</span><small>{item.name}</small></button>})}</nav>
    <article className="active-exercise">
      <div className="exercise-editor-head"><Photo src={exercise.image} alt="Иллюстрация тренировки"/><div><Eyebrow>УПРАЖНЕНИЕ {String(activeIndex+1).padStart(2,'0')} / {String(workout.exercises.length).padStart(2,'0')}</Eyebrow><h2>{exercise.name}</h2><p>{exercise.muscle}</p></div></div>
      <p className="technique-note">{exercise.technique}</p>
      <div className="set-table-head"><span>Подход</span><span>Вес, кг</span><span>Повторы</span><span>Готово</span></div>
      <div className="set-table">{exerciseSets.map((set,index)=><div className={set.done?'done':''} key={index}><strong>{String(index+1).padStart(2,'0')}</strong><label><span>Вес</span><input inputMode="decimal" value={set.weight} onChange={event=>changeSet(index,'weight',event.target.value)} aria-label={`Вес, подход ${index+1}`}/></label><label><span>Повторы</span><input inputMode="numeric" value={set.reps} onChange={event=>changeSet(index,'reps',event.target.value)} aria-label={`Повторы, подход ${index+1}`}/></label><button onClick={()=>toggleSet(index)} aria-pressed={set.done} aria-label={`${set.done?'Снять отметку':'Отметить выполненным'}, подход ${index+1}`}><Check/></button></div>)}</div>
      <div className="exercise-footer"><button disabled={activeIndex===0} onClick={()=>setActiveIndex(i=>i-1)}><ArrowLeft/> Назад</button><span><TimerReset/> Отдых {exercise.rest} сек</span>{activeIndex<workout.exercises.length-1?<button className={exerciseDone?'ready':''} onClick={()=>setActiveIndex(i=>i+1)}>Дальше <ArrowRight/></button>:<span className="last-exercise">Последнее упражнение</span>}</div>
    </article>
    {timer>0&&<div className="rest-timer"><Clock/> Отдых: {Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}<button onClick={()=>setTimer(0)}>Пропустить</button></div>}
    <div className="workout-finish"><p>{allDone?'Все подходы отмечены. Тренировку можно завершить.':'Отмечай каждый подход — прогресс сохранится автоматически.'}</p><Btn disabled={!allDone} onClick={finish}>{state.completed.includes(key)?'Посмотреть результат':'Завершить тренировку'}<Check/></Btn></div>
  </>;
}

export function CompleteWorkout({program,week,day,state,go}:{program:Program;week:number;day:number;state:State;go:(route:Route)=>void}){
  const workout=workoutFor(program,day);const key=workoutKey(program.id,week,day);const record=state.workoutHistory.find(item=>item.key===key);
  return <section className="complete-screen"><div className="complete-icon"><Check size={46}/></div><Eyebrow>WORKOUT COMPLETE</Eyebrow><h1>Ты сделал<br/><em>это для себя.</em></h1><p>Подходы сохранены. Прогресс программы и статистика уже обновились.</p><div className="complete-stats"><div><strong>{record?.completedSets||workout.exercises.reduce((n,e)=>n+e.sets,0)}</strong><small>подходов</small></div><div><strong>{record?.duration||1}</strong><small>мин в приложении</small></div><div><strong>{state.completed.filter(id=>id.startsWith(`${program.id}:`)).length}</strong><small>тренировок</small></div></div><Btn onClick={()=>go({page:'progress'})}>Посмотреть прогресс<ArrowRight/></Btn><button className="text-link" onClick={()=>go({page:'plan'})}>Вернуться к плану</button></section>;
}
