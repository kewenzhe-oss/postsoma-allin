export const RANGE_UPDATING_VERSION = 'range-updating-v1'
const labels = { zh: ['强价值牌', '中等摊牌价值牌', '无摊牌价值牌'], en: ['Strong value hands', 'Medium showdown hands', 'Hands with no showdown value'] }
// Authored toy ranges. Frequencies are supplied hypotheses, not solver strategies.
const rows = [
  ['raise', [6, 12, 12], [80, 10, 30]],
  ['raise', [3, 12, 16], [90, 5, 25]],
  ['raise', [8, 20, 12], [70, 5, 20]],
  ['raise', [4, 12, 20], [80, 10, 25]],
  ['call', [6, 12, 12], [10, 70, 20]],
  ['call', [8, 6, 20], [60, 50, 10]],
  ['call', [4, 16, 8], [50, 70, 10]],
  ['call', [12, 8, 16], [70, 60, 5]],
  ['check', [6, 12, 12], [40, 70, 90]],
  ['check', [4, 20, 8], [30, 80, 90]],
  ['check', [12, 6, 8], [80, 70, 60]],
  ['check', [8, 12, 20], [20, 50, 80]]
]
const actions = { raise: { zh: '加注', en: 'raise' }, call: { zh: '跟注', en: 'call' }, check: { zh: '过牌', en: 'check' } }
export function updateRangeWeights(groups) {
  const weights = groups.map(group => group.combos * group.frequencyPct / 100)
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (!(total > 0)) throw new Error('Observed action has zero probability')
  return weights.map(weight => weight / total)
}
export const RANGE_UPDATING_QUESTIONS = Object.freeze(rows.map(([action, counts, frequencies], index) => {
  const groups = counts.map((combos, i) => ({ id: `group-${i}`, label: { zh: labels.zh[i], en: labels.en[i] }, combos, frequencyPct: frequencies[i] }))
  const posterior = updateRangeWeights(groups)
  const winner = posterior.indexOf(Math.max(...posterior))
  const describe = lang => groups.map((group, i) => `${group.label[lang]}: ${group.combos} × ${group.frequencyPct}% = ${(group.combos * group.frequencyPct / 100).toFixed(2)} → ${(posterior[i] * 100).toFixed(2)}%`).join('；')
  const offset = index % 3
  const options = groups.map(group => ({ id: group.id, label: group.label }))
  return Object.freeze({
    id: `${action}-${index + 1}`, version: RANGE_UPDATING_VERSION, action,
    title: { zh: `观察到对手${actions[action].zh}后，哪组占更新范围的比例最大？`, en: `After observing a ${actions[action].en}, which group has the largest updated range share?` },
    context: { zh: `这是一个河牌单挑的假想范围。${action === 'check' ? 'Hero 过牌，随后对手过牌。' : 'Hero 下注，随后对手' + actions[action].zh + '。'}以下三组互不重叠、覆盖题设全部范围；每组内组合等权。行动频率是题目给定假设，不是对真实对手的预测。`, en: `A hypothetical heads-up river range. ${action === 'check' ? 'Hero checks, then the opponent checks.' : 'Hero bets, then the opponent ' + (action === 'raise' ? 'raises.' : 'calls.')} These three disjoint groups cover the entire assumed range; combos within each group have equal weight. Action frequencies are supplied assumptions, not predictions about a real opponent.` },
    groups, options: [...options.slice(offset), ...options.slice(0, offset)], correctId: groups[winner].id,
    explanation: { zh: `${describe('zh')}。先用组合数乘行动频率，再归一化。频率低不等于不可能；一次行动也不能证明对手只剩某一组。结论依赖题设范围与频率，不构成行动策略评分。`, en: `${describe('en')}. Multiply combo counts by action likelihood, then normalize. Low frequency is not impossibility; one action does not isolate a single group. The result depends on the given range and likelihoods and is not a strategy score.` }
  })
}))
