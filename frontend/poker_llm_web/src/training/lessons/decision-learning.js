import { evaluateFoldCallDecision } from '../../utils/training/potOddsTraining.js'
import { getPreflopExplanation } from '../explanations/preflop-explanations.js'

const pair = (zh, en) => ({ zh, en })
const option = (id, zh, en) => ({ id, label: pair(zh, en) })
const question = (id, title, options, correctId, explanation) => {
  // Keep replay order stable without placing every correct answer first.
  const offset = [...title.en].reduce((sum, char) => sum + char.charCodeAt(0), 0) % options.length
  return { id, title, options: [...options.slice(offset), ...options.slice(0, offset)], correctId, explanation }
}

export const GUIDED_CASE = {
  title: pair('用一手河牌决定走完五问', 'Walk through five questions on the river'),
  context: pair(
    '单挑 · 河牌 · Hero 在 Button，持 Q♠ Q♥。公共牌 A♣ 7♦ 4♠ 2♣ 9♥。下注前底池 12 BB；BB 剩余 6 BB，全下 6 BB；Hero 剩余 30 BB，可以弃牌或跟注。无抽水。',
    'Heads-up river. Hero is on the Button with Q♠ Q♥. Board: A♣ 7♦ 4♠ 2♣ 9♥. Pot before the bet: 12 BB. BB has 6 BB left and shoves 6 BB; Hero has 30 BB left and may fold or call. No rake.'),
  assumption: pair(
    '冻结题设：对手下注范围只含 8 个 AK 组合和 4 个 KJ 组合，各组合权重相同。QQ 输给所有 AK，赢过所有 KJ，无平局。这是为教学指定的范围，不是根据对手行动推算的真实范围。',
    'Frozen assumption: the betting range contains only 8 AK combos and 4 KJ combos, equally weighted. QQ loses to every AK and beats every KJ, with no ties. This range is specified for teaching, not inferred from the action.'),
  steps: [
    question('hand', pair('Hand · 这手 QQ 在这里是什么角色？', 'Hand · What role does QQ play here?'), [option('catch', '能赢诈唬、输给价值牌的 bluff catcher', 'A bluff catcher: beats bluffs, loses to value'), option('nuts', '绝对最强牌', 'The nuts'), option('draw', '需要下一张牌改善的听牌', 'A draw needing another card')], 'catch', pair('QQ 是一对。面对题设范围，它只赢 KJ。河牌没有下一张牌，所以不能依靠听牌改善。', 'QQ is one pair and beats only KJ in this range. There is no next card on the river.')),
    question('context', pair('Context · 跟注后还需要规划下一街吗？', 'Context · Is another street decision needed after calling?'), [option('end', '不需要；河牌面对全下，跟注后摊牌', 'No: river all-in, then showdown'), option('turn', '需要预留转牌投入', 'Reserve chips for the turn'), option('stack', '需要投入 Hero 剩余的全部 30 BB', 'Invest all of Hero’s remaining 30 BB')], 'end', pair('面对的价格是 6 BB，而不是自己的全部筹码。跟注后无后续下注，适合使用直接摊牌的数学模型。', 'The price is 6 BB, not Hero’s entire stack. Calling ends betting, so a showdown model applies.')),
    question('range', pair('Range · 按冻结范围，QQ 的权益是多少？', 'Range · What is QQ’s equity against the frozen range?'), [option('third', '4 / 12 ≈ 33.3%', '4 / 12 ≈ 33.3%'), option('half', 'AK 和 KJ 两类，所以是 50%', 'Two hand categories, so 50%'), option('zero', '公共牌有 A，所以是 0%', 'There is an ace on board, so 0%')], 'third', pair('按组合权重计算，而不是按牌型名称计数。12 个等权组合中赢 4 个，因此权益为 1/3。', 'Count weighted combos, not category names: 4 wins out of 12 equally weighted combos gives 1/3 equity.')),
    question('price', pair('Price · 最终底池和最低权益门槛是多少？', 'Price · What are the final pot and equity threshold?'), [option('quarter', '24 BB；6 / 24 = 25%', '24 BB; 6 / 24 = 25%'), option('third', '18 BB；6 / 18 ≈ 33.3%', '18 BB; 6 / 18 ≈ 33.3%'), option('half', '12 BB；6 / 12 = 50%', '12 BB; 6 / 12 = 50%')], 'quarter', pair('最终底池包含原底池、对手下注和自己的跟注：12 + 6 + 6 = 24 BB。价格门槛为 25%。', 'The final pot includes the original pot, bet and call: 12 + 6 + 6 = 24 BB. The threshold is 25%.')),
    question('risk', pair('Risk · 哪个信息改变会使结论需要重算？', 'Risk · Which change requires recalculating the conclusion?'), [option('range', '对手真实的诈唬占比低于题设', 'The actual bluff share is lower than assumed'), option('loss', '这次跟注最后输掉了', 'This particular call loses'), option('spent', '前面已经投入了筹码', 'Hero already invested chips earlier')], 'range', pair('范围是假设，门槛是数学。如果真实诈唬占比低于 25%，这个模型下跟注就会变成负 EV；一次输牌不能证明原推理错误。', 'The range is assumed; the threshold is mathematical. Below 25% actual bluffs, calling becomes negative EV in this model. One loss does not disprove the reasoning.')),
    question('decision', pair('Decision · 在这些条件下，你会怎么做？', 'Decision · What do you choose under these assumptions?'), [option('call', '跟注', 'Call'), option('fold', '弃牌', 'Fold')], 'call', pair('跟注 EV = (1/3 × 24) − 6 = +2 BB；弃牌从此刻计算为 0 BB。跟注优于弃牌，但并不保证这一手获胜。结论只适用于这个冻结范围、无抽水且无后续下注的题设。', 'Call EV = (1/3 × 24) − 6 = +2 BB; folding is 0 BB from this decision onward. Calling is better but does not guarantee a win. This conclusion applies only to the frozen range, no rake and no further betting.'))
  ]
}

