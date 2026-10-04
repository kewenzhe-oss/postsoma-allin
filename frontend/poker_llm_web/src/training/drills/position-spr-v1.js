const text=(zh,en)=>({zh,en})
export function stackToPot(hero,villain,pot) {
 if(![hero,villain,pot].every(Number.isFinite)||hero<0||villain<0||pot<=0) throw new Error('Invalid SPR inputs')
 return Math.min(hero,villain)/pot
}
export function frozenCheckEv(pot,equityPct,reachPct) {
 if(![pot,equityPct,reachPct].every(Number.isFinite)||!(pot>0&&equityPct>=0&&equityPct<=100&&reachPct>=0&&reachPct<=100)) throw new Error('Invalid tree inputs')
 return pot*equityPct/100*reachPct/100
}
const make=(id,title,context,value,explanation)=>{
 const choices=[{id:'correct',label:text(String(value),String(value))},{id:'high',label:text(String(value+2),String(value+2))},{id:'low',label:text(String(Math.max(0,value-1)),String(Math.max(0,value-1)))}]
 const offset=[...id].reduce((sum,char)=>sum+char.charCodeAt(0),0)%3
 return {id,title,context,correctId:'correct',options:[...choices.slice(offset),...choices.slice(0,offset)],explanation}
}
const sprCases=[[100,100,10,20],[40,80,20,100],[80,30,10,120]]
const sprLessons=sprCases.map(([hero,villain,pot,changed],index)=>({id:`spr-case-${index}`,steps:[0,1].map(step=>{
 const h=step&&index!==2?changed:hero, v=step&&index===2?changed:villain
 const spr=stackToPot(h,v,pot)
 return make(`spr-${index}-${step}`,text(`${step?'改变一个条件 · ':''}有效筹码与底池之比 SPR 是多少？`,`${step?'Change one condition · ':''}What is the effective stack-to-pot ratio?`),text(`单挑，Hero 剩余 ${h} BB，对手剩余 ${v} BB，当前底池 ${pot} BB。${step?`仅改变${index===2?'对手':'Hero'}剩余筹码，底池与另一方筹码不变。`:''}使用行动前的剩余筹码，不包含已经进入底池的投入。`,`Heads-up: Hero has ${h} BB remaining, opponent has ${v} BB, pot is ${pot} BB. ${step?`Only ${index===2?'the opponent’s':'Hero’s'} remaining stack changes; the other stack and pot stay fixed.`:''} Use remaining stacks before the action, excluding chips already in the pot.`),spr,text(`有效筹码 = min(${h}, ${v}) = ${Math.min(h,v)} BB；SPR = ${Math.min(h,v)} / ${pot} = ${spr}。它描述后续投入空间，不能单独决定某手牌是否全下或跟注。`,`Effective stack = min(${h}, ${v}) = ${Math.min(h,v)} BB; SPR = ${Math.min(h,v)} / ${pot} = ${spr}. This describes the room for further investment, not a standalone shove or call rule.`))
})}))
const treeCases=[[20,50,40],[30,40,50],[40,25,20]]
const treeLessons=treeCases.map(([pot,equity,betPct],index)=>({id:`position-case-${index}`,steps:[0,1].map(step=>{
 const reach=step?100:100-betPct
 const ev=frozenCheckEv(pot,equity,reach)
 const context=text(`冻结河牌模型：底池 ${pot} BB，无抽水。${step?'Hero 有位置：对手已经过牌，Hero 过牌后直接摊牌。':`Hero 无位置：Hero 过牌后，对手以 ${betPct}% 概率下注，按题设固定策略 Hero 弃牌；其余情况下对手过牌，直接摊牌。`}所有摊牌分支的 Hero 赢率都明确给定为 ${equity}%，无平局、无额外 Hero 投入；弃牌分支从当前决定起 EV = 0。${step?'改变的条件是行动位置及对应的题设过牌路径，底池与摊牌分支赢率保持不变。':''}这是教学决策树，不是实际对手或最优策略。`,`Frozen river model: pot ${pot} BB, no rake. ${step?'Hero is in position: the opponent has checked; Hero checks back to showdown.':`Hero is out of position: after checking, the opponent bets with ${betPct}% probability and Hero folds by the specified policy; otherwise the opponent checks to showdown.`} Hero wins ${equity}% on every showdown branch, explicitly assumed, with no ties or additional Hero investment. Folding has zero EV from this decision onward. ${step?'The position and corresponding specified check path change; pot and showdown-branch win rate stay fixed.':''} This is a teaching tree, not real opponent behavior or optimal strategy.`)
 const branches=step?text(`100% → 摊牌 → 赢率 ${equity}%`,`100% → showdown → ${equity}% wins`):text(`${betPct}% → 面对下注弃牌 → EV 0；${reach}% → 摊牌 → 赢率 ${equity}%`,`${betPct}% → fold to bet → EV 0; ${reach}% → showdown → ${equity}% wins`)
 return {...make(`position-${index}-${step}`,text(`${step?'改变条件 · ':''}按给定过牌路径，EV 是多少 BB？`,`${step?'Change conditions · ':''}What is EV along the specified check path, in BB?`),context,ev,text(`过牌路径 EV = ${reach}% × ${equity}% × ${pot} = ${ev} BB。${step?'过牌后可以直接摊牌，这个模型没有被迫弃牌的分支。':'部分分支在摊牌前弃牌，不能把题设摊牌赢率直接乘整个底池作为路径 EV。'}比较依赖所给行动概率和策略；它不证明有位置在所有真实局面都能获得这个数值的优势，也不评价题设弃牌策略是否最优。`,`Check-path EV = ${reach}% × ${equity}% × ${pot} = ${ev} BB. ${step?'Checking back leads directly to showdown, with no forced-fold branch in this model.':'Some branches fold before showdown; multiplying the showdown win rate by the whole pot alone would omit those branches.'} The comparison depends on the assumed likelihoods and policy; it does not quantify a universal positional edge or claim the folding policy is optimal.`)),tree:branches}
})}))
export const POSITION_SPR_LAB={version:'position-spr-v1',title:text('位置、SPR 与权益实现','Position, SPR and equity realization'),intro:text('12 道题，每轮三个案例及条件变化，共 6 题。先建立有效筹码与底池比例，再观察给定行动路径如何影响权益兑现。','12 exercises, three cases and changed conditions per round, six questions total. Establish effective stack-to-pot ratios, then inspect how specified action paths affect equity realization.'),lessons:[...sprLessons,...treeLessons]}
