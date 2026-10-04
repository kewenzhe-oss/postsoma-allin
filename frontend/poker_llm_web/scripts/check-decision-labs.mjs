import assert from 'node:assert/strict'
import { countAvailableCombos, pureBluffMath, DECISION_LABS } from '../src/training/drills/decision-labs-v1.js'
import { createLabSession, loadLabState, recordLabAnswer } from '../src/utils/training/decisionLabTraining.js'
assert.equal(countAvailableCombos('AK'),16)
assert.equal(countAvailableCombos('AK',['As']),12)
assert.equal(countAvailableCombos('AK',['As','Ah']),8)
assert.equal(countAvailableCombos('AA'),6)
assert.equal(countAvailableCombos('AA',['As']),3)
assert.equal(countAvailableCombos('AKs',['As','Kh']),2)
assert.equal(countAvailableCombos('AKo',['As']),9)
assert.equal(countAvailableCombos('AKo',['As','Ah']),6)
assert.ok(Math.abs(pureBluffMath(20,10,40).ev-2)<1e-9)
assert.ok(Math.abs(pureBluffMath(20,10,100/3).ev)<1e-9)
assert.equal(pureBluffMath(20,10,25).ev,-2.5)
assert.equal(pureBluffMath(20,10,0).ev,-10)
assert.equal(pureBluffMath(20,10,100).ev,20)
const values=new Map()
globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}
for(const kind of ['combos','bluff','board','position']) {
 const lab=DECISION_LABS[kind], questions=lab.lessons.flatMap(lesson=>lesson.steps)
 assert.equal(questions.length,12)
 assert.equal(new Set(questions.map(question=>question.id)).size,12)
 for(const question of questions) {
  assert.equal(new Set(question.options.map(option=>option.label.zh)).size,question.options.length)
  assert.equal(question.options.filter(option=>option.id===question.correctId).length,1)
  for(const lang of ['zh','en']) assert.ok(question.title[lang]&&question.context[lang]&&question.explanation[lang])
 }
 const session=createLabSession(kind,42)
 assert.equal(session.length,6)
 assert.deepEqual(session,createLabSession(kind,42))
 const question=session[0]
 recordLabAnswer(kind,{id:question.id,selectedId:question.options.find(option=>option.id!==question.correctId).id})
 assert.deepEqual(loadLabState(kind).mistakes,[question.id])
 assert.deepEqual(createLabSession(kind,42,loadLabState(kind).mistakes).map(question=>question.id),[question.id])
 recordLabAnswer(kind,{id:question.id,selectedId:question.correctId})
 assert.equal(loadLabState(kind).mistakes.length,0)
}
delete globalThis.localStorage
console.log('Decision labs passed: card removal, bluff EV, unique bilingual answers, paired sessions, isolated mistake records.')

const expectedBoards = [['Flush','High Card'],['Straight','High Card'],['Full House','Three of a Kind'],['Pair','Three of a Kind'],['Full House','Two Pair'],['Straight','High Card']]
DECISION_LABS.board.lessons.forEach((lesson,i)=>lesson.steps.forEach((question,j)=>{
 assert.equal(question.correctId,expectedBoards[i][j])
 assert.equal(new Set(question.cards).size,6)
 assert.deepEqual(lesson.steps[0].cards.slice(0,5),question.cards.slice(0,5),'Only the turn may change')
}))

const { stackToPot, frozenCheckEv } = await import('../src/training/drills/position-spr-v1.js')
assert.equal(stackToPot(40,80,20),2)
assert.equal(stackToPot(100,80,20),4)
assert.equal(frozenCheckEv(20,50,60),6)
assert.equal(frozenCheckEv(20,50,100),10)
assert.equal(frozenCheckEv(20,50,0),0)
assert.throws(()=>stackToPot(10,20,0))
assert.throws(()=>frozenCheckEv(Infinity,50,100))
const expectedPosition = [[10,2],[2,4],[3,8],[6,10],[6,12],[8,10]]
DECISION_LABS.position.lessons.forEach((lesson,i)=>lesson.steps.forEach((question,j)=>{
 assert.equal(Number(question.options.find(option=>option.id===question.correctId).label.en),expectedPosition[i][j])
}))
for(let seed=0;seed<12;seed++) {
 const session=createLabSession('position',seed)
 assert.equal(session.filter(question=>question.id.startsWith('spr-')).length,2)
 assert.equal(session.filter(question=>question.id.startsWith('position-')).length,4)
}
console.log('Position lab passed: effective stacks, branch EV, known answers and balanced paired sessions.')
