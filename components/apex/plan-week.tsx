'use client';

import {CalendarCheck,ChevronLeft,ChevronRight,Clock,MinusCircle,Moon,Play} from 'lucide-react';
import {createId,dayKey,planDate,workoutFor,workoutKey} from '@/lib/apex/data';
import type {Program,Route,State,WorkoutStatus} from '@/lib/apex/models';
import {haptic} from '@/lib/apex/telegram';
import {Btn,Empty,Eyebrow,Photo} from './ui';

const weekLabels=['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
const statusText:Record<WorkoutStatus,string>={planned:'Запланировано',completed:'Выполнено',missed:'Пропущено'};
type Props={active?:Program;state:State;update:(recipe:(s:State)=>State)=>void;go:(route:Route)=>void;week:number;setWeek:(value:number|((value:number)=>number))=>void;selectedDay:number;setSelectedDay:(value:number)=>void};

export function PlanWeek({active,state,update,go,week,setWeek,selectedDay,setSelectedDay}:Props){
  const dates=Array.from({length:7},(_,i)=>planDate(week,i));
  if(!active)return <Empty title="Твой план начинается здесь" copy="Выбери программу. После демо-покупки здесь появятся тренировки и уроки." action="Выбрать программу" onClick={()=>go({page:'programs'})}/>;
  const hasWorkout=active.days.includes(selectedDay);
  const key=workoutKey(active.id,week,selectedDay);
  const completed=state.completed.includes(key)||state.workoutStatus[key]==='completed';
  const status:WorkoutStatus=completed?'completed':state.workoutStatus[key]==='missed'?'missed':'planned';
  const workout=workoutFor(active,selectedDay);
  const markMissed=()=>{
    const date=planDate(week,selectedDay).toISOString();
    update(s=>({...s,workoutStatus:{...s.workoutStatus,[key]:'missed'},workoutHistory:[...s.workoutHistory.filter(x=>x.key!==key),{id:createId(),key,programId:active.id,workoutId:workout.id,title:workout.title,date,duration:0,status:'missed',completedSets:0,totalSets:workout.exercises.reduce((n,e)=>n+e.sets,0)}]}));
    haptic();
  };
  return <section className="planner-shell">
    <div className="week-heading"><button aria-label="Предыдущая неделя" disabled={week===0} onClick={()=>setWeek(w=>Math.max(0,w-1))}><ChevronLeft/></button><div><strong>Неделя {week+1} из {active.weeks}</strong><small>{dates[0].toLocaleDateString('ru-RU',{day:'numeric',month:'long'})} — {dates[6].toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</small></div><button aria-label="Следующая неделя" disabled={week>=active.weeks-1} onClick={()=>setWeek(w=>Math.min(active.weeks-1,w+1))}><ChevronRight/></button></div>
    <div className="week-strip" onTouchStart={e=>e.currentTarget.dataset.start=String(e.touches[0].clientX)} onTouchEnd={e=>{const dx=e.changedTouches[0].clientX-Number(e.currentTarget.dataset.start);if(Math.abs(dx)>65)setWeek(w=>Math.max(0,Math.min(active.weeks-1,w+(dx<0?1:-1))))}}>{dates.map((date,i)=>{const dayKeyValue=workoutKey(active.id,week,i);const dayStatus=state.completed.includes(dayKeyValue)||state.workoutStatus[dayKeyValue]==='completed'?'completed':state.workoutStatus[dayKeyValue];return <button key={i} aria-label={`${weekLabels[i]}, ${date.getDate()}${dayStatus?`, ${statusText[dayStatus]}`:''}`} className={`${i===selectedDay?'selected':''} ${dayKey(date)===dayKey()?'today':''} ${dayStatus||''}`} onClick={()=>setSelectedDay(i)}><small>{weekLabels[i]}</small><strong>{date.getDate()}</strong><span className={active.days.includes(i)?'day-dot':''}/></button>})}</div>
    {hasWorkout?<article className={`next-workout plan-workout ${status}`}><Photo src={active.cover}/><div className="plan-workout-content"><div className="plan-status-row"><span className={`workout-status ${status}`}>{status==='completed'?<CalendarCheck/>:status==='missed'?<MinusCircle/>:<Clock/>}{statusText[status]}</span><small>{dates[selectedDay].toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</small></div><Eyebrow>{active.name} / НЕДЕЛЯ {week+1}</Eyebrow><h2>{workout.title}</h2><p>{workout.subtitle}</p><div className="workout-card-meta"><span><Clock/> 45–60 мин</span><span>{workout.exercises.length} упражнений</span><span>{workout.exercises.reduce((n,e)=>n+e.sets,0)} подходов</span></div><div className="plan-actions"><Btn onClick={()=>go({page:'workout',id:active.id,week,day:selectedDay})}>{completed?'Открыть тренировку':'Начать тренировку'}<Play/></Btn>{!completed&&status!=='missed'&&<button className="miss-action" onClick={markMissed}>Отметить как пропущенную</button>}{status==='missed'&&<button className="miss-action" onClick={()=>update(s=>({...s,workoutStatus:{...s.workoutStatus,[key]:'planned'},workoutHistory:s.workoutHistory.filter(x=>x.key!==key)}))}>Вернуть в план</button>}</div></div></article>:<div className="rest-day"><Moon size={32}/><Eyebrow>ВОССТАНОВЛЕНИЕ</Eyebrow><h2>{selectedDay===6?'День отдыха':'Активное восстановление'}</h2><p>20 минут спокойной прогулки, лёгкая мобильность и время для себя.</p><Btn secondary onClick={()=>go({page:'habits'})}>Открыть привычки<ChevronRight/></Btn></div>}
  </section>;
}
