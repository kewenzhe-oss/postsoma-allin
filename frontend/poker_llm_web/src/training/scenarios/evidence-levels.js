export const L1_math_fact = 'L1_math_fact'
export const L2_enumerated_probability = 'L2_enumerated_probability'
export const L3_versioned_training_baseline = 'L3_versioned_training_baseline'
export const L4_solver_export = 'L4_solver_export'
export const L5_heuristic_or_ai_explanation = 'L5_heuristic_or_ai_explanation'
export const L6_hand_result = 'L6_hand_result'

export const USER_OBSERVATION_RECORD_TYPE = 'user_observation'

const createEvidenceLevel = ({
  id,
  name,
  definition,
  canScoreTraining,
  uiCaution,
  prohibitedMisuse
}) => Object.freeze({
  id,
  name: Object.freeze(name),
  definition: Object.freeze(definition),
  canScoreTraining,
  uiCaution: Object.freeze(uiCaution),
  prohibitedMisuse: Object.freeze(prohibitedMisuse)
})

export const EVIDENCE_LEVELS = Object.freeze([
  createEvidenceLevel({
    id: L1_math_fact,
    name: { en: 'Math fact', zh: '数学事实' },
    definition: {
      en: 'A deterministic formula or calculation whose inputs and assumptions are explicit and reproducible.',
      zh: '输入与假设明确、可重复计算的确定性公式或计算结果。'
    },
    canScoreTraining: true,
    uiCaution: {
      en: 'Valid only for the stated inputs and simplifying assumptions.',
      zh: '仅在已声明输入与简化假设下成立。'
    },
    prohibitedMisuse: {
      en: 'Do not extend a math threshold into an unstated range, future-street, or complete strategy verdict.',
      zh: '不得把数学门槛扩展为未声明的范围、后续街或完整策略裁决。'
    }
  }),
  createEvidenceLevel({
    id: L2_enumerated_probability,
    name: { en: 'Enumerated probability', zh: '可枚举概率' },
    definition: {
      en: 'A probability produced by exhaustively enumerating a fully specified state space.',
      zh: '在完整定义的状态空间中通过穷举得到的概率。'
    },
    canScoreTraining: true,
    uiCaution: {
      en: 'Coverage, card-removal rules, and all exclusions must be stated.',
      zh: '必须说明枚举覆盖、移除牌规则与所有排除项。'
    },
    prohibitedMisuse: {
      en: 'Do not present draw-hit probability as equity versus an opponent range.',
      zh: '不得把听牌命中概率表述为对抗对手范围的真实 equity。'
    }
  }),
  createEvidenceLevel({
    id: L3_versioned_training_baseline,
    name: { en: 'Versioned training baseline', zh: '版本化训练参考' },
    definition: {
      en: 'A frozen, reviewable training reference with explicit scenario assumptions and version boundaries.',
      zh: '具有明确场景假设和版本边界、可审查的冻结训练参考。'
    },
    canScoreTraining: true,
    uiCaution: {
      en: 'Score alignment with this baseline, not universal poker correctness.',
      zh: '评分只表示与该 baseline 的一致程度，不代表普适扑克真理。'
    },
    prohibitedMisuse: {
      en: 'Do not label an internal baseline as solver-calibrated, GTO, or applicable outside its scenario.',
      zh: '不得把内部 baseline 标为 Solver 校准、GTO，或套用到场景边界之外。'
    }
  }),
  createEvidenceLevel({
    id: L4_solver_export,
    name: { en: 'Admitted solver export', zh: '已准入 Solver 导出' },
    definition: {
      en: 'A solver export admitted only after its configuration, provenance, license, and redistribution rights are reviewed.',
      zh: '仅在配置、来源、许可证与再分发权利完成审查后准入的 Solver 导出。'
    },
    canScoreTraining: true,
    uiCaution: {
      en: 'The strategy is conditional on the exact tree, abstraction, rake, sizing, and game configuration.',
      zh: '策略取决于具体博弈树、抽象、rake、尺度与赛制配置。'
    },
    prohibitedMisuse: {
      en: 'Do not import, redistribute, or score from an export without verified rights and complete configuration.',
      zh: '未经权利核验与完整配置，不得导入、再分发或用于评分。'
    }
  }),
  createEvidenceLevel({
    id: L5_heuristic_or_ai_explanation,
    name: { en: 'Heuristic or AI explanation', zh: '启发式或 AI 解释' },
    definition: {
      en: 'A teaching explanation or suggestion that is not an admitted source of strategy or mathematical truth.',
      zh: '不属于已准入策略或数学真值来源的教学解释或建议。'
    },
    canScoreTraining: false,
    uiCaution: {
      en: 'Use for interpretation only; verify every factual claim against an admitted source.',
      zh: '仅用于解释；所有事实陈述都必须由已准入来源核验。'
    },
    prohibitedMisuse: {
      en: 'Never use heuristic or AI output to set frequencies, math truth, grades, or correct actions.',
      zh: '绝不能用启发式或 AI 输出设定频率、数学真值、成绩或正确行动。'
    }
  }),
  createEvidenceLevel({
    id: L6_hand_result,
    name: { en: 'Hand result', zh: '单手结果' },
    definition: {
      en: 'An observed runout or outcome from one played or illustrated hand.',
      zh: '一手已发生或示例牌局的 runout 与结果。'
    },
    canScoreTraining: false,
    uiCaution: {
      en: 'A single outcome records what happened, not whether the decision was sound.',
      zh: '单手结果只记录发生了什么，不说明决策是否合理。'
    },
    prohibitedMisuse: {
      en: 'Never let winning, losing, a friend, or an AI override admitted decision-quality evidence.',
      zh: '不得让输赢、朋友意见或 AI 意见覆盖已准入的决策质量证据。'
    }
  })
])

export const EVIDENCE_LEVELS_BY_ID = Object.freeze(
  Object.fromEntries(EVIDENCE_LEVELS.map((level) => [level.id, level]))
)

export const EVIDENCE_LEVEL_IDS = Object.freeze(EVIDENCE_LEVELS.map(({ id }) => id))
