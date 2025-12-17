<p align="center">
  <img src="https://raw.githubusercontent.com/yohannjouanneau/dnd-combat-tracker/main/src/assets/logo.png" alt="Logo" width="250">
</p>

# ⚔️ D&D Combat Tracker

> A modern, intuitive combat tracker for Dungeons & Dragons 5th Edition

[![Under Active Development](https://img.shields.io/badge/status-active%20development-brightgreen)]()

![Combat Tracker Demo](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_1.png)

<details>
<summary>📸 More Screenshots</summary>

![Screenshot 2](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_2.png)

![Screenshot 3](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_3.png)

![Screenshot 4](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_4.png)

![Screenshot 5](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_5.png)

![Screenshot 6](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_6.png)

![Screenshot 7](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_7.png)

![Screenshot 8](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_8.png)

</details>

[Try it!](https://yohannjouanneau.github.io/dnd-combat-tracker/)

## 🎯 Overview

D&D Combat Tracker is a web-based application designed to streamline combat encounters in Dungeons & Dragons 5e. Built for Dungeon Masters who want to focus on storytelling rather than bookkeeping, this tool handles initiative tracking, HP management, conditions, and more.

**Key Benefits:**

- ⚡ Lightning-fast combat setup with multi-combatant support
- 💾 Save and reuse players across multiple encounters
- 🔄 Cloud sync with Google Drive for seamless device switching
- 🎨 Visual feedback with color-coded groups and HP bars
- 📱 Responsive design works on desktop and mobile
- 🔒 All data stored locally by default - no account required
- ⌨️ Keyboard shortcuts for quick turn navigation
- 👁️ Focus Mode to minimize distractions during combat
- 🌍 Multi-language support (English & French)
- 🔍 Monster search powered by D&D 5e SRD API
- 📚 Personal monster library for custom creatures
- 📝 Rich Markdown notes with combat-specific tags and dice notation
- 🎯 Detailed combatant view with ability scores and modifiers
- 💡 Smart storage optimization with lightweight references

## ✨ Features

### Combat Management

- **Initiative Tracking**: Support for multiple initiative groups per combatant
- **Editable Initiative**: Click on any initiative value to edit it mid-combat
- **HP Management**: Visual HP bars with quick damage/healing controls
  - Manual input field for precise adjustments
  - Quick buttons for common values (±1, ±5, ±10) on mobile
  - Auto-expand quick buttons when combatant becomes active (mobile)
  - Desktop auto-focus on HP input for active combatant
- **Turn Tracking**: Automatic turn progression with round counter
- **Keyboard Navigation**:
  - Arrow Left/Right to navigate turns quickly
  - F key to toggle Focus Mode
  - Alt key modifier for combined actions (Park/Save + Fight)
  - Ctrl/Cmd + S to save combat
  - Enter key to apply HP changes
  - Escape to cancel initiative editing
- **Auto-scroll**: Active combatant automatically scrolls into view
- **Group Management**: Organize combatants by groups with color coding
  - Group summary panel showing all active groups
  - Remove individual groups entirely
  - "Clear All" action to remove all combatants at once with confirmation
- **Focus Mode**: Hide form and panels to concentrate on active combat
- **Combatant Detail Panel**: Expanded view with large avatar, ability scores, and notes
  - Desktop/mobile optimized layouts
  - Ability scores with automatic modifier calculations
  - Markdown notes rendering

### Character Management

- **Saved Players**: Reuse characters across different combat encounters
  - Edit saved players to load them into the form
  - Add saved players directly to combat with "Fight!" button
  - Delete unwanted saved players with confirmation
  - Update saved players by re-saving with same name
- **Parked Groups**: Stage combatants before adding them to combat
  - Edit parked groups to modify their stats
  - Add parked groups directly to combat
  - Remove parked groups when no longer needed
  - Encounter-specific (cleared between combats)
- **Monster Library**: Build your personal collection of creatures
  - Save custom monsters and NPCs
  - Full stat tracking (HP, AC, ability scores)
  - Search and filter your library
  - Quick-add monsters to combat
  - Edit and manage library entries
  - Markdown notes support for monster abilities
  - Integration with monster search results
- **Custom Avatars**: Add character images via URL with automatic fallback to initials
- **Bulk Creation**: Create multiple combatants (e.g., "Goblin A, B, C") in one action
  - Configurable identifier type (letters or numbers)
- **Initiative Bonus**: Set a modifier that automatically applies to rolled initiatives
- **Multiple Initiative Groups**: Create different initiative tiers for the same group
- **Ability Scores**: Track all six ability scores (STR, DEX, CON, INT, WIS, CHA)
  - Automatic modifier calculations
  - Display in combatant detail panel
- **Markdown Notes**: Rich text notes per combatant with combat-specific tags
  - 12 combat-related tags with icons (Hit, Damage, Healing, Conditions, etc.)
  - Dice notation recognition (e.g., "2d6", "1d20+5")
  - Tag menu for quick insertion
  - GitHub-flavored markdown support

### Monster Search & Integration

- **D&D 5e SRD API Integration**: Search official D&D monsters
- **Dual Search**: Simultaneously searches both API and your personal library
  - Library results shown first with amber icon
  - API results shown below with blue globe icon
- **Auto-fill Stats**: Click any search result to instantly populate the form
  - Automatically calculates ability modifiers
  - Imports HP, AC, and images
  - Adds external resource links
- **Smart Monster Detection**: Combatant name search triggers automatic lookup
- **Add to Library**: Save any creature (API or custom) to your personal collection

### Cloud Sync

- **Google Drive Integration**: Backup and sync your data across all devices
- **Smart Sync**: Automatically detects newer data and prevents conflicts
- **Last Write Wins**: Simple conflict resolution strategy
- **Private Storage**: Uses Google Drive's appDataFolder for secure, app-specific storage
- **Manual Control**: Sync only when you want - no automatic uploads
- **Last Sync Indicator**: Always know when your last sync occurred
- **Cross-Device**: Access your combats, players, and library from any device

### Combat Features

- **Death Saving Throws**: Track successes and failures for dying characters
- **Concentration**: Monitor which characters are concentrating on spells
- **Conditions**: Quick-toggle 14 standard D&D 5e conditions (Blinded, Charmed, etc.)
  - Collapsible condition picker to reduce clutter
  - Active conditions displayed prominently on combatant cards
- **AC Display**: Quick reference for armor class
- **Initiative Re-rolling**: Each initiative group has a dice button to re-roll
- **Auto-sort**: Combatants automatically sort by initiative when values change

### Data Persistence

- **Save Encounters**: Save combat states with names and descriptions
  - Combat snapshots include full combatant state
  - **Smart Storage Optimization**: Lightweight references for library-sourced combatants
    - Combatants from player/monster libraries stored as references instead of full copies
    - Only runtime state saved (HP, conditions, initiative, death saves)
    - Template data fetched from library on load to save storage space
    - Automatic restoration when loading saved combats
  - Dirty state tracking for unsaved changes
- **Combat History**: Access and manage previously saved encounters
  - List all saved combats
  - Rename existing combats
  - Delete unwanted combats with confirmation
- **Manual Save**: Click "Save" (or Ctrl/Cmd+S) to preserve your current combat state
- **Auto-load**: Combat state automatically loads when opening a saved encounter
  - Automatic reference restoration from libraries
  - Seamless merging of template data with runtime state
- **Local Storage**: All data stored in browser localStorage by default
  - Separate storage keys for combats, players, monsters, and settings
  - JSON serialization with error handling
  - ~5-10MB browser storage capacity
  - Optimized to maximize storage efficiency
- **Separate Player Storage**: Saved players persist independently across all combats
- **Monster Library Persistence**: Your custom monsters are saved locally

### User Interface

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
  - Desktop layout with side-by-side combatants and detail panel
  - Mobile layout with slide animation between list and details
  - Media query-based layout switching (768px breakpoint)
- **Collapsible Form**: Hide the combatant creation form when not needed
- **Color-Coded Groups**: Each group has a distinct color for easy identification
  - 8 preset colors: Blue, Red, Green, Purple, Orange, Pink, Yellow, Cyan
- **Avatar System**: Display character images or fallback to stylized initials
- **Visual HP Bars**: Color changes based on health percentage (green → yellow → red)
- **Sticky Controls**: Focus Mode keeps turn controls always visible
- **Touch-Friendly**: Large tap targets and mobile-optimized quick buttons
- **Multi-Language Support**: Available in English and French
  - Automatic language detection from browser settings
  - Easy language switching via flag dropdown
  - Persistent language preference
  - Complete translation of all UI elements
- **Toast Notifications**: User feedback for actions (success, error, warning, info)
  - Auto-dismiss with configurable duration
  - Manual close option
- **Combatant Detail Panel**: Expanded view with full stats
  - Large avatar display
  - All ability scores with modifiers
  - Initiative, HP, and AC at a glance
  - Markdown notes rendering
  - Color-coded border matching group color

### Confirmation Dialogs

- **Safe Deletions**: Confirmation prompts before removing combatants, groups, players, or combats
- **Context-Aware Messages**: Clear explanations of what will be deleted
- **Prevent Accidents**: Avoid accidentally losing important data
- **Bulk Action Warnings**: Confirmation for clearing all groups at once
- **Data Sync Prompts**: Download/upload confirmations for cloud sync

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite (Rolldown)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage + Google Drive (optional)
- **State Management**: React Hooks (custom `useCombatState`)
- **API Integration**: D&D 5e SRD GraphQL API
- **Internationalization**: i18next with browser language detection
- **Authentication**: Google Identity Services

## 🚀 Getting Started

> **Note:** This project is under active development! Features are being added regularly.

### Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager
- (Optional) Google OAuth 2.0 Client ID for cloud sync features

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yohannjouanneau/dnd-combat-tracker.git
cd dnd-combat-tracker
```

2. Install dependencies:

```bash
npm install
```

3. (Optional) Create a `.env` file for Google Drive sync:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## 📖 Usage Guide

### Creating a New Combat

1. From the home page, enter a name and optional description
2. Click "Create" to start a new combat encounter
3. The app will navigate to the combat tracker page

### Using Monster Search

1. **Type a monster name** in the combatant name field
2. **Click the search icon** or press Enter
3. **Browse results** from two sources:
   - **Your Library** (amber bookmark icon): Your custom monsters
   - **D&D API** (blue globe icon): Official SRD monsters
4. **Click any result** to auto-fill the form with stats
   - Automatically calculates ability modifiers
   - Imports HP, AC, and images
   - Adds external resource links
5. **Add to Library** to save any creature for future use

### Adding Combatants

1. **Fill in basic stats:**

   - Group Name (or search for a monster)
   - Current HP and Max HP (if maxHp is empty, it will default to hp)
   - AC (Armor Class)
   - Initiative Bonus (optional, adds to all initiative rolls)
   - Select a color for the group
   - Add an image URL (optional)
   - Add external resource URL (optional)

2. **Set up initiative groups:**

   - Each group can have a different initiative value
   - Initiative automatically rolls d20 + bonus when created
   - Click the dice icon to re-roll initiative for a group
   - Set count for how many combatants share that initiative
   - Example: 3 goblins with initiative 15, 2 goblins with initiative 12
   - Click "Add init group" to add more initiative tiers

3. **Choose an action:**
   - **Fight!**: Immediately add combatants to the current fight
   - **Park group**: Save for later use in this encounter
   - **Save player**: Reuse this character in future encounters
   - **Add to Library**: Save to your monster collection
   - **Hold Alt**: Combine Park/Save actions with Fight! for streamlined workflow

### Managing Your Monster Library

1. **Click the Library button** (book icon) on the main screen or combat page
2. **View all your custom creatures** with full stats displayed
   - HP, AC, and ability scores
   - Markdown notes with combat tags
3. **Create new monsters** with the "New" button
   - Add ability scores for automatic modifier calculations
   - Use Markdown editor with tag menu for abilities
4. **Edit existing monsters** to update their stats
5. **Load to form** to quickly add a library monster to combat
6. **Search integration**: Library monsters appear in name search results
7. **Delete monsters** you no longer need

### Managing Combat

- **Next/Previous Turn**: Navigate through the initiative order
  - Use buttons or **Arrow Left/Right** keyboard shortcuts
  - Active combatant automatically scrolls into view
- **Edit Initiative**: Click any initiative value to modify it mid-combat
  - Press Enter to save or Escape to cancel
  - Combatants automatically re-sort when initiative changes
- **Apply Damage/Healing**:
  - Manual: Enter amount and click checkmark (or press Enter)
  - Quick buttons (mobile): Tap ±1, ±5, or ±10 for fast adjustments
  - Auto-expand on mobile when combatant becomes active
  - Desktop: HP input auto-focuses for active combatant
- **View Combatant Details**: Click on any combatant card to see expanded view
  - Large avatar display
  - All ability scores with modifiers
  - Full HP, AC, and initiative stats
  - Markdown notes rendered with combat tags
  - Mobile: Slide animation for smooth transition
- **Toggle Conditions**:
  - Click "Add Condition" to see available conditions
  - Click condition name to toggle on/off
  - Active conditions show with X button for quick removal
- **Concentration**: Toggle concentration status in the combatant header
- **Death Saves**: Click success/failure boxes for dying characters (0 HP)
- **Focus Mode**: Press F key or click eye icon to hide forms and focus on combat
- **Remove Combatant**: Click trash icon on any combatant card (with confirmation)
- **Remove Group**: Use the "Groups" panel to remove all combatants of a group at once
- **Clear All Groups**: Remove all combatants from combat with single action (with confirmation)

### Using Cloud Sync

1. **Open Settings**: Click the settings icon on the combat list page
2. **Sign in with Google**: Click "Sign in with Google" button
3. **First Sync**:
   - If remote data exists, you'll be prompted to download or upload
   - Choose "Download" to get data from the cloud
   - Choose "Upload" to send your local data to the cloud
4. **Subsequent Syncs**: Click "Sync" button anytime to sync changes
5. **Cross-Device**: Your combats, players, and library sync across all devices
6. **Sign Out**: Click "Sign out" to disconnect Google Drive

### Keyboard Shortcuts

- **Arrow Right (→)**: Next turn
- **Arrow Left (←)**: Previous turn
- **F**: Toggle Focus Mode
- **Ctrl/Cmd + S**: Save combat
- **Alt** (hold): Enable "Fight Mode" modifier for Park/Save buttons
- **Enter**: Apply HP changes in input fields
- **Escape**: Cancel initiative editing

> **Note**: Turn navigation shortcuts are disabled when typing in input fields (except HP bar inputs)

### Using Saved Players

1. Saved players appear in the "Saved Players" panel
2. **Edit**: Load their stats into the form for modifications
3. **Fight!**: Add them directly to combat with current stats
4. **Delete**: Remove players you no longer need
5. Adjust initiative and HP as needed for this encounter
6. Updating a saved player (same name) overwrites the previous version

### Using Parked Groups

1. Park groups during combat setup to stage multiple enemy types
2. **Edit**: Load into form to modify stats before adding to combat
3. **Fight!**: Add directly to combat when ready
4. **Remove**: Clear parked groups you no longer need
5. Parked groups are encounter-specific (not saved across combats)

### Saving Combat Progress

1. Give your combat a name and description at the top of the page
2. Click "Save" button (or press Ctrl/Cmd+S) to persist the current state
3. Click "Back to List" to return to combat selection
4. Your combat appears in the list with open/rename/delete options
5. All combatants, turns, and states are preserved

### Changing Language

1. **Language Switcher**: Click the flag dropdown in the top bar
2. **Automatic Detection**: Language is auto-detected from browser settings
3. **Persistent**: Your language choice is saved for future sessions
4. **Complete Translation**: All UI elements are translated
   - Combat mechanics and conditions
   - Form labels and buttons
   - Colors and common actions
   - Confirmation messages and toasts

### Using Markdown Notes

1. **Add Notes**: Use the notes field in combatant form or monster library
2. **Tag Menu**: Click tag icons to insert combat-specific tags
   - 12 tags available: Hit, Damage, Healing, Conditions, Range, Speed, Save, AC, Resistance, Vulnerability, Spell, Recharge, Legendary
   - Each tag has color-coded styling and icons
3. **Dice Notation**: Type dice notation (e.g., "2d6", "1d20+5")
   - Automatically rendered with dice icon
4. **Markdown Formatting**: Use standard markdown syntax
   - Bold, italic, lists, links, etc.
   - GitHub-flavored markdown support
5. **View Notes**: Open combatant detail panel to see rendered notes

## 📁 Project Structure

```
src/
├── api/
│   ├── sync/                    # Cloud sync providers
│   │   ├── gdrive/             # Google Drive implementation
│   │   │   ├── GoogleDriveSyncClient.ts
│   │   │   └── GoogleDriveSyncProvider.ts
│   │   ├── SyncProvider.ts
│   │   └── types.ts
│   ├── DnD5eGraphQLClient.ts   # D&D API client
│   ├── fragments.ts             # GraphQL fragments
│   └── types.ts                 # API type definitions
├── components/
│   ├── CombatForm/              # Form for adding combatants
│   │   ├── AddCombatantForm.tsx
│   │   ├── CombatantNameWithSearch.tsx
│   │   ├── InitiativeGroupInput.tsx
│   │   ├── SavedPlayerPanel.tsx
│   │   └── SavedPlayerRow.tsx
│   ├── CombatantsList/          # Combat participants display
│   │   ├── CombatantCard.tsx
│   │   ├── CombatantsList.tsx
│   │   ├── HpBar.tsx
│   │   ├── DeathSaves.tsx
│   │   ├── ConcentrationToggle.tsx
│   │   └── ConditionsList.tsx
│   ├── CombatsList/             # Combat list page
│   │   ├── CombatList.tsx
│   │   └── CombatListItem.tsx
│   ├── GroupsOverview/          # Group summary
│   │   ├── GroupsOverview.tsx
│   │   └── GroupBadge.tsx
│   ├── MonsterLibrary/          # Monster library components
│   │   ├── MonsterLibraryModal.tsx
│   │   ├── MonsterListItem.tsx
│   │   └── MonsterEditModal.tsx
│   ├── ParkedGroups/            # Staged combatants
│   │   ├── ParkedGroupsPanel.tsx
│   │   └── ParkedGroupChip.tsx
│   ├── Settings/                # Settings modal
│   │   └── SettingsModal.tsx
│   ├── TurnControls/            # Turn navigation
│   │   ├── TurnControls.tsx
│   │   └── FocusModeToggle.tsx
│   ├── SaveBar.tsx              # Combat save/load controls
│   └── common/                  # Reusable components
│       ├── ColorPicker.tsx
│       ├── CombatantAvatar.tsx
│       ├── ConfirmationDialog.tsx
│       ├── LanguageSwitcher.tsx
│       ├── LabeledTextInput.tsx
│       ├── LabeledNumberInput.tsx
│       └── Toast/               # Toast notifications
├── i18n/                        # Internationalization
│   ├── locales/
│   │   ├── en/                  # English translations
│   │   └── fr/                  # French translations
│   └── index.ts
├── hooks/                       # Custom React hooks
│   ├── ConfirmationDialogProvider.tsx
│   └── useConfirmationDialog.ts
├── pages/
│   ├── CombatTrackerPage.tsx
│   └── CombatsPage.tsx
├── persistence/                 # Storage layer
│   ├── CombatStorageProvider.ts
│   ├── CombatantTemplateStorageProvider.ts
│   └── storage.ts
├── state.ts                     # State management
├── types.ts                     # TypeScript definitions
├── constants.ts                 # App constants
└── utils.ts                     # Utility functions
```

## 🏗️ Architecture

### State Management

The application uses a custom React hook `useCombatState` that manages all combat-related state:

- Combatants list with full stats and tracking
- Current turn and round tracking
- Parked groups for staging
- Saved players for reuse
- Monster library management
- Form state for new combatants
- Combat metadata (name, description, ID)
- Dirty state tracking for unsaved changes

### Data Flow

1. User interactions trigger state updates via the `CombatStateManager`
2. State changes propagate through React's component tree
3. Critical data is persisted to localStorage via storage providers
4. Optional cloud sync to Google Drive for cross-device access
5. On load, state is hydrated from localStorage or cloud

### Storage Strategy

- **Combat encounters**: Stored with unique IDs, timestamps, and optimized state snapshots
- **Saved players**: Stored separately for reuse across encounters
- **Monster library**: Personal collection of custom creatures
- **Smart optimization**: Combatants from libraries stored as lightweight references
  - Template data stored once in library
  - Combat snapshots only store runtime state (HP, conditions, initiative)
  - Automatic restoration merges template with runtime state on load
  - Significantly reduces storage footprint for large encounters
- **Manual save required**: Click "Save" button to persist combat changes
- **Data format**: JSON serialization with error handling
- **Storage keys**:
  - `dnd-ct:combats:v1` for combat encounters
  - `dnd-ct:players:v1` for saved players
  - `dnd-ct:monsters:v1` for monster library
  - `dnd-ct:lastSynced` for sync timestamp
  - `dnd-ct:settings:v1` for user settings

### API Integration

- **GraphQL Client**: Type-safe queries to D&D 5e SRD API
- **Caching**: 60-minute TTL for API responses
- **Fragment-based**: Reusable query fragments for consistency
- **Error Handling**: Graceful degradation if API is unavailable

### Cloud Sync Architecture

- **Provider Pattern**: Abstraction layer for sync implementations
- **Google Drive AppData**: Private, app-specific storage folder
- **Conflict Resolution**: Last-write-wins based on timestamps
- **Manual Sync**: User-initiated uploads/downloads
- **OAuth 2.0**: Secure authentication via Google Identity Services

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and component patterns
- Keep components small and focused
- Add comments for complex logic
- Test your changes thoroughly
- Ensure responsive design works on mobile
- Update translations for both English and French
- Add confirmation dialogs for destructive actions

## 🗺️ Roadmap

### Planned Features or ideas

- [ ] Drag-and-drop initiative reordering
- [ ] Dice roller integration
- [ ] Spell slot tracking
- [ ] Export combat JSON
- [ ] Themes (Dark light and others)
- [ ] Combat statistics and analytics
- [ ] Multi-language support (more languages)
- [ ] Temporary HP tracking
- [ ] Notes/comments per combatant
- [ ] Sound effects for turn changes
- [ ] Combat timer
- [ ] Monster stat blocks display
- [ ] Batch import/export
- [ ] Encounter builder with CR calculations

### Recently Added Features

- ✅ Google Drive cloud sync
- ✅ Multi-language support (English & French)
- ✅ Monster library system
- ✅ D&D 5e SRD API integration
- ✅ Dual search (library + API)
- ✅ Confirmation dialogs
- ✅ Toast notifications
- ✅ Ability score tracking
- ✅ External resource links
- ✅ Keyboard shortcut (Ctrl/Cmd+S) to save
- ✅ Markdown notes with combat tags
- ✅ Combatant detail panel
- ✅ Bulk clear all groups action
- ✅ Configurable combatant identifiers (letters/numbers)
- ✅ Dice notation rendering
- ✅ Desktop/mobile layout optimization
- ✅ Smart storage optimization with combatant references

### Known Limitations

- Cloud sync uses last-write-wins (no merge conflict resolution)
- No collaborative/multiplayer features
- Limited to browser localStorage capacity (~5-10MB) for local storage
- Image URLs must be publicly accessible
- Google Drive sync requires manual trigger

## 📄 License

This project is open source and available for personal use.

## 🙏 Acknowledgments

- **D&D 5e**: Wizards of the Coast for the amazing game system
- **D&D 5e SRD API**: For providing monster data
- **Lucide Icons**: Beautiful open-source icon library
- **Tailwind CSS**: For making styling enjoyable
- **React Community**: For excellent documentation and tools
- **i18next**: For making internationalization simple

## 📧 Contact

Project Link: [https://github.com/yohannjouanneau/dnd-combat-tracker](https://github.com/yohannjouanneau/dnd-combat-tracker)

---

**Made with ⚔️ for DMs everywhere**

_Roll for initiative!_ 🎲
