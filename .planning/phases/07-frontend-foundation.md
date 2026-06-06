# Phase 07 — Frontend Foundation

**Goal:** ThemeProvider, ThemePrimitives interface, and the terminal theme implemented in full. Authentication pages functional. Root layout with navigation renders correctly on mobile and desktop. All theme primitives have Storybook stories.

**Prerequisites:** Phases 01–03 complete.

---

## Theming Architecture Overview

The app uses a **theme skin pattern**. Feature components never reference visual styles directly — they consume a fixed set of primitive components from the `useTheme()` hook. Swapping the active theme changes colors, typography, borders, spacing, and layout idioms throughout the app without touching any feature component.

The key invariant: **the `ThemePrimitives` interface is the only contract between feature components and the visual layer.**

---

## File Layout

```
apps/web/src/
├── context/
│   └── ThemeContext.tsx          # ThemeProvider + useTheme()
├── themes/
│   ├── types.ts                  # ThemePrimitives interface + ThemeTokens type
│   ├── index.ts                  # Theme registry (name → module)
│   └── terminal/
│       ├── index.tsx             # Exports ThemePrimitives implementation
│       ├── tokens.css            # CSS custom property values for the terminal theme
│       └── components/          # One file per primitive (Box.tsx, Button.tsx, …)
```

When a future theme is added, create `themes/<name>/` with the same structure. Register it in `themes/index.ts`. No other files change.

---

## CSS Custom Properties (Design Tokens)

`themes/types.ts` defines the `ThemeTokens` type listing every required CSS variable. Each theme sets these on `:root` (or a theme-scoped data attribute if multiple themes need to coexist in tests/Storybook).

Required tokens:

| Variable             | Description                           |
| -------------------- | ------------------------------------- |
| `--color-bg`         | Main page background                  |
| `--color-surface`    | Card / box background                 |
| `--color-border`     | Border / divider color                |
| `--color-text`       | Primary text                          |
| `--color-text-muted` | Secondary / muted text                |
| `--color-accent`     | Interactive accent, hover highlight   |
| `--color-danger`     | Destructive action color              |
| `--font-family-base` | Body font stack                       |
| `--radius-box`       | Border-radius for box/card containers |
| `--radius-button`    | Border-radius for buttons             |

`tailwind.config.ts` extends `theme.colors` and `theme.borderRadius` with aliases that reference these variables:

```ts
// tailwind.config.ts (relevant excerpt)
colors: {
  bg:          'var(--color-bg)',
  surface:     'var(--color-surface)',
  border:      'var(--color-border)',
  text:        'var(--color-text)',
  muted:       'var(--color-text-muted)',
  accent:      'var(--color-accent)',
  danger:      'var(--color-danger)',
},
borderRadius: {
  box:    'var(--radius-box)',
  button: 'var(--radius-button)',
},
fontFamily: {
  base: 'var(--font-family-base)',
},
```

Tailwind utility classes (`bg-bg`, `text-text`, `border-border`, `rounded-box`, etc.) are written against these aliases. Themes change the variable values; class names never change.

---

## ThemePrimitives Interface

`apps/web/src/themes/types.ts`:

```ts
export interface ThemePrimitives {
  Box: React.FC<BoxProps>;
  Button: React.FC<ButtonProps>;
  Input: React.FC<InputProps>;
  Label: React.FC<LabelProps>;
  Badge: React.FC<BadgeProps>;
  Modal: React.FC<ModalProps>;
  Spinner: React.FC<SpinnerProps>;
  Toast: React.FC<ToastProps>;
  Toggle: React.FC<ToggleProps>;
  Tabs: React.FC<TabsProps>;
  UserChip: React.FC<UserChipProps>;
}
```

Prop types for each primitive (also in `types.ts`):

