# dnd-combat-tracker

D&D 5e combat tracker for DMs — tracks initiative order, HP, conditions, death saves, and turn timing. Fully client-side React SPA with localStorage persistence and optional Google Drive sync.

## Dev commands

```bash
npm run dev      # start dev server (Vite)
npm run build    # tsc + Vite build
npm run lint     # ESLint
npx prettier --write .  # format all files
```

**After every code change**, run ESLint, Prettier, and verify the build:

```bash
npm run lint && npx prettier --write . && npm run build
```

## Testing

```bash
npm test   # Jest unit tests
```

- Test files live in a `tests/` subfolder next to the code they test (e.g. `src/api/sync/gdrive/tests/mergeSyncData.test.ts`)
- Never place `.test.ts` files directly alongside source files
- After updating code that has tests, run the related tests to confirm nothing is broken
- After any code change, evaluate test coverage and add tests if important cases are uncovered

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

| Hook                    | Responsibility                                            |
| ----------------------- | --------------------------------------------------------- |
| `useCombatStore`        | Saved combats CRUD (list, load, save, delete)             |
| `useCombatantStore`     | In-fight combatants: HP, initiative, conditions, turn nav |
| `useCombatantFormStore` | New combatant form state, initiative groups               |
| `usePlayerStore`        | Player library + linking players to a combat              |
| `useMonsterStore`       | Monster library + DnD5e API search                        |
| `useParkedGroupStore`   | Parked groups (pre-staged, not yet in fight)              |
| `useSyncApi`            | Google Drive sync                                         |
| `useCampaignStore`      | Campaigns + building blocks + block types CRUD            |

## Persistence

`DataStore` class (`src/persistence/storage.ts`) — single instance exported as `dataStore`.

- Storage keys: `dnd-ct:combats:v1`, `dnd-ct:players:v1`, `dnd-ct:monsters:v1`, `dnd-ct:blocks:v1`, `dnd-ct:campaigns:v1`, `dnd-ct:block-types:v1`, `dnd-ct:map-state:v1`
- All keys are constants in `src/constants.ts` — always add new keys there, never inline strings
- Backed by one `*StorageProvider` class per entity type (all localStorage) — see `src/persistence/`

**IMPORTANT — how to add persistence for a new data type:**
1. Add a storage key constant to `src/constants.ts` following the `dnd-ct:<entity>:v<version>` pattern
2. Create `src/persistence/<Entity>StorageProvider.ts` — a plain class with `get`/`set` (single object) or `list`/`get`/`create`/`update`/`delete` (collection). See `MapStateStorageProvider` (single object) or `CampaignStorageProvider` (collection) for reference.
3. Inject the provider into `DataStore` (constructor default + private field) and expose methods on it
4. **Never** bypass `DataStore` by writing to `localStorage` directly in components or hooks — all persistence goes through `dataStore.*` calls
5. Wire into sync: add the field to `SyncData` (`src/api/sync/types.ts`), include it in `getLocalSyncData()` and `applyRemoteData()` in `GoogleDriveSyncProvider.ts`, and handle it in `mergeSyncData.ts`

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

## Campaigns & Building Blocks

Campaigns are collections of **building blocks** — structured notes for rooms, characters, combats, loot, etc. Accessed via `CampaignListPage` → `CampaignDetailPage`.

### Block type system

Block types are **data-driven**, not a hardcoded union. Each `BlockTypeDef` declares:

- `id: string` — built-in ids: `"environment"`, `"room"`, `"character"`, `"combat"`, `"loot"`. Custom types use UUIDs.
- `icon: string` — default emoji
- `features: BlockFeatureKey[]` — which feature sections the type enables: `"characters"`, `"combat"`, `"loot"`
- `isBuiltIn: boolean`

Built-in types are defined in `BUILT_IN_BLOCK_TYPES` (`src/constants.ts`) and never stored in localStorage. Custom types are persisted via `BlockTypeStorageProvider` (`dnd-ct:block-types:v1`).

`"scene"` is a hidden built-in with all three features enabled — it's the **default typeId** for new blocks (no type selected = all features visible). It does not appear in the type selector UI.

### BuildingBlock shape (`src/types/campaign.ts`)

