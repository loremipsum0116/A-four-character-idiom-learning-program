import Phaser from 'phaser';
import { gameConfig } from './game/config.js';
import './styles/main.css';

/**
 * 사자성어 학습 게임 메인 엔트리 포인트
 *
 * 요구사항 정의서 기반 웹 게임
 * - 턴제 전투 시스템 (FR 4.0)
 * - 학습 성과 기반 데미지 연산 (FR 7.0)
 * - 제스처 인식 지원
 */

class IdiomGame {
  constructor() {
    this.game = null;
    this.init();
  }

  init() {
    console.log('🦁 사자의 역습 - 게임 초기화 중...');

    // 로딩 화면 제거
    setTimeout(() => {
      const loading = document.getElementById('loading');
      if (loading) {
        loading.style.display = 'none';
      }
    }, 1000);

    // Phaser 게임 인스턴스 생성
    this.game = new Phaser.Game(gameConfig);

    // 전역 게임 객체 설정 (디버깅용)
    window.idiomGame = this.game;

    console.log('✅ 게임 초기화 완료');
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}

// 게임 시작
const idiomGame = new IdiomGame();

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  idiomGame.destroy();
});

export default idiomGame;