| Primitive  | Key props                                                                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Box`      | `title?: string`, `children: ReactNode`, `className?: string`                                                                                                                                         |
| `Button`   | `variant: 'primary' \| 'ghost' \| 'danger'`, `size: 'sm' \| 'md'`, `disabled?: boolean`, `loading?: boolean`, `onClick?: () => void`, `children: ReactNode`, `type?: 'button' \| 'submit' \| 'reset'` |
| `Input`    | `label: string`, `name: string`, `type: string`, `value: string`, `onChange: (v: string) => void`, `error?: string`, `placeholder?: string`                                                           |
| `Label`    | `htmlFor: string`, `children: ReactNode`                                                                                                                                                              |
| `Badge`    | `status: ChoreStatus \| 'active' \| 'inactive'`                                                                                                                                                       |
| `Modal`    | `isOpen: boolean`, `onClose: () => void`, `title: string`, `children: ReactNode`                                                                                                                      |
| `Spinner`  | `label?: string`                                                                                                                                                                                      |
| `Toast`    | `message: string`, `type: 'success' \| 'error' \| 'info'`                                                                                                                                             |
| `Toggle`   | `checked: boolean`, `onChange: (v: boolean) => void`, `label: string`                                                                                                                                 |
| `Tabs`     | `tabs: { key: string; label: string }[]`, `activeKey: string`, `onChange: (key: string) => void`                                                                                                      |
| `UserChip` | `user: { id: string; name: string }`, `onClick?: (id: string) => void`                                                                                                                                |

---

## ThemeProvider and useTheme()

`apps/web/src/context/ThemeContext.tsx`:

```
ThemeProvider:
  1. On mount, read localStorage key "chore-wheel-theme" (default: "terminal").
  2. Look up the theme module in the registry (themes/index.ts).
  3. Import the theme's CSS tokens (side-effect import; sets :root CSS variables).
  4. Push { primitives, themeName, setTheme } into context.
  5. setTheme(name): write to localStorage, re-run steps 2–4.

useTheme():
  Returns the context value. Throws if used outside ThemeProvider.
  Signature: () => { primitives: ThemePrimitives; themeName: string; setTheme: (name: string) => void }
```

`apps/web/src/themes/index.ts` — the registry:

```ts
export const themes = {
  terminal: () => import('./terminal'),
  // future themes registered here
} as const;

export type ThemeName = keyof typeof themes;
```

The `ThemeProvider` uses dynamic `import()` so each theme's CSS and components are code-split and only loaded when selected.

---

## Terminal Theme

Location: `apps/web/src/themes/terminal/`

### Token values (`tokens.css`)

```css
:root {
  --color-bg: #0a0a0a;
  --color-surface: #0a0a0a;
  --color-border: #005514;
  --color-text: #00ff41;
  --color-text-muted: #005514;
  --color-accent: #00cc33;
  --color-danger: #ff3333;
  --font-family-base: 'Courier New', Courier, monospace;
  --radius-box: 0px;
  --radius-button: 0px;
}
```

### Primitive implementations

**`Box`** — ASCII-bordered container.

```
┌── Title ──────────────────────────┐
│ children                          │
└───────────────────────────────────┘
```

Uses box-drawing characters: `─ │ ┌ ┐ └ ┘`. Title is injected into the top border line.

**`Button`**

- `primary`: `border border-border text-text hover:bg-accent hover:text-bg`
- `ghost`: no border, hover underline, `text-muted`
- `danger`: `border border-danger text-danger hover:bg-danger hover:text-bg`
- `loading`: shows ASCII spinner (`|`) inline; `disabled` set to true.

**`Input`** — Bottom-border-only style by default. Full-box border on focus. Error text in `--color-danger` below the field.

**`Label`** — Uppercase monospace text, `text-muted`, rendered above the input.

**`Badge`** — Bracket-wrapped uppercase text:

- `complete` → `[✓ DONE]` in `--color-accent`
- `incomplete` → `[PENDING]` in `--color-text-muted`
- `expired` → `[EXPIRED]` in `--color-danger`
- `canceled` → `[CANCELED]` in `--color-text-muted`
- `active` → `[ACTIVE]` in `--color-text`
- `inactive` → `[INACTIVE]` in `--color-text-muted`

**`Modal`** — Full-screen `bg-bg/90` overlay. Inner dialog is a `Box` with fixed max-width. ESC key calls `onClose`.

**`Spinner`** — ASCII characters `|`, `/`, `─`, `\` cycling at 120 ms. Optional `label` displayed to the right.

**`Toast`** — Fixed-position stack (bottom-right). Each toast: `Box` variant with a colored left accent bar by type. Auto-dismisses after 5 s. Uses `context` + `useReducer` internally (the terminal theme owns this state; `ThemeProvider` passes an `addToast` helper alongside `primitives`).

**`Toggle`** — Text-only: `[ON ]` (accent color) / `[OFF]` (muted). Clickable; calls `onChange`.

**`Tabs`** — Horizontal row of tab labels. Active tab: `text-text` with underline `border-b border-accent`. Inactive: `text-muted`. No background pills.

**`UserChip`** — `@username` formatted text in `text-accent`, clickable if `onClick` provided. No background.

### Toast infrastructure

Because `Toast` requires app-level state (a queue), the terminal theme exports alongside the primitives a `ToastProvider` and `useToast()` hook. `ThemeProvider` renders the active theme's `ToastProvider` as a child so any component can call `const { addToast } = useToast()`. This is the only stateful piece of a theme module.

---

## Root Layout

`apps/web/src/app/layout.tsx`:

- Renders `<ThemeProvider>` wrapping the entire tree.
- Applies `font-base bg-bg text-text` to `<html>` (references the CSS token aliases).
- No hard-coded `#0a0a0a` or `font-mono` here — those are set by the terminal theme tokens.

