import { POSITION_SPR_LAB } from './position-spr-v1.js'
import { BOARD_CHANGE_LAB } from './board-changes-v1.js'
const text = (zh, en) => ({ zh, en })
const makeQuestion = (id, title, context, values, correctId, explanation) => {
  const options = values.map(([id, zh, en]) => ({ id, label: text(zh, en) }))
  const offset = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % options.length
  return { id, title, context, options: [...options.slice(offset), ...options.slice(0, offset)], correctId, explanation }
}
export function countAvailableCombos(hand, known = []) {
  const deck = [...'AKQJT98765432'].flatMap(rank => [...'shdc'].map(suit => rank + suit)).filter(card => !known.includes(card))
  let count = 0
  for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) {
    const a = deck[i], b = deck[j]
    if (!((a[0] === hand[0] && b[0] === hand[1]) || (a[0] === hand[1] && b[0] === hand[0]))) continue
    if (hand[2] === 's' && a[1] !== b[1]) continue
    if (hand[2] === 'o' && a[1] === b[1]) continue
    count++
  }
  return count
}
const cardLabel = card => card[0] + ({s:'♠',h:'♥',d:'♦',c:'♣'})[card[1]]
const countPairs = [['AK',['As'],['As','Ah']], ['AA',[],['As']], ['AKs',['As'],['As','Kh']], ['AKo',['As'],['As','Ah']]]
const comboLessons = countPairs.map(([hand, first, changed], index) => {
  const steps = [first, changed].map((known, step) => {
    const count = countAvailableCombos(hand, known)
    const shown = known.map(cardLabel).join('、') || '∅'
    return makeQuestion(`combos-${index}-${step}`, text(`${step ? '改变一个条件 · ' : ''}${hand} 还剩多少合法组合？`, `${step ? 'Change one condition · ' : ''}How many legal ${hand} combos remain?`), text(`已知牌：${shown}。这些牌已离开未知牌堆，不能出现在对手手中。${step ? '仅改变已知牌集合，目标手牌不变。' : '先排除已知牌，再考虑同花或不同花限制。'}`, `Known cards: ${shown}. These cards cannot be in the opponent’s hand. ${step ? 'Only the known-card set changes; the target hand stays fixed.' : 'Remove known cards, then apply suited or offsuit restrictions.'}`), [[String(count),String(count),String(count)], ['wrong-high',String(count+3),String(count+3)], ['wrong-low',String(Math.max(0,count-1)),String(Math.max(0,count-1))]], String(count), text(`排除 ${shown} 后逐一枚举，${hand} 有 ${count} 个合法组合。组合数量本身不代表对手一定会采用某个行动。`, `Enumerating after removing ${shown} leaves ${count} legal ${hand} combos. Combo counts alone do not specify an opponent’s action.`))
  })
  return { id: `combo-lesson-${index}`, steps }
})
for (const [index, first, changed] of [[4,'As','Ks'],[5,'Qs','Ks']]) {
  comboLessons.push({ id:`combo-lesson-${index}`, steps:[first,changed].map((card, step)=>{
    const value=countAvailableCombos('AK',[card]), bluff=countAvailableCombos('KQ',[card])
    const fraction= `${bluff} / ${value+bluff}`
    return makeQuestion(`blocker-${index}-${step}`, text(`${step?'改变一个条件 · ':''}移除阻断组合后，诈唬占比是多少？`, `${step?'Change one condition · ':''}What is the bluff share after card removal?`), text(`冻结河牌范围：AK 全部作为价值牌，KQ 全部作为诈唬；每个合法组合等权。已知牌为 ${cardLabel(card)}。${step?'仅替换这张已知牌，其他假设保持不变。':''}这是假想分类，不是对真实对手的策略预测。`, `Frozen river range: every AK combo is value and every KQ combo is a bluff, all equally weighted. Known card: ${cardLabel(card)}. ${step?'Only this known card changes; other assumptions stay fixed.':''} These are hypothetical roles, not predictions of real strategy.`), [['share',fraction,fraction],['half','50%（不考虑阻断）','50% (ignore blockers)'],['zero','0%','0%']], 'share', text(`AK 剩 ${value} 个，KQ 剩 ${bluff} 个。诈唬占比 = ${fraction} ≈ ${(100*bluff/(value+bluff)).toFixed(2)}%。阻断价值与阻断诈唬可能产生不同影响；不能只凭“有 blocker”决定行动。`, `AK has ${value} remaining combos; KQ has ${bluff}. Bluff share = ${fraction} ≈ ${(100*bluff/(value+bluff)).toFixed(2)}%. Blocking value and blocking bluffs can have different effects; having a blocker alone does not determine the action.`))
  }) })
}
// Avoid identical choices when the replacement card makes the range exactly balanced.
comboLessons.flatMap(lesson=>lesson.steps).forEach(question=>{
  if (question.id.startsWith('blocker') && question.id.endsWith('-1')) {
    const alternative=question.options.find(option=>option.id==='half')
    alternative.label=text('25%', '25%')
  }
})
export function pureBluffMath(pot, bet, foldPct) {
  if (!(pot > 0 && bet > 0 && foldPct >= 0 && foldPct <= 100)) throw new Error('Invalid bluff model inputs')
  return { thresholdPct: 100*bet/(pot+bet), ev: foldPct/100*pot-(1-foldPct/100)*bet }
}
const bluffLessons = [[20,10],[30,10],[40,40],[20,40],[60,20],[80,40]].map(([pot,bet],index)=>{
  const threshold=pureBluffMath(pot,bet,0).thresholdPct
  const required=Number(threshold.toFixed(2))+'%'
  const fold= index===4 ? threshold : Number((threshold+(index%2 ? -10 : 5)).toFixed(2))
  const truth=pureBluffMath(pot,bet,fold)
  const correct=Math.abs(truth.ev)<1e-9?'tie':truth.ev>0?'positive':'negative'
  const originalFold=Number((threshold+10).toFixed(2))
  const context=text(`冻结河牌模型：底池 ${pot} BB，下注 ${bet} BB；被跟注后必输，对手只能跟注或弃牌，无抽水、加注和后续下注。比较下注与过牌放弃（EV = 0）。对手弃牌率暂设为 ${originalFold}%。`, `Frozen river model: pot ${pot} BB, bet ${bet} BB; always lose when called. Opponent can only call or fold. No rake, raises or future betting. Compare betting with checking and giving up (EV = 0). Initial fold frequency: ${originalFold}%.`)
  return { id:`bluff-lesson-${index}`, steps:[
    makeQuestion(`bluff-price-${index}`,text('主动下注 · 需要多少弃牌率才能保本？','Betting price · What fold frequency breaks even?'),context, [['threshold',required,required],['call-price',(100*bet/(pot+2*bet)).toFixed(2)+'%',(100*bet/(pot+2*bet)).toFixed(2)+'%'],['all','100%','100%']], 'threshold',text(`保本弃牌率 = ${bet} / (${pot} + ${bet}) ≈ ${required}。对手弃牌时赢原底池，被跟注时损失下注；这与跟注权益门槛的分母不同。`, `Break-even fold frequency = ${bet} / (${pot} + ${bet}) ≈ ${required}. Win the starting pot on a fold and lose the bet on a call. This denominator differs from the calling equity threshold.`)),
    makeQuestion(`bluff-change-${index}`,text('改变一个条件 · 对手按给定频率弃牌，下注 EV 怎样？','Change one condition · What is bet EV at the supplied fold frequency?'),text(context.zh+` 仅把弃牌率从 ${originalFold}% 改为 ${Number(fold.toFixed(4))}%${index===4?'（精确保本值）':''}。`,context.en+` Only fold frequency changes from ${originalFold}% to ${Number(fold.toFixed(4))}%${index===4?' (exact break-even value)':''}.`), [['positive','下注 EV > 0','Bet EV > 0'],['negative','下注 EV < 0','Bet EV < 0'],['tie','下注 EV = 0，与放弃等价','Bet EV = 0, equivalent to giving up']],correct,text(`下注 EV = 弃牌率 × ${pot} − (1 − 弃牌率) × ${bet} = ${truth.ev.toFixed(2)} BB。结论依赖这个零摊牌权益模型；有摊牌价值或后续下注时需要重新建模。`, `Bet EV = fold frequency × ${pot} − (1 − fold frequency) × ${bet} = ${truth.ev.toFixed(2)} BB. This relies on zero showdown equity; showdown value or further betting requires a new model.`))
  ] }
})
export const DECISION_LABS = {
  board: BOARD_CHANGE_LAB,
  position: POSITION_SPR_LAB,
  combos:{ version:'combos-blockers-v1',title:text('组合与阻断牌','Combos and blockers'),intro:text('12 道组合与范围占比练习。每轮选取三个案例，逐题改变一个条件；已知牌会移除组合，不直接裁定行动。','12 combo and range-share exercises. Each round contains three cases with one changed condition each; card removal does not directly determine strategy.'),lessons:comboLessons },
  bluff:{version:'pure-bluff-v1',title:text('主动下注价格','Betting price'),intro:text('12 道零摊牌权益的河牌数学题。每轮三个案例，比较诈唬保本弃牌率与下注 EV；行动倾向由题设给定。','12 zero-showdown-equity river math exercises. Three cases per round compare break-even fold frequency and betting EV; opponent behavior is assumed.'),lessons:bluffLessons }
}
