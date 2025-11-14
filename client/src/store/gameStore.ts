import { create } from 'zustand';
import type { GameStage } from '../types';
import { gameAPI } from '../services/api';

interface GameState {
  stages: GameStage[];
  currentStage: GameStage | null;
  currentStageId: number | null;
  playerHp: number;
  bossHp: number;
  turn: 'player' | 'boss';
  isLoading: boolean;
  error: string | null;

  loadStages: () => Promise<void>;
  selectStage: (stageId: number) => Promise<void>;
  setPlayerHp: (hp: number) => void;
  setBossHp: (hp: number) => void;
  setTurn: (turn: 'player' | 'boss') => void;
  resetBattle: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  stages: [],
  currentStage: null,
  currentStageId: null,
  playerHp: 100,
  bossHp: 0,
  turn: 'player',
  isLoading: false,
  error: null,

  loadStages: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await gameAPI.getStages();
      set({ stages: response.stages, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || '스테이지 로드 실패',
        isLoading: false,
      });
    }
  },

  selectStage: async (stageId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await gameAPI.getStage(stageId);
      set({
        currentStage: response.stage,
        currentStageId: stageId,
        bossHp: response.stage.boss_hp,
        playerHp: 100,
        turn: 'player',
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || '스테이지 선택 실패',
        isLoading: false,
      });
    }
  },

  setPlayerHp: (hp: number) => set({ playerHp: Math.max(0, hp) }),

  setBossHp: (hp: number) => set({ bossHp: Math.max(0, hp) }),

  setTurn: (turn: 'player' | 'boss') => set({ turn }),

  resetBattle: () => set({
    currentStage: null,
    currentStageId: null,
    playerHp: 100,
    bossHp: 0,
    turn: 'player',
  }),
}));
