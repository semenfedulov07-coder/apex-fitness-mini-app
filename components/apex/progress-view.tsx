'use client';

import {ArrowRight,CalendarCheck,Flame,MinusCircle,Plus,TrendingDown,TrendingUp} from 'lucide-react';
import {dayKey} from '@/lib/apex/data';
import type {Program,Route,State,WorkoutRecord} from '@/lib/apex/models';
import {Bar,Btn,SectionHead,Title} from './ui';

const weekLabels=['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];

type Props={state:State;active?:Program;go:(route:Route)=>void;onAddWeight:()=>void};

export function ProgressView({state,active,go,onAddWeight}:Props){
  const done=active?state.completed.filter(id=>id.startsWith(`${active.id}:`)).length:0;
  const progress=active?Math.min(100,Math.round(done/active.sessions*100)):0;
  const weightChange=(state.weights.at(-1)?.value||0)-(state.weights[0]?.value||0);
  const history=[...state.workoutHistory].sort((a,b)=>b.date.localeCompare(a.date));
  const completedCount=Math.max(history.filter(item=>item.status==='completed').length,state.completed.length);
  let streakValue=0;for(const item of history){if(item.status!=='completed')break;streakValue++;}
  const activity=Array.from({length:7},(_,index)=>{const date=new Date();date.setDate(date.getDate()-6+index);const key=dayKey(date);const workouts=history.filter(item=>item.status==='completed'&&dayKey(new Date(item.date))===key).length;const habits=state.habits[key]?.length||0;return {date,key,workouts,habits,score:Math.min(100,workouts*55+habits*9)};});
  const activeDays=activity.filter(item=>item.workouts||item.habits).length;
  return <>
    <Title kicker="ТВОЯ СЛЕДУЮЩАЯ ВЕРСИЯ" title="Прогресс — в деталях." copy="Здесь остаётся только то, что ты действительно сделал."/>
    <section className="progress-lead">
      <div className="progress-lead-main"><span>ВЫПОЛНЕНО ТРЕНИРОВОК</span><strong>{completedCount.toString().padStart(2,'0')}</strong><p>{active?`${active.name} · ${done} из ${active.sessions}`:'Выбери программу, чтобы начать цикл'}</p></div>
      <div className="progress-kpis">
        <article><span>ПРОГРАММА</span><strong>{progress}<small>%</small></strong><Bar value={progress}/></article>
        <article><span>СЕРИЯ ТРЕНИРОВОК</span><strong>{streakValue}<small> подряд</small></strong><Flame/></article>
        <article><span>ИЗМЕНЕНИЕ ВЕСА</span><strong>{weightChange>0?'+':''}{weightChange.toFixed(1)}<small> кг</small></strong>{weightChange<=0?<TrendingDown/>:<TrendingUp/>}</article>
        <article><span>АКТИВНОСТЬ ЗА 7 ДНЕЙ</span><strong>{activeDays}<small> / 7</small></strong><CalendarCheck/></article>
      </div>
    </section>
    <section className="weight-section"><div className="weight-heading"><div><SectionHead title="Динамика веса"/><p>Текущий вес <strong>{state.weights.at(-1)?.value||0} кг</strong></p></div><button onClick={onAddWeight}>Добавить точку <Plus/></button></div><WeightChart weights={state.weights}/></section>
    <div className="progress-editorial-grid">
      <section className="weekly-activity"><SectionHead title="Активность недели"/><div className="activity-bars">{activity.map(item=><div key={item.key} className={item.workouts?'trained':''}><span>{item.workouts?`${item.workouts}×`:item.habits||'—'}</span><div style={{height:`${Math.max(5,item.score)}%`}}/><small>{weekLabels[(item.date.getDay()+6)%7]}</small></div>)}</div><p className="fine">Лайм отмечает тренировку. Остальная высота формируется из выполненных привычек.</p></section>
      <section className="program-progress-block"><span>ТЕКУЩИЙ ЦИКЛ</span><h2>{active?.name||'Программа не выбрана'}</h2><p>{active?.goal||'Открой каталог и выбери цель, с которой начнётся твой прогресс.'}</p><Bar value={progress}/><div><strong>{progress}%</strong><small>{active?`${Math.max(0,active.sessions-done)} тренировок впереди`:'Пока без активности'}</small></div><Btn secondary onClick={()=>go({page:active?'plan':'programs'})}>{active?'Продолжить план':'Выбрать программу'}<ArrowRight/></Btn></section>
    </div>
    <section className="recent-workouts"><SectionHead title="Последние тренировки"/>{history.length?<div className="recent-list">{history.slice(0,6).map(item=><WorkoutRow key={item.id} item={item} program={state.programs.find(program=>program.id===item.programId)}/>)}</div>:<div className="recent-empty"><span>00</span><div><h3>История начнётся после первой тренировки.</h3><p>Вес, подходы, длительность и статус появятся здесь автоматически.</p></div><Btn secondary onClick={()=>go({page:active?'plan':'programs'})}>{active?'Открыть план':'Выбрать программу'}<ArrowRight/></Btn></div>}</section>
  </>;
}

function WorkoutRow({item,program}:{item:WorkoutRecord;program?:Program}){return <article><time>{new Date(item.date).toLocaleDateString('ru-RU',{day:'2-digit',month:'short'})}</time><div><strong>{item.title}</strong><small>{program?.name||'APEX'} · {item.completedSets}/{item.totalSets} подходов</small></div><span>{item.duration?`${item.duration} мин`:'—'}</span><span className={`history-status ${item.status}`}>{item.status==='completed'?<CalendarCheck/>:<MinusCircle/>}{item.status==='completed'?'Выполнено':'Пропущено'}</span></article>}

function WeightChart({weights}:{weights:State['weights']}){
  const points=weights.slice(-10);const min=Math.min(...points.map(x=>x.value))-1;const max=Math.max(...points.map(x=>x.value))+1;const coords=points.map((point,index)=>({x:45+index/Math.max(1,points.length-1)*690,y:178-(point.value-min)/(max-min)*135,...point}));
  return <div className="weight-chart"><svg viewBox="0 0 780 225" role="img" aria-label={`График веса: ${points.map(point=>`${point.date}: ${point.value} кг`).join(', ')}`}>{[40,85,130,178].map(y=><line key={y} x1="45" x2="735" y1={y} y2={y}/>) }<polyline points={coords.map(point=>`${point.x},${point.y}`).join(' ')} fill="none"/>{coords.map(point=><g key={point.date}><circle cx={point.x} cy={point.y} r="5"/><text x={point.x} y={point.y-15} textAnchor="middle">{point.value}</text><text className="axis-label" x={point.x} y="213" textAnchor="middle">{point.date.slice(5).split('-').reverse().join('.')}</text></g>)}</svg></div>;
}
