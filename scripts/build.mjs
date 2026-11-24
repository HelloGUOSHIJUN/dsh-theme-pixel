/**
 * Build the pixel-interface theme stylesheet and the Client module that mounts it.
 *
 * Design language: the window manager of a late-80s machine, rendered through a
 * modern browser. Four rules carry it:
 *
 *   1. Square corners everywhere — the whole radius ladder collapses to 0.
 *   2. Hard shadows only. Every elevation is a solid, unblurred offset block
 *      (the "drop block" of pixel UI), never a gaussian falloff.
 *   3. Bevels instead of hairlines: a 2px light edge top/left and a 2px dark
 *      edge bottom/right reads as a raised chunk.
 *   4. One monospace face for chrome and one for code.
 *
 * Palettes: an ink-on-paper light scheme and a phosphor dark scheme. The
 * accents are deliberately saturated primaries — pixel UIs had no soft pastels.
 *
 * Output: theme.css (readable reference) and client.js (shipped, embeds the CSS).
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// ---------------------------------------------------------------------------
// Palette constants. Both schemes are built from these, so a recolour is a
// two-line change rather than a hunt through 260 tokens.
// ---------------------------------------------------------------------------
const PIXEL = {
  light: {
    page: '#e8e6df', // canvas: warm grey paper
    rail: '#cfccc2', // sidebar: one step darker
    card: '#fdfdfb', // raised surfaces
    sunken: '#d8d5cb', // inset wells (code blocks, previews)
    edgeLight: '#ffffff', // bevel highlight
    edgeDark: '#8a8778', // bevel shadow
    ink: '#1a1a1a',
    inkSoft: '#4a4a44',
    inkFaint: '#7a7a70',
    // Saturated primaries; pixel UIs predate muted brand palettes.
    blue: '#2b5fd9',
    blueDeep: '#1a3d99',
    cyan: '#0f7d8a',
    green: '#25782f',
    amber: '#b06a00',
    red: '#b3261e',
    violet: '#6b3fa0',
    shadow: '#1a1a1a', // hard shadow ink
    selection: '#2b5fd9',
  },
  dark: {
    page: '#161622', // canvas: phosphor-night navy
    rail: '#0e0e18',
    card: '#22222f',
    sunken: '#101019',
    edgeLight: '#454560', // dark bevel highlight
    edgeDark: '#05050a', // dark bevel shadow
    ink: '#d8d6e8',
    inkSoft: '#9c9ab5',
    inkFaint: '#6c6a88',
    blue: '#6fa8ff',
    blueDeep: '#3d7ddd',
    cyan: '#4fd6d6',
    green: '#5fd97a',
    amber: '#f0b43c',
    red: '#ff6b5e',
    violet: '#b18cf0',
    shadow: '#000000',
    selection: '#6fa8ff',
  },
}

// Neutral ladders. The pixel theme deliberately keeps chroma low and steps in
// even bands, the way a 16-colour palette would.
const greys = (v) => ({
  '--dsw-static-neutral-bluish-00': v.card,
  '--dsw-static-neutral-bluish-50': v.card,
  '--dsw-static-neutral-bluish-55': v.page,
  '--dsw-static-neutral-bluish-60': v.page,
  '--dsw-static-neutral-bluish-75': v.rail,
  '--dsw-static-neutral-bluish-90': v.rail,
  '--dsw-static-neutral-bluish-100': v.sunken,
  '--dsw-static-neutral-bluish-150': v.sunken,
  '--dsw-static-neutral-bluish-200': v.edgeDark,
  '--dsw-static-neutral-bluish-300': v.edgeDark,
  '--dsw-static-neutral-bluish-310': v.edgeDark,
  '--dsw-static-neutral-bluish-400': v.inkFaint,
  '--dsw-static-neutral-bluish-500': v.inkFaint,
  '--dsw-static-neutral-bluish-600': v.inkSoft,
  '--dsw-static-neutral-bluish-700': v.inkSoft,
  '--dsw-static-neutral-bluish-750': v.ink,
  '--dsw-static-neutral-bluish-800': v.ink,
  '--dsw-static-neutral-bluish-850': v.ink,
  '--dsw-static-neutral-bluish-875': v.ink,
  '--dsw-static-neutral-bluish-900': v.ink,
  '--dsw-static-neutral-bluish-950': v.ink,
  '--dsw-static-neutral-bluish-1000': v.ink,

  '--dsw-static-neutral-00': v.card,
  '--dsw-static-neutral-50': v.card,
  '--dsw-static-neutral-100': v.page,
  '--dsw-static-neutral-150': v.rail,
  '--dsw-static-neutral-200': v.sunken,
  '--dsw-static-neutral-250': v.sunken,
  '--dsw-static-neutral-300': v.edgeDark,
  '--dsw-static-neutral-400': v.inkFaint,
  '--dsw-static-neutral-500': v.inkFaint,
  '--dsw-static-neutral-550': v.inkSoft,
  '--dsw-static-neutral-600': v.inkSoft,
  '--dsw-static-neutral-700': v.ink,
  '--dsw-static-neutral-800': v.ink,
  '--dsw-static-neutral-850': v.ink,
  '--dsw-static-neutral-900': v.ink,
  '--dsw-static-neutral-1000': v.ink,
})

const accents = (v) => ({
  '--dsw-static-blue-50': v.card,
  '--dsw-static-blue-50p': v.card,
  '--dsw-static-blue-75': v.sunken,
  '--dsw-static-blue-100': v.sunken,
  '--dsw-static-blue-300': v.blue,
  '--dsw-static-blue-400': v.blue,
  '--dsw-static-blue-450': v.blue,
  '--dsw-static-blue-500': v.blue,
  '--dsw-static-blue-600': v.blueDeep,
  '--dsw-static-blue-800': v.blueDeep,
  '--dsw-static-blue-900': v.blueDeep,
  '--dsw-static-blue-950': v.blueDeep,
  '--dsw-static-deepseek-50': v.card,
  '--dsw-static-deepseek-100': v.sunken,
  '--dsw-static-deepseek-200': v.blue,
  '--dsw-static-deepseek-300': v.blue,
  '--dsw-static-deepseek-400': v.blue,
  '--dsw-static-deepseek-450': v.blue,
  '--dsw-static-deepseek-500': v.blue,
  '--dsw-static-deepseek-600': v.blueDeep,
  '--dsw-static-deepseek-700-delete': v.blueDeep,
  '--dsw-static-deepseek-800': v.blueDeep,
  '--dsw-static-deepseek-900': v.blueDeep,
  '--dsw-static-amber-100': v.sunken,
  '--dsw-static-amber-400': v.amber,
  '--dsw-static-amber-500': v.amber,
  '--dsw-static-amber-600': v.amber,
  '--dsw-static-amber-900': v.ink,
  '--dsw-static-red-50': v.card,
  '--dsw-static-red-100': v.sunken,
  '--dsw-static-red-400': v.red,
  '--dsw-static-red-500': v.red,
  '--dsw-static-red-600': v.red,
  '--dsw-static-red-900': v.ink,
  '--dsw-static-red-400-a12': `color-mix(in srgb, ${v.red} 12%, transparent)`,
  '--dsw-static-red-600-a08': `color-mix(in srgb, ${v.red} 8%, transparent)`,
  '--dsw-static-green-100': v.sunken,
  '--dsw-static-green-400': v.green,
  '--dsw-static-green-500': v.green,
  '--dsw-static-green-900': v.ink,
  '--dsw-static-green-500-a08': `color-mix(in srgb, ${v.green} 8%, transparent)`,
  '--dsw-static-green-500-a12': `color-mix(in srgb, ${v.green} 12%, transparent)`,
  '--dsw-static-violet-400': v.violet,
  '--dsw-static-violet-600': v.violet,
})

const STATIC_LIGHT = { ...greys(PIXEL.light), ...accents(PIXEL.light) }
const STATIC_DARK = { ...greys(PIXEL.dark), ...accents(PIXEL.dark) }

// ---------------------------------------------------------------------------
// Alias layer — light scheme.
// ---------------------------------------------------------------------------
const LIGHT = {
  '--dsw-alias-bg-base': PIXEL.light.page,
  '--dsw-alias-bg-document-preview': PIXEL.light.sunken,
  '--dsw-alias-bg-document-selection': `color-mix(in srgb, ${PIXEL.light.selection} 28%, transparent)`,
  '--dsw-alias-label-document-preview': PIXEL.light.inkSoft,
  '--dsw-alias-bg-layer-1': PIXEL.light.card,
  '--dsw-alias-bg-layer-2': PIXEL.light.card,
  '--dsw-alias-bg-layer-3': PIXEL.light.card,
  '--dsw-alias-bg-mask-1': 'rgba(26, 26, 26, 0.3)',
  '--dsw-alias-bg-mask-2': 'rgba(26, 26, 26, 0.14)',
  '--dsw-alias-bg-mask-3': 'rgba(26, 26, 26, 0.5)',
  '--dsw-alias-bg-mask-photo': 'rgba(0, 0, 0, 0.88)',
  '--dsw-alias-bg-mask-drop': 'rgba(232, 230, 223, 0.75)',
  '--dsw-alias-bg-module-platform': PIXEL.light.sunken,
  '--dsw-alias-bg-multi-select': PIXEL.light.sunken,
  '--dsw-alias-bg-overlay': PIXEL.light.card,
  '--dsw-alias-bg-skeleton': 'rgba(26, 26, 26, 0.08)',
  // Borders: the pixel theme uses SOLID lines, not alpha hairlines, so the
  // bevel direction is always readable against any surface behind it.
  '--dsw-alias-border-l1': PIXEL.light.edgeDark,
  '--dsw-alias-border-l2-darkmode-thin': PIXEL.light.edgeDark,
  '--dsw-alias-border-l2': PIXEL.light.edgeDark,
  '--dsw-alias-border-l3': PIXEL.light.ink,
  '--dsw-alias-border-l4': PIXEL.light.ink,
  '--dsw-alias-border-inverted': PIXEL.light.card,
  '--dsw-alias-border-inverted2': PIXEL.light.page,
  '--dsw-alias-border-selected': PIXEL.light.blue,
  '--dsw-alias-brand-primary-invert': PIXEL.light.card,
  '--dsw-alias-brand-primary-new-colorprimary-new-color': PIXEL.light.blue,
  '--dsw-alias-brand-primary': PIXEL.light.ink,
  '--dsw-alias-brand-text': PIXEL.light.ink,
  '--dsw-alias-button-contrast-fill': PIXEL.light.ink,
  '--dsw-alias-button-elevated-fill': PIXEL.light.card,
  '--dsw-alias-button-floating-fill': PIXEL.light.card,
  '--dsw-alias-button-floating-hover': PIXEL.light.page,
  '--dsw-alias-button-ghost-active-border': PIXEL.light.ink,
  '--dsw-alias-button-ghost-active-fill': PIXEL.light.sunken,
  '--dsw-alias-button-ghost-active-hover': PIXEL.light.rail,
  '--dsw-alias-button-info-fill': PIXEL.light.blue,
  '--dsw-alias-button-info-hover': PIXEL.light.blueDeep,
  '--dsw-alias-button-primary-dimmed': PIXEL.light.edgeDark,
  '--dsw-alias-button-primary-fill': PIXEL.light.ink,
  '--dsw-alias-button-primary-hover': PIXEL.light.inkSoft,
  '--dsw-alias-button-tool-bar-fill-invisible': 'rgba(26, 26, 26, 0.4)',
  '--dsw-alias-button-tool-bar-fill': PIXEL.light.card,
  '--dsw-alias-button-tool-bar-hover': PIXEL.light.page,
  '--dsw-alias-card-fill': PIXEL.light.card,
  '--dsw-alias-card-fill-hover': PIXEL.light.page,
  '--dsw-alias-card-tile-fill': PIXEL.light.card,
  '--dsw-alias-chart-messages': PIXEL.light.blue,
  '--dsw-alias-chart-system': PIXEL.light.inkFaint,
  '--dsw-alias-chart-tools': PIXEL.light.violet,
  '--dsw-alias-hovercard-bg': PIXEL.light.card,
  '--dsw-alias-hovercard-label-primary': PIXEL.light.ink,
  '--dsw-alias-hovercard-label-secondary': PIXEL.light.inkSoft,
  '--dsw-alias-hovercard-label-tertiary': PIXEL.light.inkFaint,
  '--dsw-alias-hovercard-state-done': PIXEL.light.violet,
  '--dsw-alias-hovercard-state-error': PIXEL.light.red,
  '--dsw-alias-illustration-background': PIXEL.light.page,
  '--dsw-alias-illustration-backing': PIXEL.light.sunken,
  '--dsw-alias-illustration-detail': PIXEL.light.edgeDark,
  '--dsw-alias-illustration-surface': PIXEL.light.card,
  '--dsw-alias-interactive-bg-active': 'rgba(26, 26, 26, 0.14)',
  '--dsw-alias-interactive-bg-hover-accent': `color-mix(in srgb, ${PIXEL.light.blue} 14%, transparent)`,
  '--dsw-alias-interactive-bg-hover-danger': `color-mix(in srgb, ${PIXEL.light.red} 12%, transparent)`,
  '--dsw-alias-interactive-bg-hover-solid': PIXEL.light.rail,
  '--dsw-alias-interactive-bg-hover': 'rgba(26, 26, 26, 0.08)',
  '--dsw-alias-label-caption': PIXEL.light.inkFaint,
  '--dsw-alias-label-deep-diving': PIXEL.light.blue,
  '--dsw-alias-label-deep-diving-shimmer': PIXEL.light.cyan,
  '--dsw-alias-label-dimmed': PIXEL.light.inkFaint,
  '--dsw-alias-label-on-color': PIXEL.light.card,
  '--dsw-alias-label-primary-bluish': PIXEL.light.ink,
  '--dsw-alias-label-primary-dimmed': PIXEL.light.inkSoft,
  '--dsw-alias-label-primary-foreground': PIXEL.light.card,
  '--dsw-alias-label-primary-inverted': PIXEL.light.card,
  '--dsw-alias-label-primary': PIXEL.light.ink,
  '--dsw-alias-label-secondary': PIXEL.light.inkSoft,
  '--dsw-alias-label-shimmer': 'rgba(26, 26, 26, 0.4)',
  '--dsw-alias-label-tertiary': PIXEL.light.inkFaint,
  '--dsw-alias-link': PIXEL.light.blueDeep,
  '--dsw-alias-markdown-citation': PIXEL.light.page,
  '--dsw-alias-markdown-code-block-banner': PIXEL.light.rail,
  '--dsw-alias-markdown-code-block': PIXEL.light.sunken,
  '--dsw-alias-markdown-code-segment-selected': PIXEL.light.card,
  '--dsw-alias-markdown-code-segment-unselected': PIXEL.light.rail,
  '--dsw-alias-markdown-inline-code': PIXEL.light.sunken,
  '--dsw-alias-markdown-placeholder': PIXEL.light.edgeDark,
  '--dsw-alias-markdown-tag': PIXEL.light.sunken,
  '--dsw-alias-menu-icon': PIXEL.light.ink,
  '--dsw-alias-scrollbar-bg-l1': PIXEL.light.rail,
  '--dsw-alias-scrollbar-bg-l2': PIXEL.light.rail,
  '--dsw-alias-scrollbar-hover-l1': PIXEL.light.edgeDark,
  '--dsw-alias-scrollbar-hover-l2': PIXEL.light.edgeDark,
  '--dsw-alias-state-business-primary': PIXEL.light.amber,
  '--dsw-alias-state-business-tertiary': `color-mix(in srgb, ${PIXEL.light.amber} 14%, transparent)`,
  '--dsw-alias-state-done-primary': PIXEL.light.violet,
  '--dsw-alias-state-error-primary': PIXEL.light.red,
  '--dsw-alias-state-error-secondary': PIXEL.light.red,
  '--dsw-alias-state-idle-primary': PIXEL.light.inkFaint,
  '--dsw-alias-state-success-primary': PIXEL.light.green,
  '--dsw-alias-state-success-secondary': PIXEL.light.green,
  '--dsw-alias-state-success-tertiary': `color-mix(in srgb, ${PIXEL.light.green} 14%, transparent)`,
  '--dsw-alias-state-warn-label': PIXEL.light.amber,
  '--dsw-alias-state-warn-primary': PIXEL.light.amber,
  '--dsw-alias-state-warn-secondary': PIXEL.light.amber,
  '--dsw-alias-state-warn-tertiary': `color-mix(in srgb, ${PIXEL.light.amber} 14%, transparent)`,
  '--dsw-alias-code-diff-added': `color-mix(in srgb, ${PIXEL.light.green} 16%, transparent)`,
  '--dsw-alias-code-diff-deleted': `color-mix(in srgb, ${PIXEL.light.red} 16%, transparent)`,
  '--dsw-alias-file-diff-added-bg': `color-mix(in srgb, ${PIXEL.light.green} 16%, ${PIXEL.light.card})`,
  '--dsw-alias-file-diff-added-gutter': `color-mix(in srgb, ${PIXEL.light.green} 10%, ${PIXEL.light.card})`,
  '--dsw-alias-file-diff-added-marker': PIXEL.light.green,
  '--dsw-alias-file-diff-deleted-bg': `color-mix(in srgb, ${PIXEL.light.red} 16%, ${PIXEL.light.card})`,
  '--dsw-alias-file-diff-deleted-gutter': `color-mix(in srgb, ${PIXEL.light.red} 10%, ${PIXEL.light.card})`,
  '--dsw-alias-file-diff-deleted-marker': PIXEL.light.red,
  '--dsw-alias-switch-thumb': PIXEL.light.card,
  '--dsw-alias-toast-action': PIXEL.light.blue,
  '--dsw-alias-toast-bg': PIXEL.light.card,
  '--dsw-alias-toast-label': PIXEL.light.ink,
  '--dsw-alias-tooltip-bg': PIXEL.light.ink,
  '--dsw-alias-tooltip-label': PIXEL.light.card,
  '--dsw-alias-trajectory-accent': PIXEL.light.blue,
  '--dsw-alias-turn-trigger-bg': PIXEL.light.rail,
  '--dsw-alias-turn-trigger-bg-hover': PIXEL.light.sunken,
  '--dsw-specific-bubble': PIXEL.light.sunken,
  '--dsw-specific-bubble-highlight': PIXEL.light.rail,
  '--dsw-specific-file-upload-track': PIXEL.light.rail,
  '--dsw-specific-guide-hero': PIXEL.light.card,
  '--dsw-specific-sidebar-right-flash': PIXEL.light.blue,
  '--dsw-specific-input-major': PIXEL.light.card,
  '--dsw-specific-login-input': PIXEL.light.card,
  '--dsw-alias-menu-group-header-fill': PIXEL.light.rail,
  '--dsw-specific-menu': PIXEL.light.card,
  '--dsw-specific-selector': PIXEL.light.rail,
  '--dsw-specific-sidebar-fill': PIXEL.light.rail,
  '--dsw-specific-sidebar-nav-item-active-accent': PIXEL.light.blue,
  '--dsw-specific-sidebar-nav-item-active': PIXEL.light.sunken,
  '--dsw-specific-tip': PIXEL.light.page,
}

// ---------------------------------------------------------------------------
// Alias layer — dark scheme (phosphor night).
// ---------------------------------------------------------------------------
const DARK = {
  '--dsw-alias-bg-base': PIXEL.dark.page,
  '--dsw-alias-bg-document-preview': PIXEL.dark.sunken,
  '--dsw-alias-bg-document-selection': `color-mix(in srgb, ${PIXEL.dark.selection} 30%, transparent)`,
  '--dsw-alias-label-document-preview': PIXEL.dark.inkSoft,
  '--dsw-alias-bg-layer-1': PIXEL.dark.card,
  '--dsw-alias-bg-layer-2': PIXEL.dark.card,
  '--dsw-alias-bg-layer-3': PIXEL.dark.card,
  '--dsw-alias-bg-mask-1': 'rgba(0, 0, 0, 0.55)',
  '--dsw-alias-bg-mask-2': 'rgba(0, 0, 0, 0.22)',
  '--dsw-alias-bg-mask-3': 'rgba(0, 0, 0, 0.55)',
  '--dsw-alias-bg-mask-photo': 'rgba(0, 0, 0, 0.9)',
  '--dsw-alias-bg-mask-drop': 'rgba(22, 22, 34, 0.75)',
  '--dsw-alias-bg-module-platform': PIXEL.dark.sunken,
  '--dsw-alias-bg-multi-select': PIXEL.dark.sunken,
  '--dsw-alias-bg-overlay': PIXEL.dark.card,
  '--dsw-alias-bg-skeleton': 'rgba(216, 214, 232, 0.1)',
  '--dsw-alias-border-l1': PIXEL.dark.edgeLight,
  '--dsw-alias-border-l2-darkmode-thin': PIXEL.dark.edgeLight,
  '--dsw-alias-border-l2': PIXEL.dark.edgeLight,
  '--dsw-alias-border-l3': PIXEL.dark.inkSoft,
  '--dsw-alias-border-l4': PIXEL.dark.ink,
  '--dsw-alias-border-inverted': 'rgba(216, 214, 232, 0.18)',
  '--dsw-alias-border-inverted2': 'rgba(216, 214, 232, 0.26)',
  '--dsw-alias-border-selected': PIXEL.dark.blue,
  '--dsw-alias-brand-primary-invert': PIXEL.dark.page,
  '--dsw-alias-brand-primary-new-colorprimary-new-color': PIXEL.dark.blue,
  '--dsw-alias-brand-primary': PIXEL.dark.ink,
  '--dsw-alias-brand-text': PIXEL.dark.ink,
  '--dsw-alias-button-contrast-fill': PIXEL.dark.ink,
  '--dsw-alias-button-elevated-fill': PIXEL.dark.card,
  '--dsw-alias-button-floating-fill': PIXEL.dark.card,
  '--dsw-alias-button-floating-hover': PIXEL.dark.page,
  '--dsw-alias-button-ghost-active-border': PIXEL.dark.inkSoft,
  '--dsw-alias-button-ghost-active-fill': PIXEL.dark.sunken,
  '--dsw-alias-button-ghost-active-hover': PIXEL.dark.rail,
  '--dsw-alias-button-info-fill': PIXEL.dark.blueDeep,
  '--dsw-alias-button-info-hover': PIXEL.dark.blue,
  '--dsw-alias-button-primary-dimmed': PIXEL.dark.edgeLight,
  '--dsw-alias-button-primary-fill': PIXEL.dark.ink,
  '--dsw-alias-button-primary-hover': PIXEL.dark.card,
  '--dsw-alias-button-tool-bar-fill-invisible': 'rgba(0, 0, 0, 0.5)',
  '--dsw-alias-button-tool-bar-fill': PIXEL.dark.card,
  '--dsw-alias-button-tool-bar-hover': PIXEL.dark.page,
  '--dsw-alias-card-fill': PIXEL.dark.card,
  '--dsw-alias-card-fill-hover': PIXEL.dark.page,
  '--dsw-alias-card-tile-fill': PIXEL.dark.card,
  '--dsw-alias-chart-messages': PIXEL.dark.blue,
  '--dsw-alias-chart-system': PIXEL.dark.inkFaint,
  '--dsw-alias-chart-tools': PIXEL.dark.violet,
  '--dsw-alias-hovercard-bg': PIXEL.dark.card,
  '--dsw-alias-hovercard-label-primary': PIXEL.dark.ink,
  '--dsw-alias-hovercard-label-secondary': PIXEL.dark.inkSoft,
  '--dsw-alias-hovercard-label-tertiary': PIXEL.dark.inkFaint,
  '--dsw-alias-hovercard-state-done': PIXEL.dark.violet,
  '--dsw-alias-hovercard-state-error': PIXEL.dark.red,
  '--dsw-alias-illustration-background': PIXEL.dark.page,
  '--dsw-alias-illustration-backing': PIXEL.dark.sunken,
  '--dsw-alias-illustration-detail': PIXEL.dark.edgeLight,
  '--dsw-alias-illustration-surface': PIXEL.dark.card,
  '--dsw-alias-interactive-bg-active': 'rgba(216, 214, 232, 0.16)',
  '--dsw-alias-interactive-bg-hover-accent': `color-mix(in srgb, ${PIXEL.dark.blue} 20%, transparent)`,
  '--dsw-alias-interactive-bg-hover-danger': `color-mix(in srgb, ${PIXEL.dark.red} 18%, transparent)`,
  '--dsw-alias-interactive-bg-hover-solid': PIXEL.dark.card,
  '--dsw-alias-interactive-bg-hover': 'rgba(216, 214, 232, 0.1)',
  '--dsw-alias-label-caption': PIXEL.dark.inkFaint,
  '--dsw-alias-label-deep-diving': PIXEL.dark.blue,
  '--dsw-alias-label-deep-diving-shimmer': PIXEL.dark.cyan,
  '--dsw-alias-label-dimmed': PIXEL.dark.inkFaint,
  '--dsw-alias-label-on-color': PIXEL.dark.page,
  '--dsw-alias-label-primary-bluish': PIXEL.dark.ink,
  '--dsw-alias-label-primary-dimmed': PIXEL.dark.inkSoft,
  '--dsw-alias-label-primary-foreground': PIXEL.dark.page,
  '--dsw-alias-label-primary-inverted': PIXEL.dark.page,
  '--dsw-alias-label-primary': PIXEL.dark.ink,
  '--dsw-alias-label-secondary': PIXEL.dark.inkSoft,
  '--dsw-alias-label-shimmer': 'rgba(216, 214, 232, 0.45)',
  '--dsw-alias-label-tertiary': PIXEL.dark.inkFaint,
  '--dsw-alias-link': PIXEL.dark.blue,
  '--dsw-alias-markdown-citation': PIXEL.dark.page,
  '--dsw-alias-markdown-code-block-banner': PIXEL.dark.card,
  '--dsw-alias-markdown-code-block': PIXEL.dark.sunken,
  '--dsw-alias-markdown-code-segment-selected': PIXEL.dark.card,
  '--dsw-alias-markdown-code-segment-unselected': PIXEL.dark.sunken,
  '--dsw-alias-markdown-inline-code': PIXEL.dark.sunken,
  '--dsw-alias-markdown-placeholder': PIXEL.dark.edgeLight,
  '--dsw-alias-markdown-tag': PIXEL.dark.sunken,
  '--dsw-alias-menu-icon': PIXEL.dark.ink,
  '--dsw-alias-scrollbar-bg-l1': PIXEL.dark.edgeLight,
  '--dsw-alias-scrollbar-bg-l2': PIXEL.dark.edgeLight,
  '--dsw-alias-scrollbar-hover-l1': PIXEL.dark.inkSoft,
  '--dsw-alias-scrollbar-hover-l2': PIXEL.dark.inkSoft,
  '--dsw-alias-state-business-primary': PIXEL.dark.amber,
  '--dsw-alias-state-business-tertiary': `color-mix(in srgb, ${PIXEL.dark.amber} 20%, transparent)`,
  '--dsw-alias-state-done-primary': PIXEL.dark.violet,
  '--dsw-alias-state-error-primary': PIXEL.dark.red,
  '--dsw-alias-state-error-secondary': PIXEL.dark.red,
  '--dsw-alias-state-idle-primary': PIXEL.dark.inkFaint,
  '--dsw-alias-state-success-primary': PIXEL.dark.green,
  '--dsw-alias-state-success-secondary': PIXEL.dark.green,
  '--dsw-alias-state-success-tertiary': `color-mix(in srgb, ${PIXEL.dark.green} 20%, transparent)`,
  '--dsw-alias-state-warn-label': PIXEL.dark.amber,
  '--dsw-alias-state-warn-primary': PIXEL.dark.amber,
  '--dsw-alias-state-warn-secondary': PIXEL.dark.amber,
  '--dsw-alias-state-warn-tertiary': `color-mix(in srgb, ${PIXEL.dark.amber} 20%, transparent)`,
  '--dsw-alias-code-diff-added': `color-mix(in srgb, ${PIXEL.dark.green} 18%, transparent)`,
  '--dsw-alias-code-diff-deleted': `color-mix(in srgb, ${PIXEL.dark.red} 18%, transparent)`,
  '--dsw-alias-file-diff-added-bg': `color-mix(in srgb, ${PIXEL.dark.green} 18%, ${PIXEL.dark.card})`,
  '--dsw-alias-file-diff-added-gutter': `color-mix(in srgb, ${PIXEL.dark.green} 12%, ${PIXEL.dark.card})`,
  '--dsw-alias-file-diff-added-marker': PIXEL.dark.green,
  '--dsw-alias-file-diff-deleted-bg': `color-mix(in srgb, ${PIXEL.dark.red} 18%, ${PIXEL.dark.card})`,
  '--dsw-alias-file-diff-deleted-gutter': `color-mix(in srgb, ${PIXEL.dark.red} 12%, ${PIXEL.dark.card})`,
  '--dsw-alias-file-diff-deleted-marker': PIXEL.dark.red,
  '--dsw-alias-switch-thumb': PIXEL.dark.ink,
  '--dsw-alias-toast-action': PIXEL.dark.blue,
  '--dsw-alias-toast-bg': PIXEL.dark.card,
  '--dsw-alias-toast-label': PIXEL.dark.ink,
  '--dsw-alias-tooltip-bg': PIXEL.dark.card,
  '--dsw-alias-tooltip-label': PIXEL.dark.ink,
  '--dsw-alias-trajectory-accent': PIXEL.dark.blue,
  '--dsw-alias-turn-trigger-bg': PIXEL.dark.sunken,
  '--dsw-alias-turn-trigger-bg-hover': PIXEL.dark.card,
  '--dsw-specific-bubble': PIXEL.dark.card,
  '--dsw-specific-bubble-highlight': PIXEL.dark.edgeLight,
  '--dsw-specific-file-upload-track': PIXEL.dark.sunken,
  '--dsw-specific-guide-hero': PIXEL.dark.card,
  '--dsw-specific-sidebar-right-flash': PIXEL.dark.cyan,
  '--dsw-specific-input-major': PIXEL.dark.card,
  '--dsw-specific-login-input': PIXEL.dark.card,
  '--dsw-alias-menu-group-header-fill': PIXEL.dark.sunken,
  '--dsw-specific-menu': PIXEL.dark.card,
  '--dsw-specific-selector': PIXEL.dark.card,
  '--dsw-specific-sidebar-fill': PIXEL.dark.rail,
  '--dsw-specific-sidebar-nav-item-active-accent': PIXEL.dark.blue,
  '--dsw-specific-sidebar-nav-item-active': PIXEL.dark.card,
  '--dsw-specific-tip': PIXEL.dark.page,
}

// ---------------------------------------------------------------------------
// Geometry. This is where the theme becomes itself: every radius is 0 and every
// elevation is a hard, unblurred offset block.
// ---------------------------------------------------------------------------
const SHADOW_LIGHT = (n) => `${n}px ${n}px 0 0 ${PIXEL.light.shadow}`
const SHADOW_DARK = (n) => `${n}px ${n}px 0 0 ${PIXEL.dark.shadow}`

const geometry = (scheme, shadow) => {
  const v = PIXEL[scheme]
  return {
    '--dsw-radius-xs': '0px',
    '--dsw-radius-sm': '0px',
    '--dsw-radius-md': '0px',
    '--dsw-radius-lg': '0px',
    '--dsw-radius-xl': '0px',
    '--dsw-radius-panel': '0px',
    '--dsw-shadow-lv1': shadow(2),
    '--dsw-shadow-lv1-blur': shadow(1),
    '--dsw-shadow-lv2': shadow(3),
    '--dsw-shadow-lv3': shadow(4),
    // Focus rings: a hard 2px block, never a soft glow.
    '--dsw-focus-ring-color': v.blue,
    '--dsw-focus-ring-width': '2px',
    // Menus do not frost. A backdrop blur over square edges reads as mush.
    '--dsw-menu-backdrop-filter': 'none',
    // Bevel palette, consumed by the component layer below.
    '--pixel-edge-light': v.edgeLight,
    '--pixel-edge-dark': v.edgeDark,
    '--pixel-surface': v.card,
    '--pixel-sunken': v.sunken,
    '--pixel-page': v.page,
    '--pixel-ink': v.ink,
    '--pixel-accent': v.blue,
  }
}

const GEOMETRY = geometry('light', SHADOW_LIGHT)
const GEOMETRY_DARK = geometry('dark', SHADOW_DARK)

// Platform rails: flatten the native vibrancy to a solid, banded rail.
const PLATFORM_LIGHT = {
  '--dsw-specific-sidebar-glass-collapsed-fill': PIXEL.light.rail,
  '--dsw-specific-sidebar-glass-collapsed-hover': PIXEL.light.sunken,
  '--dsw-specific-sidebar-glass-fill': PIXEL.light.rail,
  '--dsw-specific-sidebar-glass-hover': PIXEL.light.sunken,
  '--dsw-specific-sidebar-tint': PIXEL.light.rail,
  '--dsw-specific-sidebar-wash-top': 'transparent',
  '--dsw-specific-sidebar-wash-top-clear': 'transparent',
  '--dsw-specific-sidebar-wash-bottom': 'transparent',
  '--dsw-specific-sidebar-wash-bottom-clear': 'transparent',
  '--dsw-specific-menu': PIXEL.light.card,
}

const PLATFORM_DARK = {
  '--dsw-specific-sidebar-glass-collapsed-fill': PIXEL.dark.rail,
  '--dsw-specific-sidebar-glass-collapsed-hover': PIXEL.dark.card,
  '--dsw-specific-sidebar-glass-fill': PIXEL.dark.rail,
  '--dsw-specific-sidebar-glass-hover': PIXEL.dark.card,
  '--dsw-specific-sidebar-tint': PIXEL.dark.rail,
  '--dsw-specific-sidebar-wash-top': 'transparent',
  '--dsw-specific-sidebar-wash-top-clear': 'transparent',
  '--dsw-specific-sidebar-wash-bottom': 'transparent',
  '--dsw-specific-sidebar-wash-bottom-clear': 'transparent',
  '--dsw-specific-menu': PIXEL.dark.card,
}

// ---------------------------------------------------------------------------
// Type. Monospace for chrome, a sturdier monospace for code. The body size is
// the DSH default plus the reader's preference, so Settings -> Appearance keeps
// working. Declared on html (see the note in the template below).
// ---------------------------------------------------------------------------
const UI_FONT =
  "'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', 'DejaVu Sans Mono', 'Noto Sans Mono CJK SC', 'PingFang SC', 'Microsoft YaHei', monospace"
const CODE_FONT = "'SF Mono', 'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', 'DejaVu Sans Mono', monospace"

const d = 'var(--dsh-content-font-delta, 0px)'
const bodySize = 'var(--dsh-content-font-size, 14px)'
const sec = 'var(--dsh-content-font-size-secondary, 13px)'
const fam = 'var(--dsw-font-family)'

const FONTS = {
  '--dsw-font-family': UI_FONT,
  '--dsw-font-markdown-h1': `700 calc(19px + ${d}) / calc(26px + ${d}) ${fam}`,
  '--dsw-font-markdown-h1-font-weight': '700',
  '--dsw-font-markdown-h1-line-height': `calc(26px + ${d})`,
  '--dsw-font-markdown-h2': `700 calc(17px + ${d}) / calc(24px + ${d}) ${fam}`,
  '--dsw-font-markdown-h2-font-weight': '700',
  '--dsw-font-markdown-h2-line-height': `calc(24px + ${d})`,
  '--dsw-font-markdown-h3': `700 calc(16px + ${d}) / calc(23px + ${d}) ${fam}`,
  '--dsw-font-markdown-h3-font-weight': '700',
  '--dsw-font-markdown-h3-line-height': `calc(23px + ${d})`,
  '--dsw-font-markdown-h4': `700 ${bodySize} / calc(22px + ${d}) ${fam}`,
  '--dsw-font-markdown-h4-font-weight': '700',
  '--dsw-font-markdown-h4-line-height': `calc(22px + ${d})`,
  '--dsw-font-markdown-base': `${bodySize} / calc(22px + ${d}) ${fam}`,
  '--dsw-font-markdown-base-line-height': `calc(22px + ${d})`,
  '--dsw-font-markdown-base-strong': `700 ${bodySize} / calc(22px + ${d}) ${fam}`,
  '--dsw-font-markdown-base-strong-line-height': `calc(22px + ${d})`,
  '--dsw-font-markdown-base-italic': `italic ${bodySize} / calc(22px + ${d}) ${fam}`,
  '--dsw-font-markdown-base-italic-line-height': `calc(22px + ${d})`,
  '--dsw-font-markdown-table': `${sec} / calc(20px + ${d}) ${fam}`,
  '--dsw-font-markdown-table-line-height': `calc(20px + ${d})`,
  '--dsw-font-markdown-table-head': `700 ${sec} / calc(20px + ${d}) ${fam}`,
  '--dsw-font-markdown-table-head-line-height': `calc(20px + ${d})`,
  '--dsw-font-markdown-small': `12px / 18px ${fam}`,
  '--dsw-font-markdown-small-line-height': '18px',
  '--dsw-font-markdown-small-strong': `700 12px / 18px ${fam}`,
  '--dsw-font-markdown-small-strong-line-height': '18px',
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------
const declarations = (map) =>
  Object.entries(map)
    .map(([name, value]) => `  ${name}: ${value} !important;`)
    .join('\n')

const css = `/* ==========================================================================
   Pixel interface theme for DeepSeek Harness — generated, do not edit by hand.
   Source: scripts/build.mjs
   Four rules: square corners, hard shadows, bevels instead of hairlines,
   monospace chrome.
   ========================================================================== */