`apps/web/src/app/(app)/layout.tsx` (authenticated layout):

- Top navigation bar using `Box` and `Button` from `useTheme().primitives`:
  ```
  [ CHORE WHEEL ] ──────────── [ chores ] [ rules ] [ profile ] [ logout ]
  ```
- Mobile: hamburger → slide-in menu, still built from theme primitives.

### `NavigationBar` component (`components/features/NavigationBar.tsx`)

- Consumes `Button` from `useTheme().primitives`.
- Shows active route highlighted. Logout button calls `POST /api/auth/logout`.

---

## Authentication Pages

### Sign-up: `apps/web/src/app/(auth)/register/page.tsx`

3-step wizard. Each step's form controls use `Input`, `Button`, `Label` from `useTheme().primitives`.

1. **Identity** — name, email, phone. Submit → `POST /api/auth/send-verification-code`.
2. **Verify Phone** — 6-digit code. Submit → `POST /api/auth/verify-phone-code`.
3. **Create Passkey** — `POST /api/auth/registration/start` → `startRegistration()` → `POST /api/auth/registration/finish`. Redirect to `/`.

Terminal ASCII art header (rendered as static markup, not a primitive):

```
╔═══════════════════════╗
║  CHORE WHEEL v1.0.0   ║
║  NEW USER ENROLLMENT  ║
╚═══════════════════════╝
```

### Sign-in: `apps/web/src/app/(auth)/login/page.tsx`

1. Email input (`Input` primitive). Submit → `POST /api/auth/login/start`.
2. Browser passkey prompt via `startAuthentication()`. Post to `POST /api/auth/login/finish`. Redirect to `/`.

---

## Hooks

`apps/web/src/hooks/useCurrentUser.ts` — fetches `GET /api/users/me`, returns `{ user, isLoading, error }`.

`apps/web/src/hooks/useApiMutation.ts` — generic hook wrapping fetch + `addToast` on error.

---

## Types

`apps/web/src/types/api.ts` — TypeScript types matching API response shapes (derived from domain types). Separate from DB types so the API can reshape data.

`apps/web/src/types/forms.ts` — form state types for the registration wizard, chore form, etc.

---

## Storybook

`apps/web/.storybook/preview.ts`:

- Registers a global `ThemeProvider` decorator so every story is rendered inside the theme system.
- Default theme for Storybook: `"terminal"`.
- Sets the Storybook canvas background to `#0a0a0a`.

Each terminal-theme primitive has a story file at `themes/terminal/components/<Primitive>.stories.tsx` covering:

- Default state.
- All variants and prop combinations.
- Interactive states (loading, error, disabled).

---

## Tests

`apps/web/src/__tests__/components/` — React Testing Library tests (all wrapped in `ThemeProvider`):

- `Button` — renders, fires onClick, shows loading state, disabled state.
- `Input` — shows label, error message, controlled value.
- `Modal` — opens/closes, ESC closes.
- `Toast` — appears and auto-dismisses.
- `Box` — renders title and children.
- `Toggle` — shows ON/OFF, fires onChange.
- `ThemeProvider` — setTheme writes to localStorage; switching theme re-renders with new primitives.
- Sign-up page — mocks API calls; verifies 3-step flow.
- Sign-in page — mocks API calls; verifies passkey flow.

E2E:

- `apps/web/e2e/auth.spec.ts` — full sign-up and sign-in using Playwright virtual WebAuthn authenticator.

---

## Test Checklist

- [ ] Storybook renders all terminal-theme primitives without errors.
- [ ] ThemeProvider test: switching to a second theme (can be a minimal stub) re-renders with different primitives.
- [ ] ThemeProvider falls back to `"terminal"` when an unknown theme name is read from localStorage.
- [ ] Sign-up flow completes end-to-end in Playwright.
- [ ] Sign-in flow completes end-to-end in Playwright.
- [ ] Navigation renders correctly on 375px (mobile) and 1280px (desktop) viewports.
- [ ] All component tests pass.
- [ ] ESLint `no-restricted-imports` rule is configured to block imports from `themes/terminal/` (or any `themes/<name>/`) inside `components/features/` and `app/`.

---

## Commit Message

`feat(ui): add ThemeProvider, terminal theme primitives, auth pages, and root layout`
