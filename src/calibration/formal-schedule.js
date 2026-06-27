import { FORMAL_PLAN } from './select-alpha.js'
import { generateFormalTrials, splitBlocks } from './formal-generator.js'
import { loadFormalImagePool } from '../data/formal-pool.js'

function stableStringify(value) {
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']'
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return '{' + keys.map(k =>
      JSON.stringify(k) + ':' + stableStringify(value[k])
    ).join(',') + '}'
  }
  return JSON.stringify(value)
}

async function sha256Hex(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function buildFormalSchedule({ selected, pretestUsedPaths, subjectSeed }) {
  const totalPlanned = FORMAL_PLAN.reduce((s, c) => s + parseInt(c.n_trials), 0)
  const alphaToImages = await loadFormalImagePool(pretestUsedPaths)

  const formalTrials = generateFormalTrials(
    selected, alphaToImages, pretestUsedPaths, totalPlanned, subjectSeed
  )

  const { formalBlocks, blockDistributionRows } = splitBlocks(formalTrials, 11, 100, subjectSeed)

  const stable = stableStringify(formalBlocks)
  const formalScheduleHash = await sha256Hex(stable)

  return {
    formalSeed: subjectSeed,
    nBlocks: 11,
    blockSize: 100,
    totalTrials: totalPlanned,
    formalPlan: FORMAL_PLAN,
    formalBlocks,
    blockDistributionRows,
    formalScheduleHash
  }
}
