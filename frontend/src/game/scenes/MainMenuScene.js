import Phaser from 'phaser';
import { clearGuestData } from '../../utils/storageManager.js';

/**
 * MainMenuScene - 메인 메뉴
 *
 * FR 2.1: 메인 화면
 * - 학습 모드
 * - 게임 모드 (보스전)
 * - 개인 기록
 * - 환경 설정
 */
export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  init(data) {
    this.userData = data.user || {};
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d3561);

    // 타이틀
    this.add.text(width / 2, 80, '🦁 사자의 역습', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 사용자 정보
    const nickname = this.userData.nickname || '게스트';
    this.add.text(width / 2, 140, `환영합니다, ${nickname}님!`, {
      fontSize: '24px',
      color: '#a5b4fc'
    }).setOrigin(0.5);

    // 메뉴 버튼들
    this.createMenuButtons();
  }

  createMenuButtons() {
    const width = this.cameras.main.width;
    const centerX = width / 2;
    const startY = 250;
    const buttonGap = 100;

    const buttons = [
      {
        text: '📚 학습 모드',
        color: 0x10b981,
        hoverColor: 0x34d399,
        scene: 'LearningModeScene',
        description: '사자성어를 학습합니다'
      },
      {
        text: '⚔️ 게임 모드 (보스전)',
        color: 0xef4444,
        hoverColor: 0xf87171,
        scene: 'StageSelectScene',
        description: '12지신과 턴제 전투를 합니다'
      },
      {
        text: '📊 개인 기록',
        color: 0x3b82f6,
        hoverColor: 0x60a5fa,
        scene: 'StatisticsScene',
        description: '학습 통계를 확인합니다'
      },
      {
        text: '⚙️ 환경 설정',
        color: 0x6366f1,
        hoverColor: 0x818cf8,
        scene: null,
        description: '사운드, 알림 등 설정'
      }
    ];

    buttons.forEach((btn, index) => {
      const y = startY + (index * buttonGap);

      // 버튼 배경
      const button = this.add.rectangle(centerX, y, 500, 70, btn.color)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.onButtonClick(btn.scene))
        .on('pointerover', () => {
          button.setFillStyle(btn.hoverColor);
          desc.setAlpha(1);
        })
        .on('pointerout', () => {
          button.setFillStyle(btn.color);
          desc.setAlpha(0.7);
        });

      // 버튼 텍스트
      this.add.text(centerX, y - 10, btn.text, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // 설명 텍스트
      const desc = this.add.text(centerX, y + 15, btn.description, {
        fontSize: '14px',
        color: '#e5e7eb',
        alpha: 0.7
      }).setOrigin(0.5);
    });

    // 로그아웃 버튼
    const logoutBtn = this.add.text(width - 20, 20, '로그아웃', {
      fontSize: '18px',
      color: '#94a3b8'
    }).setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.logout())
      .on('pointerover', () => logoutBtn.setColor('#ef4444'))
      .on('pointerout', () => logoutBtn.setColor('#94a3b8'));
  }

  onButtonClick(sceneName) {
    if (!sceneName) {
      console.log('⚙️ 설정 기능은 준비 중입니다');
      return;
    }

    console.log(`🎮 ${sceneName}으로 이동`);
    this.scene.start(sceneName);
  }

  logout() {
    console.log('🚪 로그아웃');
    // 게스트 데이터 삭제 (게스트 모드인 경우)
    clearGuestData();
    this.scene.start('LoginScene');
  }
}