/* Low-chroma ladders and saturated primaries (light). */
html body {
${declarations(STATIC_LIGHT)}
}

/* Light surfaces, text, borders, states. */
html body {
${declarations(LIGHT)}
${declarations(GEOMETRY)}
}

/* Type scale lives on the root, not on body: the --dsw-font-markdown-* values
   resolve --dsh-content-font-size, so a body-local definition would make them
   reference themselves (a cycle the browser drops as invalid). */
html {
  --dsh-content-font-size: calc(14px + ${d}) !important;
  --dsh-content-font-size-secondary: calc(13px + ${d}) !important;
}

/* Typography tokens resolve the root size above. */
html body {
${declarations(FONTS)}
}

/* Dark scheme: the same ladder on a phosphor-night base. */
html body[data-ds-dark-theme] {
${declarations(STATIC_DARK)}
${declarations(DARK)}
${declarations(GEOMETRY_DARK)}
}

/* Solid rails: no blur, no translucency. */
html[data-platform='darwin'] body {
${declarations(PLATFORM_LIGHT)}
}

html[data-platform='darwin'] body[data-ds-dark-theme] {
${declarations(PLATFORM_DARK)}
}

/* --------------------------------------------------------------------------
   Base: square everything, mono everything, and kill the last of the blur.
   -------------------------------------------------------------------------- */
