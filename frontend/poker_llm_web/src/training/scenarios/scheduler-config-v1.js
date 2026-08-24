export const SCENARIO_SCHEDULER_V1 = Object.freeze({
  version: 'scenario-scheduler-v1',
  sessionSize: 10,
  mix: Object.freeze({
    fresh: 0.60,
    review: 0.25,
    boundary: 0.15
  }),
  cooldown: Object.freeze({
    recentScenarioCount: 20,
    durationHours: 72
  }),
  diversity: Object.freeze({
    minimumConcepts: 2,
    minimumPositions: 2,
    relaxWhenUnavailable: true
  }),
  boundaryRules: Object.freeze({
    mixedAction: true,
    nearTopFrequencyGapPct: 5
  })
})