export function createReasoningFollowups(kind, input, action) {
  if (kind === 'preflop') {
    const frequency = input.baseline.frequencies[action]
    const handExplanation = getPreflopExplanation(input.explanationKey)
    return [
      question('reason', pair(`关键理由 · 哪个解释符合 ${input.hero.canonicalHand} 的当前参考？`, `Key reason · Which explanation fits the current reference for ${input.hero.canonicalHand}?`), [
        option('reference', handExplanation.zh, handExplanation.en),
        option('guarantee', '只要属于参考范围，这手就一定能赢', 'An action in the reference guarantees a win'),
        option('universal', '任何位置、筹码深度都应采用同一行动', 'Use the same action at every position and stack depth')
      ], 'reference', pair(`${input.hero.canonicalHand} 的 ${action} 在 baseline-v1 中为 ${frequency}%。这只是 HU · SB/Button · 100 BB · 首入池 · 开池 2.5 BB 的内部参考；不是 Solver 裁决，也不能从单次行动检验混合频率。`, `${action} has ${frequency}% frequency for ${input.hero.canonicalHand} in baseline-v1. This is an internal HU SB/Button 100 BB unopened-pot reference with a 2.5 BB open, not a solver verdict. One action cannot validate a mixed frequency.`)),
      question('variation', pair('改变一个条件 · 只把有效筹码从 100 BB 改为 20 BB，其他条件保持不变。可以沿用原频率吗？', 'Change one condition · Effective stacks become 20 BB instead of 100 BB; everything else stays fixed. Can you reuse the frequencies?'), [
        option('recheck', '不能直接沿用；需要对应 20 BB 的参考', 'No direct reuse: obtain a matching 20 BB reference'),
        option('same', '可以；手牌没有变化', 'Yes: the hand is unchanged'),
        option('always', '不管什么手牌都应全下', 'Always shove every hand')
      ], 'recheck', pair('筹码深度影响后续空间与行动价值。这里评价的是识别适用边界，不提供未经验证的 20 BB 行动答案。', 'Stack depth changes future play and action values. This checks scope recognition; it does not invent a 20 BB strategy answer.'))
    ]
  }
  const truth = evaluateFoldCallDecision(input)
  const changedEquity = Number((truth.requiredEquityPct + (truth.isBreakEven || truth.correctAction === 'Call' ? -5 : 5)).toFixed(2))
  const changedInput = { ...input, heroEquityPct: changedEquity }
  const variant = evaluateFoldCallDecision(changedInput)
  return [
    question('reason', pair('关键理由 · 这个数学模型的行动依据是什么？', 'Key reason · What determines the action in this math model?'), [
      option('compare', '比较题设权益与跟注额 / 最终底池；相等时收支平衡', 'Compare stated equity with call / final pot; equality is break-even'),
      option('outs', '只要听牌命中概率高，就一定跟注', 'A high draw-hit probability always means call'),
      option('sunk', '前面投入越多，现在越应该跟注', 'More previous investment means you should call')
    ], 'compare', pair('依据冻结题设权益，而不是从牌面猜测的胜率。模型不含抽水和未来下注，之前的投入不应成为继续投入的理由。', 'Use the frozen equity assumption, not an equity guess from the board. The model excludes rake and future betting; prior investment is not a reason to invest more.')),
    { ...question('variation', pair(`改变一个条件 · 只把 Hero equity 从 ${input.heroEquityDisplay || input.heroEquityPct + '%'} 改为 ${changedEquity.toFixed(2)}%。底池与下注保持不变，怎样选择？`, `Change one condition · Only Hero equity changes from ${input.heroEquityDisplay || input.heroEquityPct + '%'} to ${changedEquity.toFixed(2)}%. Pot and bet stay fixed. What do you choose?`), [option('Call', '跟注', 'Call'), option('Fold', '弃牌', 'Fold')], variant.correctAction, pair(`门槛仍为 ${truth.requiredEquityPct.toFixed(2)}%。改变的是题设权益；新跟注 EV 为 ${variant.callEvBB.toFixed(2)} BB。行动变化来自条件变化，不是上一手输赢。`, `The threshold remains ${truth.requiredEquityPct.toFixed(2)}%. Only assumed equity changed; new call EV is ${variant.callEvBB.toFixed(2)} BB. The action changes because the assumption changed, not because of a hand result.`)), input: changedInput }
  ]
}