body {
  font-family: ${UI_FONT} !important;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'liga' 0, 'calt' 0;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: auto;
  letter-spacing: 0.01em;
  --dsh-boot-bg: var(--dsw-alias-bg-base);
  --ds-font-family-code: ${CODE_FONT};
  --pixel-shadow: 2px 2px 0 0 var(--pixel-edge-dark);
  --pixel-shadow-lg: 4px 4px 0 0 var(--pixel-edge-dark);
}

html {
  background-color: var(--dsw-alias-bg-base);
}

/* Nothing in the interface is round. The 999px values below are re-stated as
   overrides on purpose: native pills would otherwise survive the token change. */
*,
*::before,
*::after {
  border-radius: 0 !important;
}

::placeholder {
  color: var(--dsw-alias-label-tertiary);
}

textarea,
input {
  caret-color: var(--pixel-accent);
}

/* Chunky, hard selection block. */
::selection {
  background-color: var(--pixel-accent);
  color: var(--dsw-alias-bg-base);
}

/* Square scrollbars in the rail's own colours. */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: var(--dsw-alias-scrollbar-bg-l1);
}

::-webkit-scrollbar-thumb {
  background: var(--dsw-alias-scrollbar-hover-l1);
  border: 2px solid var(--dsw-alias-scrollbar-bg-l1);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--dsw-alias-label-secondary);
}

