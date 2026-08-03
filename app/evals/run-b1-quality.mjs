import { assessSourceForClaim } from '../src/evidence-bundle.mjs'
import { EVIDENZQUALITAET_GOLD, scoreEvidenzqualitaet } from './fixtures/evidenzqualitaet.mjs'

const outputs = EVIDENZQUALITAET_GOLD.map(gold => assessSourceForClaim(gold.input))
const result = scoreEvidenzqualitaet(outputs)
console.log(JSON.stringify(result, null, 2))
if (!result.passed) process.exitCode = 1
