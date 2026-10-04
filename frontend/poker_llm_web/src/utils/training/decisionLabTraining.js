import { variedSelection } from './sessionVariation.js'
import { DECISION_LABS } from '../../training/drills/decision-labs-v1.js'
export function loadLabState(kind) {
  const lab = DECISION_LABS[kind]
  const empty = { version:lab.version, mistakes:[], answers:[] }
  try {
    if(typeof localStorage==='undefined') return empty
    const saved=JSON.parse(localStorage.getItem(`postsoma_${lab.version}`)||'null')
    if(saved?.version!==lab.version||!Array.isArray(saved.mistakes)||!Array.isArray(saved.answers)) return empty
    const ids=new Set(lab.lessons.flatMap(lesson=>lesson.steps.map(step=>step.id)))
    return { version:lab.version, mistakes:[...new Set(saved.mistakes.filter(id=>ids.has(id)))], answers:saved.answers.filter(answer=>ids.has(answer?.id)).slice(0,80) }
  } catch { return empty }
}
export function recordLabAnswer(kind, {id,selectedId}) {
  const lab=DECISION_LABS[kind]
  const question=lab.lessons.flatMap(lesson=>lesson.steps).find(step=>step.id===id)
  if(!question?.options.some(option=>option.id===selectedId)) throw new Error('Invalid lab answer')
  const state=loadLabState(kind), mistakes=new Set(state.mistakes)
  const isCorrect=selectedId===question.correctId
  if(isCorrect) mistakes.delete(id); else mistakes.add(id)
  const next={...state,mistakes:[...mistakes],answers:[{id,selectedId,isCorrect,answeredAt:new Date().toISOString()},...state.answers].slice(0,80)}
  try { if(typeof localStorage!=='undefined') localStorage.setItem(`postsoma_${lab.version}`,JSON.stringify(next)) } catch { /* Remains usable with blocked storage. */ }
  return next
}
export function createLabSession(kind, seed, mistakes=null, previousIds=[]) {
  const lab=DECISION_LABS[kind]
  if(mistakes) return lab.lessons.flatMap(lesson=>lesson.steps).filter(step=>mistakes.includes(step.id)).slice(0,6)
  const previousLessons=lab.lessons.filter(lesson=>lesson.steps.some(step=>previousIds.includes(step.id))).map(lesson=>lesson.id)
  const pick=(items,count)=>variedSelection(items,count,seed,previousLessons)
  const lessons=kind==='position' ? [...pick(lab.lessons.slice(0,3),1),...pick(lab.lessons.slice(3),2)] : kind==='combos' ? [...pick(lab.lessons.slice(0,4),2),...pick(lab.lessons.slice(4),1)] : pick(lab.lessons,3)
  return lessons.flatMap(lesson=>lesson.steps)
}