/* --------------------------------------------------------------------------
   The bevel. A raised chunk is a 2px light edge top/left over a 2px dark edge
   bottom/right; an inset well swaps them. One utility pair keeps every surface
   consistent.
   -------------------------------------------------------------------------- */
[data-composer-card],
[class*='_fileCard'],
[role='menu'],
[role='dialog'],
[role='listbox'] {
  border: 0 !important;
  box-shadow:
    inset 2px 2px 0 0 var(--pixel-edge-light),
    inset -2px -2px 0 0 var(--pixel-edge-dark),
    var(--pixel-shadow-lg) !important;
}

/* --------------------------------------------------------------------------
   Composer: a raised slab. Pressing it drops into the page by moving onto its
   own shadow — the classic pixel-UI button travel.
   -------------------------------------------------------------------------- */
[data-composer-card] {
  background-color: var(--dsw-specific-input-major) !important;
}

[data-composer-card]:hover {
  box-shadow:
    inset 2px 2px 0 0 var(--pixel-edge-light),
    inset -2px -2px 0 0 var(--pixel-edge-dark),
    var(--pixel-shadow-lg) !important;
}

[data-composer-card]:focus-within {
  box-shadow:
    inset 2px 2px 0 0 var(--pixel-accent),
    inset -2px -2px 0 0 var(--pixel-accent),
    var(--pixel-shadow-lg) !important;
}

