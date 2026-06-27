import { FORMAL_PLAN } from './select-alpha.js'
import { generateFormalTrials, splitBlocks } from './formal-generator.js'
import { loadFormalImagePool } from '../data/formal-pool.js'

export async function buildFormalSchedule({ selected, pretestUsedPaths, subjectSeed }) {
  const totalPlanned = FORMAL_PLAN.reduce((s, c) => s + parseInt(c.n_trials), 0)
  const alphaToImages = await loadFormalImagePool(pretestUsedPaths)

  const formalTrials = generateFormalTrials(
    selected, alphaToImages, pretestUsedPaths, totalPlanned, subjectSeed
  )

  const { formalBlocks, blockDistributionRows } = splitBlocks(formalTrials, 11, 100, subjectSeed)

  return {
    formalSeed: subjectSeed,
    nBlocks: 11,
    blockSize: 100,
    totalTrials: totalPlanned,
    formalPlan: FORMAL_PLAN,
    formalBlocks,
    blockDistributionRows
  }
}
