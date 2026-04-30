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

- **Initiative Tracking** with editable values and multiple groups per combatant
- **HP Management** with visual bars, quick buttons (mobile), and keyboard shortcuts
- **Turn Navigation** via keyboard (Arrow keys) with auto-scroll to active combatant
- **Focus Mode** to minimize distractions during combat
- **Group Management** with color coding and bulk actions

### Character & Monster Tools

- **Saved Players** - Reuse characters across encounters
- **Monster Library** - Build your personal collection with full stats and notes
- **Combatant Pool** - Stage combatants before adding to combat
- **D&D 5e SRD Integration** - Search and auto-fill official monsters
- **Bulk Creation** - Generate multiple combatants at once (e.g., "Goblin A, B, C")

### Combat Features

- **Death Saving Throws** tracking
- **Concentration** monitoring
- **Conditions** - Quick-toggle 14 standard D&D 5e conditions
- **Ability Scores** with automatic modifier calculations
- **Markdown Notes** with combat tags and dice notation

### Data & Sync

- **Local Storage** - All data saved in browser by default
- **Google Drive Sync** - Optional cloud backup across devices
- **Smart Storage** - Optimized references for library-sourced combatants
- **Combat History** - Save, rename, and load encounters

### User Interface

- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Multi-Language** - English and French support
- **Visual Feedback** - Color-coded HP bars, avatars, and toast notifications
- **Keyboard Shortcuts** - Navigate turns, save combats, and toggle modes

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite (Rolldown)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage + Google Drive (optional)
- **State Management**: Modular store hooks (Zustand-like pattern)
- **API Integration**: D&D 5e SRD GraphQL API
- **Internationalization**: i18next with browser language detection
- **Authentication**: Google Identity Services
- **Markdown**: react-markdown with remark-gfm

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

### Quick Start

1. **Create Combat** - Enter name/description and click "Create"
2. **Add Combatants** - Fill in stats (Name, HP, AC, Initiative) or search for monsters
3. **Navigate Turns** - Use Arrow keys or Next/Previous buttons
4. **Apply Damage** - Enter value and press Enter, or use quick buttons on mobile
5. **Save Progress** - Press Ctrl/Cmd+S to save your combat

### Monster Search

- Type monster name in combatant field
- Results show from both your Library (amber) and D&D API (blue)
- Click any result to auto-fill stats

### Combat Actions

- **Fight!** - Add combatants to combat immediately
- **Park Group** - Stage combatants for later (cleared between combats)
- **Save Player** - Reuse characters in future encounters
- **Add to Library** - Save monsters to your personal collection
- **Add to Fight checkbox** - Combine Park/Save with Fight! for faster workflow
- **Add Another checkbox** - Keep form open to quickly add multiple groups

### During Combat

- **Edit Initiative** - Click value to modify, Enter to save, Escape to cancel
- **Conditions** - Click "Add Condition" to toggle status effects
- **Death Saves** - Click boxes when HP reaches 0
- **Focus Mode** - Press F to hide forms and minimize distractions
- **Combatant Details** - Click card to view full stats and notes

### Cloud Sync

1. Open Settings → Sign in with Google
2. First sync: Choose Download (from cloud) or Upload (to cloud)
3. Click "Sync" anytime to backup changes across devices

### Keyboard Shortcuts

- `→` / `←` - Navigate turns
- `F` - Toggle Focus Mode
- `Ctrl/Cmd + S` - Save combat
- `Enter` - Apply HP changes
- `Escape` - Cancel editing

## 📁 Project Structure

```
src/
├── api/
│   ├── sync/                    # Cloud sync providers
│   │   ├── gdrive/             # Google Drive implementation
│   │   ├── SyncProvider.ts
│   │   └── types.ts
│   ├── DnD5eGraphQLClient.ts   # D&D API client
│   ├── fragments.ts             # GraphQL fragments
│   └── types.ts                 # API type definitions
├── components/
│   ├── CombatForm/              # Form for adding combatants
│   ├── CombatantsList/          # Combat participants display
│   ├── CombatLayout/            # Responsive layout components
│   │   ├── CombatLayout.tsx
│   │   ├── DesktopCombatLayout.tsx
│   │   └── MobileCombatLayout.tsx
│   ├── CombatantDetailPanel/   # Detailed combatant view
│   ├── CombatsList/             # Combat list page
│   ├── GroupsOverview/          # Group summary
│   ├── MonsterLibrary/          # Monster library components
│   ├── ParkedGroups/            # Staged combatants
│   ├── Settings/                # Settings modal
│   ├── TurnControls/            # Turn navigation
│   ├── SyncButton.tsx           # Google Drive sync control
│   ├── TopBar.tsx               # Top navigation bar
│   └── common/                  # Reusable components
├── contexts/                    # React contexts
│   ├── ThemeProvider.tsx
│   ├── ToastContext.tsx
│   ├── ToastProvider.tsx
│   └── ConfirmationDialogProvider.tsx
├── hooks/                       # Custom React hooks
│   ├── useConfirmationDialog.ts
│   ├── useMediaQuery.ts
│   ├── useSettings.ts
│   └── useTheme.ts
├── i18n/                        # Internationalization
│   ├── locales/
│   │   ├── en/                  # English translations
│   │   └── fr/                  # French translations
│   └── index.ts
├── pages/
│   ├── CombatTrackerPage.tsx
│   └── CombatsPage.tsx
├── persistence/                 # Storage layer
│   ├── CombatStorageProvider.ts
│   ├── CombatantTemplateStorageProvider.ts
│   └── storage.ts
├── store/                       # State management
│   ├── hooks/                   # Store hooks
│   │   ├── useCombatantStore.ts
│   │   ├── useCombatStore.ts
│   │   ├── useCombatantFormStore.ts
│   │   ├── useMonsterStore.ts
│   │   ├── useParkedGroupStore.ts
│   │   └── usePlayerStore.ts
│   ├── state.ts
│   └── types.ts
├── utils/                       # Utility functions
│   ├── utils.ts
│   └── monsterNotes.ts
├── types.ts                     # TypeScript definitions
└── constants.ts                 # App constants
```

## 🏗️ Architecture

### State Management

The application uses a modular store architecture with specialized hooks:

- **useCombatantStore** - Combatants list with full stats and tracking
- **useCombatStore** - Current turn, round tracking, and combat metadata
- **useParkedGroupStore** - Combatant pool for staging
- **usePlayerStore** - Saved players for reuse
- **useMonsterStore** - Monster library management
- **useCombatantFormStore** - Form state for new combatants

Each store hook manages its own slice of state with dedicated actions and persistence logic.

### Data Flow

1. User interactions trigger state updates via store hooks
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
- [ ] Include Players in Library
- [ ] Dice roller integration
- [ ] Spell slot tracking
- [ ] Export / Import combat JSON
- [ ] Temporary HP tracking
- [ ] Combat timer

### Recently Added Features

- ✅ Google Drive cloud sync
- ✅ Multi-language support (English & French)
- ✅ Monster library system
- ✅ D&D 5e SRD API integration
- ✅ Dual search (library + API)
- ✅ Markdown notes with combat tags
- ✅ Combatant detail panel

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