/* --------------------------------------------------------------------------
   Buttons: raised, square, and they travel 2px on press.
   -------------------------------------------------------------------------- */
[data-composer-card] button,
[role='menuitem'],
[class*='_panelRow'] button {
  border-radius: 0 !important;
}

/* --------------------------------------------------------------------------
   Message bubbles: a sunken well for the user, plain paper for the assistant.
   -------------------------------------------------------------------------- */
[data-message-bubble] {
  border-radius: 0 !important;
  padding: 10px 14px !important;
  background-color: var(--dsw-specific-bubble) !important;
  box-shadow:
    inset 2px 2px 0 0 var(--pixel-edge-dark),
    inset -2px -2px 0 0 var(--pixel-edge-light) !important;
}

body[data-ds-dark-theme] [data-message-bubble] {
  background-color: var(--dsw-alias-card-fill) !important;
  box-shadow:
    inset 2px 2px 0 0 var(--pixel-edge-dark),
    inset -2px -2px 0 0 var(--pixel-edge-light) !important;
}

/* --------------------------------------------------------------------------
   Code blocks: inset wells with a banded banner, the way a terminal window
   frames its output.
   -------------------------------------------------------------------------- */
.md-code-block {
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: var(--dsw-alias-markdown-code-block) !important;
  box-shadow:
    inset 2px 2px 0 0 var(--pixel-edge-dark),
    inset -2px -2px 0 0 var(--pixel-edge-light) !important;
  overflow: hidden !important;
}

