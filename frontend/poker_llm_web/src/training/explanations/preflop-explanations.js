export const PREFLOP_EXPLANATIONS = Object.freeze({
  pair_raise: Object.freeze({
    en: 'In baseline-v1, pairs 66+ stay in the pure raising bucket to build the pot and keep the initiative.',
    zh: '在 baseline-v1 中，66+ 位于纯加注区间：主动做大底池，并保留翻后主动权。'
  }),
  small_pair_mix: Object.freeze({
    en: 'Small pairs mix raise and limp here. Raising is the main tendency; limping keeps a lower-variance entry in the mix.',
    zh: '小口袋对子在这里混合加注与 limp。加注是主要倾向，limp 则保留更低波动的入池路线。'
  }),
  suited_raise: Object.freeze({
    en: 'This suited hand sits in the raising region of the snapshot, where playability supports taking the initiative.',
    zh: '这手同花牌位于快照的加注区间；同花潜力与可玩性支持主动拿下行动权。'
  }),
  suited_limp_heavy_mix: Object.freeze({
    en: 'This suited fringe hand is playable, but baseline-v1 enters mostly by limping and uses a smaller raise frequency.',
    zh: '这手同花边缘牌仍有可玩性，但 baseline-v1 主要选择 limp，仅保留较低频率的加注。'
  }),
  suited_boundary_mix: Object.freeze({
    en: 'This is the bottom suited boundary in the snapshot: limp and fold split evenly, with no single dominant action.',
    zh: '这是快照中的同花底部边界：limp 与弃牌各占一半，没有唯一的主要行动。'
  }),
  offsuit_raise: Object.freeze({
    en: 'High-card strength keeps this offsuit holding inside the snapshot’s raising region despite lower suited playability.',
    zh: '尽管缺少同花可玩性，这手牌的高张强度仍使其处于快照的加注区间。'
  }),
  offsuit_high_card_limp_mix: Object.freeze({
    en: 'This marginal high-card hand enters mainly by limping. Folding remains part of the mix as the kicker gets weaker.',
    zh: '这手边缘高张牌主要通过 limp 入池；随着踢脚变弱，弃牌也成为混合策略的一部分。'
  }),
  offsuit_boundary_mix: Object.freeze({
    en: 'This offsuit boundary hand is split evenly between limp and fold in baseline-v1; neither line is dominant.',
    zh: '这手不同花边界牌在 baseline-v1 中平均混合 limp 与弃牌，两条路线都不占主导。'
  }),
  offsuit_fold: Object.freeze({
    en: 'Low connectivity and limited postflop playability place this offsuit hand in the folding region of the snapshot.',
    zh: '较差的连张性与翻后可玩性，使这手不同花牌落在快照的弃牌区间。'
  })
})

export const getPreflopExplanation = (key) => (
  PREFLOP_EXPLANATIONS[key] || PREFLOP_EXPLANATIONS.offsuit_fold
)
