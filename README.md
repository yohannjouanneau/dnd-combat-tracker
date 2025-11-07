# ⚔️ D&D Combat Tracker

> A modern, intuitive combat tracker for Dungeons & Dragons 5th Edition

[![Under Active Development](https://img.shields.io/badge/status-active%20development-brightgreen)]()

![Combat Tracker Demo 1](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_1.png)
![Combat Tracker Demo 2](https://github.com/yohannjouanneau/dnd-combat-tracker/blob/main/screenshots/dnd_combat_tracker_screenshot_2.png)

## 🎯 Overview

D&D Combat Tracker is a web-based application designed to streamline combat encounters in Dungeons & Dragons 5e. Built for Dungeon Masters who want to focus on storytelling rather than bookkeeping, this tool handles initiative tracking, HP management, conditions, and more.

**Key Benefits:**
- ⚡ Lightning-fast combat setup with multi-combatant support
- 💾 Save and reuse players across multiple encounters
- 🎨 Visual feedback with color-coded groups and HP bars
- 📱 Responsive design works on desktop and mobile
- 🔒 All data stored locally - no account required

## ✨ Features

### Combat Management
- **Initiative Tracking**: Support for multiple initiative groups per combatant
- **HP Management**: Visual HP bars with quick damage/healing controls
- **Turn Tracking**: Automatic turn progression with round counter
- **Group Management**: Organize combatants by groups with color coding

### Character Management
- **Saved Players**: Reuse characters across different combat encounters
- **Parked Groups**: Stage combatants before adding them to combat
- **Custom Avatars**: Add character images via URL
- **Bulk Creation**: Create multiple combatants (e.g., "Goblin A, B, C") in one action

### Combat Features
- **Death Saving Throws**: Track successes and failures for dying characters
- **Concentration**: Monitor which characters are concentrating on spells
- **Conditions**: Quick-toggle 14 standard D&D 5e conditions (Blinded, Charmed, etc.)
- **AC Display**: Quick reference for armor class

### Data Persistence
- **Save Encounters**: Save combat states with names and descriptions
- **Combat History**: Access previously saved encounters
- **Manual Save**: Click "Save" to preserve your current combat state
- **Local Storage**: All data stored in browser localStorage (no cloud required)

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
git clone https://github.com/yourusername/dnd-combat-tracker.git
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

### Adding Combatants

1. **Fill in basic stats:**
   - Group Name (e.g., "Goblin", "Orc Warrior")
   - Current HP and Max HP
   - AC (Armor Class)
   - Select a color for the group

2. **Set up initiative groups:**
   - Each group can have a different initiative value
   - Set count for how many combatants share that initiative
   - Example: 3 goblins with initiative 15, 2 goblins with initiative 12
   - Click "Add Group" to add more initiative tiers

3. **Choose an action:**
   - **Add to Combat**: Immediately add combatants to the current fight
   - **Add to Parked Groups**: Save for later use in this encounter
   - **Save as Player**: Reuse this character in future encounters

### Managing Combat

- **Next/Previous Turn**: Navigate through the initiative order
- **Apply Damage**: Enter amount and click the minus button
- **Apply Healing**: Enter amount and click the plus button
- **Toggle Conditions**: Click condition buttons to apply/remove effects
- **Concentration**: Toggle concentration status for spell tracking
- **Death Saves**: Click success/failure boxes for dying characters

### Using Saved Players

1. Saved players appear in the "Saved Players" panel
2. Click "Include" to load their stats into the form
3. Adjust initiative and HP as needed for this encounter
4. Add to combat

## 📁 Project Structure

```
src/
├── components/
│   ├── CombatForm/          # Form for adding combatants
│   │   ├── AddCombatantForm.tsx
│   │   ├── InitiativeGroupInput.tsx
│   │   └── SavedPlayerPanel.tsx
│   ├── CombatantsList/      # Combat participants display
│   │   ├── CombatantCard.tsx
│   │   ├── HpBar.tsx
│   │   ├── DeathSaves.tsx
│   │   └── ConditionsList.tsx
│   ├── GroupsOverview/      # Group summary
│   ├── ParkedGroups/        # Staged combatants
│   ├── TurnControls/        # Turn navigation
│   └── common/              # Reusable components
├── pages/
│   ├── CombatTrackerPage.tsx
│   └── CombatsPage.tsx
├── persistence/             # Storage layer
│   ├── CombatStorageProvider.ts
│   ├── PlayerStorageProvider.ts
│   └── storage.ts
├── state.ts                 # State management
├── types.ts                 # TypeScript definitions
└── constants.ts             # App constants
```

## 🏗️ Architecture

### State Management

The application uses a custom React hook `useCombatState` that manages all combat-related state:
- Combatants list with full stats
- Current turn and round tracking
- Parked groups and saved players
- Form state for new combatants

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

## 🗺️ Roadmap

### Planned Features
- [ ] Drag-and-drop initiative reordering
- [ ] Dice roller integration
- [ ] Spell slot tracking
- [ ] Monster stat blocks integration
- [ ] Export combat logs
- [ ] Dark/light theme toggle
- [ ] Undo/redo functionality
- [ ] Combat statistics and analytics
- [ ] Cloud sync (optional)
- [ ] Multi-language support

### Known Limitations
- All data is stored locally (no cloud backup)
- No collaborative/multiplayer features
- Limited to browser localStorage capacity (~5-10MB)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **D&D 5e**: Wizards of the Coast for the amazing game system
- **Lucide Icons**: Beautiful open-source icon library
- **Tailwind CSS**: For making styling enjoyable
- **React Community**: For excellent documentation and tools

## 📧 Contact

Project Link: [https://github.com/yourusername/dnd-combat-tracker](https://github.com/yourusername/dnd-combat-tracker)

---

**Made with ❤️ for DMs everywhere**

*Roll for initiative!* 🎲