.md-code-block pre,
.md-code-block code {
  font-family: ${CODE_FONT} !important;
}

[data-code-block-banner] {
  height: 26px !important;
  min-height: 26px !important;
  padding: 0 10px !important;
  font-size: 11px !important;
  font-family: ${CODE_FONT} !important;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-secondary) !important;
  background: var(--dsw-alias-markdown-code-block-banner) !important;
  border-bottom: 2px solid var(--pixel-edge-dark) !important;
}

/* Inline code: a small inset chip, never a rounded pill. */
[data-conversation-content] :not(pre) > code {
  border-radius: 0 !important;
  padding: 1px 5px !important;
  background: var(--dsw-alias-markdown-inline-code) !important;
  box-shadow:
    inset 1px 1px 0 0 var(--pixel-edge-dark),
    inset -1px -1px 0 0 var(--pixel-edge-light) !important;
}

/* --------------------------------------------------------------------------
   Transcript rhythm: mono faces need a little more air between blocks.
   -------------------------------------------------------------------------- */
[data-conversation-content] p {
  margin: 0 0 13px;
}

[data-conversation-content] ul,
[data-conversation-content] ol {
  margin: 13px 0;
  padding-left: 24px;
}

[data-conversation-content] h1,
[data-conversation-content] h2,
[data-conversation-content] h3 {
  margin: 26px 0 9px;
}

