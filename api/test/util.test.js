import { test } from 'node:test'
import assert from 'node:assert/strict'
import { likeEscape, LIKE_ESCAPE_CHAR } from '../src/util.js'

test('likeEscape: % _ dan karakter escape di-escape; backslash tidak istimewa', () => {
  assert.equal(LIKE_ESCAPE_CHAR, '|')
  assert.equal(likeEscape('100%'), '100|%')
  assert.equal(likeEscape('_aman_'), '|_aman|_')
  assert.equal(likeEscape('a|b'), 'a||b')
  assert.equal(
    likeEscape('a\\b'),
    'a\\b',
    'backslash apa adanya (aman pada NO_BACKSLASH_ESCAPES)'
  )
  assert.equal(likeEscape('biasa 7/2019'), 'biasa 7/2019')
  assert.equal(likeEscape('%_|'), '|%|_||')
})
