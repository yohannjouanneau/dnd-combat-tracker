# dnd-combat-tracker

D&D 5e combat tracker for DMs — tracks initiative order, HP, conditions, death saves, and turn timing. Fully client-side React SPA with localStorage persistence and optional Google Drive sync.

## Dev commands

```bash
npm run dev      # start dev server (Vite)
npm run build    # tsc + Vite build
npm run lint     # ESLint
```

## Tech stack

- React 19, TypeScript 5.9
- Vite (rolldown-vite)
- Tailwind CSS v3
- i18next — EN/FR locales (`src/i18n/locales/`)
- lucide-react for icons
- react-markdown + remark-gfm for notes
- External API: `dnd5eapi.co` GraphQL for monster search (`src/api/DnD5eGraphQLClient.ts`)
- Env var: `VITE_GOOGLE_CLIENT_ID` (Google Drive sync)

## Routing

Hash-based routing in `App.tsx`:
- `#combats` → `CombatsPage`
- `#play/:id` → `CombatTrackerPage`

## State architecture

`useCombatState()` in `src/store/state.ts` is the single entry point — returns `CombatStateManager` (see `src/store/types.ts`). No Redux/Zustand. Pure hook composition:

| Hook | Responsibility |
|------|---------------|
| `useCombatStore` | Saved combats CRUD (list, load, save, delete) |
| `useCombatantStore` | In-fight combatants: HP, initiative, conditions, turn nav |
| `useCombatantFormStore` | New combatant form state, initiative groups |
| `usePlayerStore` | Player library + linking players to a combat |
| `useMonsterStore` | Monster library + DnD5e API search |
| `useParkedGroupStore` | Parked groups (pre-staged, not yet in fight) |
| `useSyncApi` | Google Drive sync |

## Persistence

`DataStore` class (`src/persistence/storage.ts`) — single instance exported as `dataStore`.

- Storage keys: `dnd-ct:combats:v1`, `dnd-ct:players:v1`, `dnd-ct:monsters:v1`
- Backed by `CombatStorageProvider` / `CombatantTemplateStorageProvider` (localStorage)

**Storage optimization** (`src/persistence/combatStateOptimizer.ts`): combatants from libraries/parked groups are stored as lightweight references (`isReference: true`) with only delta fields vs. the template. Restored to full objects via `restoreCombatState()` on load.

## Key types (`src/types.ts`)

- `Combatant` — in-fight entity (id: number, initiative, HP, conditions, deathSaves, groupIndex, templateOrigin)
- `CombatantTemplate<T>` — base for `SavedPlayer` / `SavedMonster`
- `NewCombatant` — form state / parked group (pre-fight)
- `CombatState` — full combat snapshot (combatants, currentTurn, round, parkedGroups, linkedPlayerIds)
- `TemplateOrigin.origin` — `"player_library" | "monster_library" | "parked_group" | "no_template"`

## Key concepts

- **Parked Groups** — pre-staged combatant groups stored aside, added to fight on demand
- **Linked Players** — player templates linked to the combat, shown in `PlayerPanel`
- **Initiative Groups** — a single form submission can spawn multiple groups with different initiatives/counts
- **Focus Mode** — hides UI chrome, shows only turn controls + combatants; toggle: `F` key
- **Keyboard shortcuts** — `→` next turn, `←` prev turn, `F` focus mode
- **Combat Timer** — running timer in `TurnControls`; warns before exiting if running

## Component map (`src/components/`)

```
TurnControls/          round/turn nav, timer (CombatTimer), focus toggle, add button
CombatLayout/          responsive shell → DesktopCombatLayout / MobileCombatLayout
CombatantsList/        CombatantCard (HP bar, conditions, death saves)
CombatantDetailPanel/  expanded view: ability scores, derived stats (proficiency, passive stats, spell DC)
CombatForm/            AddCombatantModal (fight or group mode), monster search
Library/               LibraryModal (monsters+players), LibraryEditModal
ParkedGroups/          ParkedGroupsPanel + ParkedGroupChip
GroupsOverview/        colored group badges with remove
common/mardown/        MarkdownEditor + MarkdownRenderer with custom D&D tags
Settings/              SettingsModal (sync, language, theme)
TopBar.tsx             combat name/description edit, save, back, sync button
SyncButton.tsx         Google Drive sync state indicator
```

## i18n

Namespaces: `common`, `combat`, `forms`, `conditions`, `colors`.

Usage: `const { t } = useTranslation("combat")` → `t("combat:someKey")` or `t("someKey")` for default ns (`common`).

Translation files: `src/i18n/locales/{en,fr}/<namespace>.json`

## Custom markdown tags

Notes support D&D-flavored inline tags rendered with icons + color:
`{hit:+5}`, `{dmg:2d6}`, `{heal:1d8}`, `{save:DC 15}`, `{ac:16}`, `{cond:poisoned}`, `{range:30 ft.}`, `{spell:Fireball}`, `{recharge:5-6}`, `{legendary:3}`, etc.

Tag definitions: `src/constants.ts` (`EDITOR_TAGS`, `MARKDOWN_EDITOR_TAG_MENU_ITEMS`)