[data-conversation-content] h4,
[data-conversation-content] h5,
[data-conversation-content] h6 {
  margin: 20px 0 7px;
}

[data-conversation-content] > :first-child,
[data-conversation-content] > * > :first-child {
  margin-top: 0;
}

[data-conversation-content] :is(p, ul, ol, blockquote, table, pre, hr):last-child {
  margin-bottom: 0;
}

[data-conversation-content] li + li {
  margin-top: 6px;
}

[data-conversation-content] blockquote {
  margin: 13px 0;
  padding-left: 14px;
  border-left: 4px solid var(--pixel-edge-dark);
  color: var(--dsw-alias-label-secondary);
}

[data-conversation-content] hr {
  margin: 20px 0;
  border: 0;
  border-top: 2px dashed var(--pixel-edge-dark);
}

[data-conversation-content] a {
  color: var(--dsw-alias-link);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 2px;
}

/* Tables read as window frames: a hard outer edge and alternating banded rows. */
[data-conversation-content] [class*='_tableScroll'] {
  margin: 13px 0 !important;
}

[data-conversation-content] table {
  margin: 0;
  border-collapse: collapse;
  border: 2px solid var(--pixel-edge-dark);
  border-radius: 0 !important;
}

[data-conversation-content] thead {
  background: var(--dsw-alias-markdown-code-block-banner);
}