```ts
interface BuildingBlock {
  id: string;
  typeId: string; // references BlockTypeDef.id
  icon?: string; // custom emoji override (falls back to typeDef.icon)
  name: string;
  description: string; // Markdown
  children: string[]; // child block IDs
  statChecks: StatCheck[];
  featureData?: BlockFeatureData; // { linkedNpcIds?, combatId?, items? }
  tags?: string[];
}
```

`featureData` is a flat optional struct — only the fields relevant to the block's features are used. Replaces the old `specialFeature` discriminated union.

### Migration (`src/store/hooks/useCampaignStore.ts`)

On `loadBlocks()`, legacy blocks are migrated automatically:

- `type: "npc"` → `typeId: "character"`
- `type: "object"` → `typeId: "loot"`
- Any other `type` string → `typeId: type`
- `specialFeature` → `featureData` (flattened)

### Creating custom types

In `BlockEditModal`, the "New type" button opens a `CreateTypeDialog`:

- User enters a name + picks an emoji icon
- Features are **auto-detected** from current form data (e.g. if NPCs are linked, "characters" is pre-checked)
- Saved to localStorage; immediately available in the type selector

### Key files

| File                                           | Role                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/types/campaign.ts`                        | `BlockTypeDef`, `BlockFeatureKey`, `BlockFeatureData`, `BuildingBlock`, `Campaign`        |
| `src/constants.ts`                             | `BUILT_IN_BLOCK_TYPES`, `BLOCK_TYPE_STORAGE_KEY`                                          |
| `src/persistence/BlockTypeStorageProvider.ts`  | Custom type CRUD                                                                          |
| `src/store/hooks/useCampaignStore.ts`          | `blockTypes`, `createBlockType`, `deleteBlockType`, migration                             |
| `src/components/Campaign/BlockEditModal.tsx`   | Create/edit block + type selector + CreateTypeDialog                                      |
| `src/components/Campaign/BlockDetailModal.tsx` | Read-only block detail with NPC stats preview                                             |
| `src/components/Campaign/BlockTreeNode.tsx`    | Hierarchical block list row with drag-and-drop reorder                                    |
| `src/components/common/IconPicker.tsx`         | emoji-mart popover picker (backdrop closes on outside click)                              |
| `src/components/common/StatsBlock.tsx`         | Reusable HP/AC/initiative + ability scores + derived stats (`mode: "large" \| "compact"`) |
| `src/pages/CampaignDetailPage.tsx`             | Campaign detail — tree of blocks, modals, drag-and-drop                                   |
| `src/pages/CampaignListPage.tsx`               | Campaign list                                                                             |

## Design system primitives (`src/components/common/`)

Five reusable primitives cover the vast majority of interactive UI. **Always use these instead of raw `<button>`, `<select>`, or `<textarea>` elements.**

### `Button`

```tsx
<Button variant="primary" size="md" onClick={...}>Label</Button>
```

| Prop        | Values                                                     | Notes                                             |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------- |
| `variant`   | `primary` `secondary` `danger` `success` `warning` `ghost` | Default: `secondary`                              |
| `size`      | `sm` `md` `lg`                                             | Default: `md`                                     |
| `disabled`  | boolean                                                    | Applies `opacity-50 cursor-not-allowed`           |
| `className` | string                                                     | Merged via `cn()` — safe to override color/layout |

- Use `primary` for the main CTA in a form or modal footer.
- Use `secondary` for cancel / neutral actions.
- Use `danger` for destructive actions (delete, logout).
- Use `ghost` for low-emphasis text-only actions (e.g. "Cancel" next to a warning button).
- Non-standard accent colors (lime, sky, purple): pass `variant="primary"` + `className="bg-lime-600 hover:bg-lime-700"` — `tailwind-merge` resolves the conflict.

### `IconButton`

Square icon-only button. No label.

```tsx
<IconButton variant="ghost" size="sm" onClick={...} aria-label="Close">
  <X className="w-4 h-4" />
