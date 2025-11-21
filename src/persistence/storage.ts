import type {
  MonsterData,
  MonsterDataInput,
  SavedCombat,
  SavedCombatInput,
  SavedPlayer,
  SavedPlayerInput,
} from "../types";
import { CombatStorageProvider } from "./CombatStorageProvider";
import { MonsterStorageProvider } from "./MonsterStorageProvider";
import { PlayerStorageProvider } from "./PlayerStorageProvider";

const COMBAT_STORAGE_KEY = "dnd-ct:combats:v1";
const PLAYER_STORAGE_KEY = "dnd-ct:players:v1";
const MONSTER_STORAGE_KEY = "dnd-ct:monsters:v1";

export class DataStore {
  private combatProvider: CombatStorageProvider;
  private playerProvider: PlayerStorageProvider;
  private monsterProvider: MonsterStorageProvider;

  constructor(
    combatProvider: CombatStorageProvider = new CombatStorageProvider(
      COMBAT_STORAGE_KEY
    ),
    playerProvider: PlayerStorageProvider = new PlayerStorageProvider(
      PLAYER_STORAGE_KEY
    ),
    monsterProvider: MonsterStorageProvider = new MonsterStorageProvider(
      MONSTER_STORAGE_KEY
    )
  ) {
    this.combatProvider = combatProvider;
    this.playerProvider = playerProvider;
    this.monsterProvider = monsterProvider
  }

  listCombat() {
    return this.combatProvider.list();
  }
  getCombat(id: string) {
    return this.combatProvider.get(id);
  }
  createCombat(input: SavedCombatInput) {
    return this.combatProvider.create(input);
  }
  updateCombat(id: string, patch: Partial<SavedCombat>) {
    return this.combatProvider.update(id, patch);
  }
  deleteCombat(id: string) {
    return this.combatProvider.delete(id);
  }

  listPlayer() {
    return this.playerProvider.list();
  }
  getPlayer(id: string) {
    return this.playerProvider.get(id);
  }
  createPlayer(input: SavedPlayerInput) {
    return this.playerProvider.create(input);
  }
  updatePlayer(id: string, patch: Partial<SavedPlayer>) {
    return this.playerProvider.update(id, patch);
  }
  deletePlayer(id: string) {
    return this.playerProvider.delete(id);
  }

  listMonster() {
    return this.monsterProvider.list();
  }
  getMonster(id: string) {
    return this.monsterProvider.get(id);
  }
  searchMonster(query: string) {
    return this.monsterProvider.search(query);
  }
  createMonster(input: MonsterDataInput) {
    return this.monsterProvider.create(input);
  }
  updateMonster(id: string, patch: Partial<MonsterData>) {
    return this.monsterProvider.update(id, patch);
  }
  deleteMonster(id: string) {
    return this.monsterProvider.delete(id);
  }
}

export const dataStore = new DataStore();