[data-conversation-content] th,
[data-conversation-content] td {
  padding: 7px 13px;
  border: 1px solid var(--pixel-edge-dark);
  vertical-align: top;
}

[data-conversation-content] th {
  font-weight: 700;
  color: var(--dsw-alias-label-primary);
}

[data-conversation-content] tbody tr:nth-child(even) {
  background: color-mix(in srgb, var(--pixel-edge-dark) 10%, transparent);
}

/* Fenced code seats keep their rhythm with the transcript. */
[data-conversation-content] [class*='_fenceSeat'] {
  margin: 13px 0 !important;
}

/* --------------------------------------------------------------------------
   Sidebar: a solid, banded rail. The active row is marked with a hard accent
   block on its left edge, not a wash.
   -------------------------------------------------------------------------- */
[class$='_centerCol'] {
  border-left: 2px solid var(--pixel-edge-dark) !important;
}

[class*='_panelRow'],
[class*='_panelEntry'] {
  border-radius: 0 !important;
  font-family: ${UI_FONT} !important;
}

[class*='_panelEntry'][aria-current='page'],
[class*='_panelRow'][aria-current='page'],
[class*='_panelRow'][data-active='true'],
[class*='_newSession'] {
  border-radius: 0 !important;
}

[class*='_panelEntry'][aria-current='page'],
[class*='_panelRow'][aria-current='page'],
[class*='_panelRow'][data-active='true'] {
  box-shadow: inset 3px 0 0 0 var(--pixel-accent) !important;
}

/* --------------------------------------------------------------------------
   Overlays: menus and dialogs are raised slabs with a hard drop block. Tooltips
   flip to the dark ink chip so they read at a glance.
   -------------------------------------------------------------------------- */
[role='menu'],
[role='dialog'],
[role='listbox'] {
  background-color: var(--dsw-specific-menu) !important;
}

[role='menuitem'] {
  border-radius: 0 !important;
  min-height: 28px;
}

[role='menuitem'][data-highlighted],
[role='menuitem']:hover {
  background-color: var(--pixel-accent) !important;
  color: var(--dsw-alias-bg-base) !important;
}

[role='tooltip'] {
  border-radius: 0 !important;
  background: var(--dsw-alias-tooltip-bg) !important;
  color: var(--dsw-alias-tooltip-label) !important;
  border: 0 !important;
  box-shadow: var(--pixel-shadow) !important;
  font-family: ${UI_FONT} !important;
  font-size: 12px !important;
}

/* --------------------------------------------------------------------------
   Controls: status dots become square lamps; the "jump to latest" disc becomes
   a square button.
   -------------------------------------------------------------------------- */
[class*='_dot'],
[class*='_statusDot'] {
  width: 8px !important;
  height: 8px !important;
  border-radius: 0 !important;
}

[class*='_toBottom']:not([class*='_toBottomSlot']) {
  width: 30px !important;
  height: 30px !important;
  border-radius: 0 !important;
  background: var(--pixel-surface) !important;
  box-shadow:
    inset 2px 2px 0 0 var(--pixel-edge-light),
    inset -2px -2px 0 0 var(--pixel-edge-dark),
    var(--pixel-shadow) !important;
}

[class*='_toast'] {
  border-radius: 0 !important;
  font-size: 12px !important;
  line-height: 18px !important;
  min-height: 36px !important;
  border: 0 !important;
  box-shadow:
    inset 2px 2px 0 0 var(--pixel-edge-light),
    inset -2px -2px 0 0 var(--pixel-edge-dark),
    var(--pixel-shadow-lg) !important;
}

/* Focus: a hard 2px accent ring, offset like a cursor frame. */
:focus-visible {
  outline: 2px solid var(--pixel-accent) !important;
  outline-offset: 1px !important;
  box-shadow: none !important;
}

[data-composer-card] :focus-visible,
[data-composer-input]:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

/* --------------------------------------------------------------------------
   Motion: pixel UIs snap. No easing curves, no springs, no fades.
   -------------------------------------------------------------------------- */
@media (prefers-reduced-motion: no-preference) {
  [class*='_panelRow'],
  [class*='_panelEntry'],
  [role='menuitem'],
  [data-composer-card] button {
    transition: none !important;
  }

  /* Buttons travel onto their own shadow on press. */
  [data-composer-card] button:active:not(:disabled),
  [class*='_toBottom']:not([class*='_toBottomSlot']):active {
    transform: translate(2px, 2px) !important;
    box-shadow: none !important;
  }
}

/* A blinking cursor block for the running step: the one animation this
   language allows, because it is literally a terminal cursor. */
@media (prefers-reduced-motion: no-preference) {
  [data-chat-running] [data-step-process] svg {
    animation: pixel-blink 1s steps(1, end) infinite;
  }
}

@keyframes pixel-blink {
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0.35; }
}

/* --------------------------------------------------------------------------
   Small screens: keep the square language, give thumbs a little more reach.
   -------------------------------------------------------------------------- */
@media (max-width: 720px) {
  [data-conversation-content] p {
    margin-bottom: 15px;
  }

  [data-conversation-content] :is(ul, ol) {
    margin: 15px 0;
  }
}

/* Terminal and log surfaces must keep the true code face. */
[class*='_terminal'], [class*='_terminal'] *,
[class*='_logView'], [class*='_logView'] *,
[class*='_logBody'], [class*='_logBody'] * {
  font-family: ${CODE_FONT} !important;
}
`

const client = `/* Pixel interface theme for DeepSeek Harness — generated by scripts/build.mjs. */
window.__ModuleLoader__.load({
  id: 'dsh-theme-pixel',
  factory() {
    const CSS = ${JSON.stringify(css)}
    return {
      apply(ctx) {
        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = 'dsh-theme-pixel'
          tag.dataset.pluginCss = 'dsh-theme-pixel/pixel-theme.css'
          tag.textContent = CSS
          document.head.appendChild(tag)
          return () => { tag.remove() }
        }, 'pixel-theme: stylesheet')
      },
    }
  },
})
`

writeFileSync(join(root, 'theme.css'), css)
writeFileSync(join(root, 'client.js'), client)
console.log(`theme.css ${css.length} bytes · client.js ${client.length} bytes`)
