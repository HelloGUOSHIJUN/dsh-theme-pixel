/**
 * Regression guard for the pixel theme.
 *
 * Rebuilds in memory and asserts the four rules that make this theme what it is,
 * plus the token contract it shares with the host. Fails loudly when a refactor
 * quietly turns it back into a rounded, blurred, serif theme.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' })
const css = readFileSync(new URL('../theme.css', import.meta.url), 'utf8')
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
const detail = readFileSync(new URL('../docs/DETAIL.md', import.meta.url), 'utf8')

let failures = 0
const fail = (msg) => {
  console.error(`✗ ${msg}`)
  failures += 1
}

// --- Rule 1: square corners ------------------------------------------------
// The radius ladder must collapse to 0 and no rounded pill may survive.
const radiusTokens = ['xs', 'sm', 'md', 'lg', 'xl', 'panel']
for (const r of radiusTokens) {
  if (!css.includes(`--dsw-radius-${r}: 0px !important;`)) {
    fail(`--dsw-radius-${r} is not 0px (square corners are rule 1)`)
  }
}
// Any positive radius that escapes the global reset would reintroduce a pill.
const strayRadius = [...css.matchAll(/border-radius:\s*(\d+(?:\.\d+)?)px/g)]
  .map((m) => Number(m[1]))
  .filter((n) => n > 0)
if (strayRadius.length > 0) {
  fail(`positive border-radius values survive: ${[...new Set(strayRadius)].join(', ')}px`)
}
if (!/\*,\s*\n\*::before,\s*\n\*::after\s*\{\s*\n\s*border-radius:\s*0 !important;/.test(css)) {
  fail('the global border-radius: 0 reset is missing')
}

// --- Rule 2: hard shadows only --------------------------------------------
// Every --dsw-shadow-* must be a solid offset block with zero blur.
const shadowTokens = [...css.matchAll(/--dsw-shadow-[a-z0-9-]+:\s*([^!;]+)/g)].map((m) => m[1].trim())
if (shadowTokens.length === 0) fail('no --dsw-shadow-* tokens were emitted')
for (const value of shadowTokens) {
  // A hard block is "<x>px <y>px 0 0 <colour>": the third length (blur) is 0.
  if (!/\d+px\s+\d+px\s+0\s+0\s+/.test(value)) {
    fail(`shadow "${value}" is not a hard offset block (rule 2)`)
  }
  if (/blur\(/.test(value)) fail(`shadow "${value}" uses blur()`)
}
// Soft elevation used anywhere in the component layer violates rule 2.
for (const m of css.matchAll(/box-shadow:\s*([^;!]+)/g)) {
  const value = m[1].trim()
  if (value.includes('var(--pixel-shadow')) continue
  if (/rgba?\([^)]*\)\s*$/.test(value) && /\d+px\s+\d+px\s+[1-9]/.test(value)) {
    fail(`component shadow "${value}" has a non-zero blur (rule 2)`)
  }
}

// --- Rule 3: bevels instead of hairlines -----------------------------------
if (!css.includes('--pixel-edge-light') || !css.includes('--pixel-edge-dark')) {
  fail('the bevel palette (--pixel-edge-light / --pixel-edge-dark) is missing')
}
const bevelSurfaces = ['[data-composer-card]', "[role='menu']", "[role='dialog']", '[class*="_fileCard"]'.replace(/"/g, "'")]
for (const sel of bevelSurfaces) {
  if (!css.includes(sel)) fail(`bevel surface ${sel} is not styled`)
}
if (/inset\s+-?1px\s+-?1px\s+0\s+0\s+var\(--pixel-edge/.test(css.replace(/\s+/g, ' '))) {
  // Inline code uses 1px by design; nothing else should.
  const withoutInlineCode = css.replace(/\[\s*data-conversation-content\s*\]\s*:not\(pre\)\s*>\s*code\s*\{[^}]*\}/, '')
  if (/inset\s+-?1px\s+-?1px/.test(withoutInlineCode)) {
    fail('a 1px bevel leaked outside the inline-code chip (bevels are 2px)')
  }
}

// --- Rule 4: monospace chrome ----------------------------------------------
if (!/--dsw-font-family:\s*'SF Mono'/.test(css)) {
  fail('--dsw-font-family does not lead with a monospace face (rule 4)')
}
if (!/--ds-font-family-code:/.test(css)) fail('the code font token is missing')
for (const word of ['serif', 'Georgia', 'Songti', 'Noto Serif']) {
  // A serif must never sneak into the chrome stacks.
  const inCodeStack = new RegExp(`--ds-font-family-code:[^;]*${word}`).test(css)
  const inUiStack = new RegExp(`--dsw-font-family:[^;]*${word}`).test(css)
  if (inCodeStack || inUiStack) fail(`serif face "${word}" leaked into a monospace stack`)
}

// --- Rule 5: no frosting ---------------------------------------------------
if (!css.includes('--dsw-menu-backdrop-filter: none !important;')) {
  fail('menus still frost (--dsw-menu-backdrop-filter must be none)')
}
for (const m of css.matchAll(/backdrop-filter:\s*([^;!]+)/g)) {
  if (m[1].trim() !== 'none') fail(`backdrop-filter "${m[1].trim()}" breaks the square edges`)
}

// --- Token contract: every host token this theme replaces must be present ----
// The theme's job is to own the whole ladder, not a sample of it. The official
// 14 that Inspect reports are the floor.
const OFFICIAL = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-bg-overlay',
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-alias-brand-primary',
  '--dsw-alias-label-primary',
  '--dsw-alias-label-secondary',
  '--dsw-alias-state-error-primary',
  '--dsw-alias-state-idle-primary',
  '--dsw-alias-state-success-primary',
  '--dsw-alias-state-warn-primary',
  '--dsw-specific-sidebar-fill',
]
for (const token of OFFICIAL) {
  // Scope each lookup to its own colour block. Testing the whole stylesheet
  // would let a token that exists in only one scheme satisfy both checks.
  const lightCss = css.split('html body[data-ds-dark-theme]')[0]
  const darkCss = css.split('html body[data-ds-dark-theme]')[1] ?? ''
  const tokenPattern = new RegExp(`${token.replace(/-/g, '\\-')}\\s*:`)
  if (!tokenPattern.test(lightCss)) fail(`official token ${token} is missing (light)`)
  if (!tokenPattern.test(darkCss)) fail(`official token ${token} is missing (dark)`)
}

// --- Font-size preference stays live ---------------------------------------
const rootFontSize = css.match(/^html \{[^}]*--dsh-content-font-size:\s*([^;!]+?)\s*(?:!important)?;/m)?.[1]?.trim()
if (rootFontSize !== 'calc(14px + var(--dsh-content-font-delta, 0px))') {
  fail(`--dsh-content-font-size must be the 14px baseline plus the reader's delta (found "${rootFontSize ?? 'none'}")`)
}
const bodyBlocks = css.split('html body {').map((part) => part.split('\n}')[0])
if (bodyBlocks.some((block) => /--dsh-content-font-size:/.test(block))) {
  fail('--dsh-content-font-size must not be declared on body (self-referencing markdown tokens)')
}

// --- Bundle wiring ---------------------------------------------------------
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
if (pkg.name !== 'dsh-theme-pixel') fail(`package name is "${pkg.name}", expected dsh-theme-pixel`)
if (!pkg.engines?.dsh?.includes('-0')) {
  fail('engines.dsh must carry the -0 suffix or prerelease DSH builds reject the plugin')
}
for (const f of ['index.js', 'client.js', 'cordis.patch.yml', 'theme.css', 'icon.svg']) {
  if (!pkg.files.includes(f)) fail(`package.json files is missing ${f}`)
}
const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
if (!/id:\s*pixel-theme/.test(patch)) fail('cordis.patch.yml does not insert the pixel-theme row')
if (!/name:\s*dsh-theme-pixel/.test(patch)) fail('cordis.patch.yml does not name dsh-theme-pixel')
const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
if (!client.includes("id: 'dsh-theme-pixel'")) fail('client.js registers the wrong module id')

// --- Locales ---------------------------------------------------------------
for (const lang of ['zh', 'en']) {
  const dict = JSON.parse(readFileSync(new URL(`../locale/${lang}.json`, import.meta.url), 'utf8'))
  if (!dict.meta?.title) fail(`locale/${lang}.json has no meta.title`)
  if (!dict.meta?.description) fail(`locale/${lang}.json has no meta.description`)
}

// --- Docs consistency ------------------------------------------------------
// Values quoted in the shipped docs must match what the build actually emits.
const lightBlock = css.split('html body {').map((part) => part.split('\n}')[0])
  .find((block) => block.includes('--dsw-alias-bg-base')) ?? ''
const tokenIn = (block, name) =>
  block.match(new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:\\s*([^;!]+)`))?.[1].trim()

const docChecks = [
  ['canvas', tokenIn(lightBlock, '--dsw-alias-bg-base'), '#e8e6df'],
  ['rail', tokenIn(lightBlock, '--dsw-specific-sidebar-fill'), '#cfccc2'],
  ['accent', tokenIn(lightBlock, '--dsw-alias-brand-primary-new-colorprimary-new-color'), '#2b5fd9'],
]
for (const [label, actual, expected] of docChecks) {
  if (actual !== expected) fail(`${label}: build emits "${actual}" but the theme documents "${expected}"`)
  for (const [name, doc] of [['README.md', readme], ['docs/DETAIL.md', detail]]) {
    if (!doc.includes(actual)) fail(`${name} does not quote the ${label} value "${actual}"`)
  }
}

const darkBlock = css.split('html body[data-ds-dark-theme]')[1] ?? ''
const darkCanvas = darkBlock.match(/--dsw-alias-bg-base:\s*([^;!]+)/)?.[1]?.trim()
if (darkCanvas !== '#161622') fail(`dark canvas is "${darkCanvas}", expected #161622`)
for (const [name, doc] of [['README.md', readme], ['docs/DETAIL.md', detail]]) {
  if (!doc.includes(darkCanvas)) fail(`${name} does not quote the dark canvas "${darkCanvas}"`)
}

// Retired values must not creep back into the docs.
const RETIRED = [
  ['999px', 'pill radius'],
  ['4px 4px 12px', 'blurred elevation'],
  ['Noto Serif', 'serif face'],
]
for (const [stale, why] of RETIRED) {
  for (const [name, doc] of [['README.md', readme], ['docs/DETAIL.md', detail], ['CHANGELOG.md', changelog]]) {
    if (doc.includes(stale)) fail(`${name}: ${why} "${stale}" is still documented`)
  }
}

// --- Container hover regression (inherited lesson) --------------------------
// [data-step-process] / [data-turn-process] are containers wrapping a header and
// a body; a hover background fills the whole box and spills past the corner.
for (const [pattern, name] of [
  [/\[data-step-process\][^{]*:hover[^{]*\{[^}]*background-color/, 'data-step-process'],
  [/\[data-turn-process\][^{]*:hover[^{]*\{[^}]*background-color/, 'data-turn-process'],
]) {
  if (pattern.test(css)) fail(`${name} is a container but has a hover background (slab bleed)`)
}

// Nested cards: a bare [class*='_card']:hover would lift every inner block.
for (const line of css.split('\n')) {
  if (/\[class\*='_card'\]\s*:hover/.test(line) && !/:not\(/.test(line)) {
    fail(`unguarded card hover: nested cards will float -> ${line.trim()}`)
  }
}

// --- Package hygiene -------------------------------------------------------
const scripts = readdirSync(new URL('../scripts', import.meta.url))
if (!scripts.includes('build.mjs')) fail('scripts/build.mjs is missing')
if (!scripts.includes('check.mjs')) fail('scripts/check.mjs is missing')

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
const total =
  radiusTokens.length + shadowTokens.length + OFFICIAL.length * 2 +
  docChecks.length * 3 + RETIRED.length * 3 + 20
console.log(`✓ ${total} checks passed (${css.length} bytes): square corners, hard shadows, bevels, mono chrome, token contract`)
