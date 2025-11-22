import Phaser from 'phaser';

// 게임 씬 임포트
import BootScene from './scenes/BootScene.js';
import LoginScene from './scenes/LoginScene.js';
import IntroScene from './scenes/IntroScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import LearningModeScene from './scenes/learning/LearningModeScene.js';
import StageSelectScene from './scenes/StageSelectScene.js';
import BattleScene from './scenes/BattleScene.js';
import StatisticsScene from './scenes/StatisticsScene.js';
import EndingScene from './scenes/EndingScene.js';
import PvPScene from './scenes/PvPScene.js';
import FillBlankScene from './scenes/learning/FillBlankScene.js';
import DifficultySelectScene from './scenes/learning/DifficultySelectScene.js';
import CardMatchScene from './scenes/learning/CardMatchScene.js';
import BookScene from './scenes/learning/BookScene.js';
import FinalResultScene from './scenes/FinalResultScene.js';
// 💡 [추가] InfiniteModeScene 임포트
import InfiniteModeScene from './scenes/InfiniteMode.js';
// 히든 보스 추가 임포트
import HiddenBossScene from './scenes/HiddenBossScene.js';




/**
 * Phaser 게임 설정
 * 요구사항 정의서의 모든 씬을 포함
 */
export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#2d3561',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,        // 초기 로딩
    LoginScene,       // FR 1.0 - 회원가입/로그인
    IntroScene,       // 게임 스토리 인트로
    MainMenuScene,    // FR 2.0 - 메인 화면
    LearningModeScene,// FR 3.0 - 학습 모드
    DifficultySelectScene,
    CardMatchScene,
    FillBlankScene,
    BookScene,
    StageSelectScene, // FR 4.1 - 스테이지 선택
    BattleScene,      // FR 4.0 - 턴제 전투 (핵심)
    StatisticsScene,  // FR 6.0 - 통계
    EndingScene,      // FR 5.1 - 엔딩
    PvPScene,          // FR 5.5 - PvP
    FinalResultScene,  // 최종 결과 씬
    InfiniteModeScene, // 💡 [추가] 무한 모드 씬
    HiddenBossScene   // 히든 보스 씬
  ],
  render: {
    pixelArt: false,
    antialias: true
  }
};

// 상수들은 utils/constants.js에서 가져옴
export { GAME_CONSTANTS, API_ENDPOINTS } from '../utils/constants.js';