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
| `useCampaignStore` | Campaigns + building blocks + block types CRUD |

## Persistence

`DataStore` class (`src/persistence/storage.ts`) — single instance exported as `dataStore`.

- Storage keys: `dnd-ct:combats:v1`, `dnd-ct:players:v1`, `dnd-ct:monsters:v1`, `dnd-ct:blocks:v1`, `dnd-ct:campaigns:v1`, `dnd-ct:block-types:v1`
- Backed by `CombatStorageProvider` / `CombatantTemplateStorageProvider` / `BuildingBlockStorageProvider` / `CampaignStorageProvider` / `BlockTypeStorageProvider` (all localStorage)

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
  typeId: string;          // references BlockTypeDef.id
  icon?: string;           // custom emoji override (falls back to typeDef.icon)
  name: string;
  description: string;     // Markdown
  children: string[];      // child block IDs
  statChecks: StatCheck[];
  featureData?: BlockFeatureData;  // { linkedNpcIds?, combatId?, items? }
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

| File | Role |
|------|------|
| `src/types/campaign.ts` | `BlockTypeDef`, `BlockFeatureKey`, `BlockFeatureData`, `BuildingBlock`, `Campaign` |
| `src/constants.ts` | `BUILT_IN_BLOCK_TYPES`, `BLOCK_TYPE_STORAGE_KEY` |
| `src/persistence/BlockTypeStorageProvider.ts` | Custom type CRUD |
| `src/store/hooks/useCampaignStore.ts` | `blockTypes`, `createBlockType`, `deleteBlockType`, migration |
| `src/components/Campaign/BlockEditModal.tsx` | Create/edit block + type selector + CreateTypeDialog |
| `src/components/Campaign/BlockDetailModal.tsx` | Read-only block detail with NPC stats preview |
| `src/components/Campaign/BlockTreeNode.tsx` | Hierarchical block list row with drag-and-drop reorder |
| `src/components/common/IconPicker.tsx` | emoji-mart popover picker (backdrop closes on outside click) |
| `src/components/common/StatsBlock.tsx` | Reusable HP/AC/initiative + ability scores + derived stats (`mode: "large" \| "compact"`) |
| `src/pages/CampaignDetailPage.tsx` | Campaign detail — tree of blocks, modals, drag-and-drop |
| `src/pages/CampaignListPage.tsx` | Campaign list |

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
