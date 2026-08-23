export const POT_ODDS_EXPLANATIONS = Object.freeze({
  third_pot_below: Object.freeze({
    en: 'A one-third-pot bet offers a low price, but 18% equity is still below the 20% break-even threshold.',
    zh: '面对 1/3 底池下注，价格虽然较低，但 18% equity 仍低于 20% 的保本门槛。'
  }),
  third_pot_above: Object.freeze({
    en: 'The small bet creates a 20% threshold. With 25% equity, calling has a positive simplified EV.',
    zh: '小尺度下注只要求 20% equity；当前 25% equity 使跟注获得正的简化 EV。'
  }),
  half_pot_below: Object.freeze({
    en: 'A half-pot bet requires 25% equity. This scenario falls four percentage points short.',
    zh: '半池下注需要 25% equity；本题低了 4 个百分点，因此直接赔率不支持跟注。'
  }),
  half_pot_above: Object.freeze({
    en: 'Your 30% equity clears the 25% requirement, so Call is preferred under the frozen assumptions.',
    zh: '你的 30% equity 高于 25% 门槛，因此在本题固定假设下推荐跟注。'
  }),
  two_thirds_pot_below: Object.freeze({
    en: 'The larger two-thirds-pot bet raises the threshold to about 28.57%; 24% equity cannot cover the price.',
    zh: '2/3 底池下注把门槛提高到约 28.57%；24% equity 无法覆盖这次跟注价格。'
  }),
  two_thirds_pot_above: Object.freeze({
    en: 'At 34% equity, the call clears the 28.57% threshold and produces positive simplified EV.',
    zh: '34% equity 高于 28.57% 门槛，因此本次跟注具有正的简化 EV。'
  }),
  pot_size_below: Object.freeze({
    en: 'A pot-sized bet demands about 33.33% equity. At 29%, folding avoids an incremental negative-EV call.',
    zh: '面对满池下注需要约 33.33% equity；当前只有 29%，弃牌可避免额外的负 EV 跟注。'
  }),
  pot_size_above: Object.freeze({
    en: 'The price is demanding, but 39% equity is above the 33.33% requirement, making Call the fixed recommendation.',
    zh: '满池下注价格较高，但 39% equity 仍超过 33.33% 门槛，因此固定推荐为跟注。'
  })
})

export const getPotOddsExplanation = (key) => (
  POT_ODDS_EXPLANATIONS[key] || POT_ODDS_EXPLANATIONS.half_pot_below
)
