import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const swift = await readFile(new URL('../../mac/main.swift', import.meta.url), 'utf8')
const build = await readFile(new URL('../../mac/build.sh', import.meta.url), 'utf8')

test('der Release-Build fällt ohne Onda-Zertifikat niemals still auf ad-hoc zurück', () => {
  assert.doesNotMatch(build, /codesign\s+--force\s+-s\s+-\s+"\$APP"/)
  assert.match(build, /FEHLER:.+Onda Dev|FEHLER:.+Signieridentität/s)
})

test('neue Schlüssel werden unter dem signaturgebundenen Service angelegt', () => {
  assert.match(swift, /static let service = "Onda\.signiert\.v1"/)
  assert.doesNotMatch(swift, /SecTrustedApplicationCreateFromPath|SecAccessCreate/)
})

test('ein bestehender Schlüssel wandert nach der einmaligen Freigabe sicher in den neuen Service', () => {
  assert.match(swift, /fruehereServices = \["Onda", "Schreibwerkzeug"\]/)
  assert.match(swift, /for fruehererService in fruehereServices/)
  assert.match(swift, /setzen\(alt, service: service, account: account\)/)
  assert.match(swift, /roh\(service: service, account: account\) != nil/)
  assert.match(swift, /SecItemDelete\(basisAbfrage\(service: fruehererService/)
})
