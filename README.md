# ⚔️ D&D Combat Tracker

> A modern, intuitive combat tracker for Dungeons & Dragons 5th Edition

[![Under Active Development](https://img.shields.io/badge/status-active%20development-brightgreen)]()

![Combat Tracker Demo 1](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_1.png)
![Combat Tracker Demo 2](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_2.png)
![Combat Tracker Demo 2](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_3.png)

[Try it!](https://yohannjouanneau.github.io/dnd-combat-tracker/)

## 🎯 Overview

D&D Combat Tracker is a web-based application designed to streamline combat encounters in Dungeons & Dragons 5e. Built for Dungeon Masters who want to focus on storytelling rather than bookkeeping, this tool handles initiative tracking, HP management, conditions, and more.

**Key Benefits:**
- ⚡ Lightning-fast combat setup with multi-combatant support
- 💾 Save and reuse players across multiple encounters
- 🎨 Visual feedback with color-coded groups and HP bars
- 📱 Responsive design works on desktop and mobile
- 🔒 All data stored locally - no account required
- ⌨️ Keyboard shortcuts for quick turn navigation
- 👁️ Focus Mode to minimize distractions during combat

## ✨ Features

### Combat Management
- **Initiative Tracking**: Support for multiple initiative groups per combatant
- **Editable Initiative**: Click on any initiative value to edit it mid-combat
- **HP Management**: Visual HP bars with quick damage/healing controls
  - Manual input field for precise adjustments
  - Quick buttons for common values (±1, ±5, ±10) on mobile
- **Turn Tracking**: Automatic turn progression with round counter
- **Keyboard Navigation**: 
  - Arrow Left/Right to navigate turns quickly
  - F key to toggle Focus Mode
  - Alt key modifier for combined actions (Park/Save + Fight)
- **Auto-scroll**: Active combatant automatically scrolls into view
- **Group Management**: Organize combatants by groups with color coding
- **Focus Mode**: Hide form and panels to concentrate on active combat

### Character Management
- **Saved Players**: Reuse characters across different combat encounters
  - Edit saved players to load them into the form
  - Add saved players directly to combat with "Fight!" button
  - Delete unwanted saved players
- **Parked Groups**: Stage combatants before adding them to combat
  - Edit parked groups to modify their stats
  - Add parked groups directly to combat
  - Remove parked groups when no longer needed
- **Custom Avatars**: Add character images via URL with automatic fallback to initials
- **Bulk Creation**: Create multiple combatants (e.g., "Goblin A, B, C") in one action
- **Initiative Bonus**: Set a modifier that automatically applies to rolled initiatives
- **Multiple Initiative Groups**: Create different initiative tiers for the same group

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
- **Combat History**: Access and manage previously saved encounters
  - List all saved combats
  - Rename existing combats
  - Delete unwanted combats
- **Manual Save**: Click "Save" to preserve your current combat state
- **Auto-load**: Combat state automatically loads when opening a saved encounter
- **Local Storage**: All data stored in browser localStorage (no cloud required)
- **Separate Player Storage**: Saved players persist independently across all combats

### User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Collapsible Form**: Hide the combatant creation form when not needed
- **Color-Coded Groups**: Each group has a distinct color for easy identification
- **Avatar System**: Display character images or fallback to stylized initials
- **Visual HP Bars**: Color changes based on health percentage (green → yellow → red)
- **Sticky Controls**: Focus Mode keeps turn controls always visible
- **Touch-Friendly**: Large tap targets and mobile-optimized quick buttons

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage
- **State Management**: React Hooks (custom `useCombatState`)

## 🚀 Getting Started

> **Note:** This project is under active development! Features are being added regularly.

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager

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

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

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

### Adding Combatants

1. **Fill in basic stats:**
   - Group Name (e.g., "Goblin", "Orc Warrior")
   - Current HP and Max HP (if maxHp is empty, it will default to hp)
   - AC (Armor Class)
   - Initiative Bonus (optional, adds to all initiative rolls)
   - Select a color for the group
   - Add an image URL (optional)

2. **Set up initiative groups:**
   - Each group can have a different initiative value
   - Initiative automatically rolls d20 + bonus when created
   - Click the dice icon to re-roll initiative for a group
   - Set count for how many combatants share that initiative
   - Example: 3 goblins with initiative 15, 2 goblins with initiative 12
   - Click "Add init group" to add more initiative tiers

3. **Choose an action:**
   - **Fight!**: Immediately add combatants to the current fight
   - **Park Group**: Save for later use in this encounter
   - **Save player**: Reuse this character in future encounters
   - **Hold Alt**: Combine Park/Save actions with Fight! for streamlined workflow

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
- **Toggle Conditions**: 
  - Click "Add Condition" to see available conditions
  - Click condition name to toggle on/off
  - Active conditions show with X button for quick removal
- **Concentration**: Toggle concentration status in the combatant header
- **Death Saves**: Click success/failure boxes for dying characters (0 HP)
- **Focus Mode**: Press F key or click eye icon to hide forms and focus on combat
- **Remove Combatant**: Click trash icon on any combatant card
- **Remove Group**: Use the "Groups" panel to remove all combatants of a group at once

### Keyboard Shortcuts

- **Arrow Right (→)**: Next turn
- **Arrow Left (←)**: Previous turn
- **F**: Toggle Focus Mode
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
2. Click "Save" button to persist the current state
3. Click "Back to List" to return to combat selection
4. Your combat appears in the list with open/rename/delete options
5. All combatants, turns, and states are preserved

## 📁 Project Structure

```
src/
├── components/
│   ├── CombatForm/          # Form for adding combatants
│   │   ├── AddCombatantForm.tsx
│   │   ├── InitiativeGroupInput.tsx
│   │   ├── SavedPlayerPanel.tsx
│   │   └── SavedPlayerRow.tsx
│   ├── CombatantsList/      # Combat participants display
│   │   ├── CombatantCard.tsx
│   │   ├── CombatantsList.tsx
│   │   ├── HpBar.tsx
│   │   ├── DeathSaves.tsx
│   │   ├── ConcentrationToggle.tsx
│   │   └── ConditionsList.tsx
│   ├── GroupsOverview/      # Group summary
│   │   ├── GroupsOverview.tsx
│   │   └── GroupBadge.tsx
│   ├── ParkedGroups/        # Staged combatants
│   │   ├── ParkedGroupsPanel.tsx
│   │   └── ParkedGroupChip.tsx
│   ├── TurnControls/        # Turn navigation
│   │   ├── TurnControls.tsx
│   │   └── FocusModeToggle.tsx
│   ├── SaveBar.tsx          # Combat save/load controls
│   └── common/              # Reusable components
│       ├── ColorPicker.tsx
│       ├── CombatantAvatar.tsx
│       ├── LabeledTextInput.tsx
│       └── LabeledNumberInput.tsx
├── pages/
│   ├── CombatTrackerPage.tsx
│   └── CombatsPage.tsx
├── persistence/             # Storage layer
│   ├── CombatStorageProvider.ts
│   ├── PlayerStorageProvider.ts
│   └── storage.ts
├── state.ts                 # State management
├── types.ts                 # TypeScript definitions
├── constants.ts             # App constants
└── utils.ts                 # Utility functions
```

## 🏗️ Architecture

### State Management

The application uses a custom React hook `useCombatState` that manages all combat-related state:
- Combatants list with full stats and tracking
- Current turn and round tracking
- Parked groups for staging
- Saved players for reuse
- Form state for new combatants
- Combat metadata (name, description, ID)

### Data Flow

1. User interactions trigger state updates via the `CombatStateManager`
2. State changes propagate through React's component tree
3. Critical data is persisted to localStorage via storage providers
4. On load, state is hydrated from localStorage

### Storage Strategy

- **Combat encounters**: Stored with unique IDs, timestamps, and full state snapshots
- **Saved players**: Stored separately for reuse across encounters
- **Manual save required**: Click "Save" button to persist combat changes
- **Data format**: JSON serialization with error handling
- **Storage keys**: 
  - `dnd-ct:combats:v1` for combat encounters
  - `dnd-ct:players:v1` for saved players

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

## 🗺️ Roadmap

### Planned Features
- [ ] Drag-and-drop initiative reordering
- [ ] Dice roller integration
- [ ] Spell slot tracking
- [ ] Monster stat blocks integration (D&D 5e SRD)
- [ ] Export combat logs (PDF/CSV)
- [ ] Dark/light theme toggle
- [ ] Undo/redo functionality
- [ ] Combat statistics and analytics
- [ ] Cloud sync (optional)
- [ ] Multi-language support
- [ ] Temporary HP tracking
- [ ] Notes/comments per combatant
- [ ] Sound effects for turn changes
- [ ] Combat timer

### Known Limitations
- All data is stored locally (no cloud backup)
- No collaborative/multiplayer features
- Limited to browser localStorage capacity (~5-10MB)
- Image URLs must be publicly accessible

## 📄 License

This project is open source and available for personal and educational use.

## 🙏 Acknowledgments

- **D&D 5e**: Wizards of the Coast for the amazing game system
- **Lucide Icons**: Beautiful open-source icon library
- **Tailwind CSS**: For making styling enjoyable
- **React Community**: For excellent documentation and tools

## 📧 Contact

Project Link: [https://github.com/yohannjouanneau/dnd-combat-tracker](https://github.com/yohannjouanneau/dnd-combat-tracker)

---

**Made with ⚔️ for DMs everywhere**

*Roll for initiative!* 🎲