</IconButton>
```

| Prop      | Values           | Notes                                                   |
| --------- | ---------------- | ------------------------------------------------------- |
| `variant` | `filled` `ghost` | `filled` has `bg-panel-secondary`; `ghost` is text-only |
| `size`    | `sm` `md` `lg`   | Padding only: `p-1.5` / `p-2` / `p-2.5`. Default: `md`  |

- Use `ghost` for close buttons, expand/collapse toggles, and inline clear buttons.
- Use `filled` for toolbar actions that need a visible background at rest.
- Always pass `aria-label` when there is no visible text.
- For active/inactive toggle buttons with conditional coloring (e.g. toolbar tools), inline the ternary className — `IconButton` does not model state.

### `Modal`

Portal-rendered modal with backdrop, Escape key, and compound sub-components.

```tsx
<Modal open={isOpen} onClose={onClose} title="Title" size="md">
  <Modal.Body>...</Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>
      Close
    </Button>
  </Modal.Footer>
</Modal>
```

| Prop            | Values                          | Notes                                                      |
| --------------- | ------------------------------- | ---------------------------------------------------------- |
| `size`          | `sm` `md` `lg` `xl` `full`      | Controls `max-w-*`                                         |
| `layer`         | `base` `library` `dialog` `top` | Z-index stacking: 20 / 30 / 40-50 / 60-70. Default: `base` |
| `headerActions` | `ReactNode`                     | Rendered between title and close button in the header      |

- Use `layer="dialog"` for modals opened from inside another modal.
- `Modal.Body` is `overflow-y-auto flex-1` — put all scrollable content inside it.
- `Modal.Footer` has a top border and `flex-shrink-0` — always put action buttons here.

### `Select`

Styled native `<select>`.

```tsx
<Select label="Type" value={val} onChange={...}>
  <option value="a">Option A</option>
</Select>
```

Pass `label` for the labeled variant (renders a `<label>` + `<select>` in a flex-col wrapper).

### `Textarea`

Styled `<textarea>` with `resize-y`.

```tsx
<Textarea label="Notes" value={val} onChange={...} rows={4} />
```

Same `label` pattern as `Select`.

---

### `cn()` utility

`src/utils/cn.ts` — combines `clsx` + `tailwind-merge`. Use it in all components that accept a `className` prop so overrides resolve correctly (last class wins):

```ts
import { cn } from "../../utils/cn";
className={cn("base-classes", conditionalClass && "extra", className)}
```

## Component map (`src/components/`)

```
TurnControls/          round/turn nav, timer (CombatTimer), focus toggle, add button
CombatLayout/          responsive shell → DesktopCombatLayout / MobileCombatLayout
CombatantsList/        CombatantCard (HP bar, conditions, death saves)
CombatantDetailPanel/  expanded view: ability scores, derived stats (proficiency, passive stats, spell DC)
CombatForm/            AddCombatantModal (fight or group mode), monster search
Library/               LibraryModal (monsters+players+blocks), LibraryEditModal
ParkedGroups/          ParkedGroupsPanel + ParkedGroupChip
GroupsOverview/        colored group badges with remove
Campaign/              BlockEditModal, BlockDetailModal, BlockTreeNode, StatCheckSection
common/mardown/        MarkdownEditor + MarkdownRenderer with custom D&D tags
common/StatsBlock.tsx  reusable stat display (mode: large | compact)
common/IconPicker.tsx  emoji-mart popover icon picker
Settings/              SettingsModal (sync, language, theme)
TopBar.tsx             combat name/description edit, save, back, sync button
SyncButton.tsx         Google Drive sync state indicator
```

## i18n

Namespaces: `common`, `combat`, `forms`, `conditions`, `colors`, `campaigns`.

Usage: `const { t } = useTranslation("combat")` → `t("combat:someKey")` or `t("someKey")` for default ns (`common`).

Translation files: `src/i18n/locales/{en,fr}/<namespace>.json`

## Custom markdown tags

Notes support D&D-flavored inline tags rendered with icons + color:
`{hit:+5}`, `{dmg:2d6}`, `{heal:1d8}`, `{save:DC 15}`, `{ac:16}`, `{cond:poisoned}`, `{range:30 ft.}`, `{spell:Fireball}`, `{recharge:5-6}`, `{legendary:3}`, etc.

Tag definitions: `src/constants.ts` (`EDITOR_TAGS`, `MARKDOWN_EDITOR_TAG_MENU_ITEMS`)
