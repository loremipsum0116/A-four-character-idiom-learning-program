import Phaser from 'phaser';
import { clearGuestData, loadGameData } from '../../utils/storageManager.js';
import { initGesture, removeGesture } from '../../gesture.js';

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

    // 제스처 제거
    if (typeof removeGesture === 'function') {
      removeGesture();
    }

    // 타이틀
    this.add.text(width / 2, 80, '🦁 사자의 역습', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 유저 정보
    const nickname = this.userData.nickname || '게스트';
    this.add.text(width / 2, 140, `환영합니다, ${nickname}님!`, {
      fontSize: '24px',
      color: '#a5b4fc'
    }).setOrigin(0.5);

    // 버튼 만들기
    this.createMenuButtons();
  }

  createMenuButtons() {
    const width = this.cameras.main.width;
    const centerX = width / 2;

    // 🔓 해금 여부 로드
    // 무한 모드도 히든 보스전과 동일하게 해금 조건(hiddenBossUnlocked)을 공유합니다.
    const hiddenUnlocked = loadGameData('hiddenBossUnlocked', 'false') === 'true';
    
    // 이전에 사용된 infiniteUnlocked 변수 정의는 제거되었습니다.
    // const infiniteUnlocked = loadGameData('infiniteModeUnlocked', 'false') === 'true';

    // 공통 해금 처리 함수
    const lockedButton = (unlocked, labelUnlocked, labelLocked, scene, descUnlocked, descLocked) => {
      return {
        text: unlocked ? labelUnlocked : labelLocked,
        color: unlocked ? 0xffa500 : 0x6b7280,
        hoverColor: unlocked ? 0xffc72c : 0x6b7280,
        scene: unlocked ? scene : null,
        description: unlocked ? descUnlocked : descLocked
      };
    };

    // 버튼 리스트 (히든/무한 둘 다 통일 로직)
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

      // 🕶️ 히든보스 — 통일된 해금 UI
      lockedButton(
        hiddenUnlocked,
        '🕶️ 히든 보스전',
        '🔒 히든 보스전',
        'HiddenBossScene',
        '???와 1:1 대결을 펼칩니다',
        '모든 보스전을 클리어하면 해금됩니다'
      ),

      // ♾️ 무한 모드 — 통일된 해금 UI
      lockedButton(
        hiddenUnlocked, // <<< infiniteUnlocked 대신 hiddenUnlocked 사용
        '♾️ 무한 모드',
        '🔒 무한 모드',
        'InfiniteModeScene',
        '끝없이 도전하며 기록을 세웁니다',
        '모든 게임 모드를 클리어하면 해금됩니다'
      ),

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

    // 버튼 렌더링
    buttons.forEach((btn, index) => {
      const adjustedStartY = 200;
      const y = adjustedStartY + index * 80;

      const rect = this.add.rectangle(centerX, y, 500, 70, btn.color)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.onButtonClick(btn.scene))
        .on('pointerover', () => {
          rect.setFillStyle(btn.hoverColor);
          desc.setAlpha(1);
        })
        .on('pointerout', () => {
          rect.setFillStyle(btn.color);
          desc.setAlpha(0.7);
        });

      this.add.text(centerX, y - 10, btn.text, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const desc = this.add.text(centerX, y + 15, btn.description, {
        fontSize: '14px',
        color: '#e5e7eb',
        alpha: 0.7
      }).setOrigin(0.5);
    });

    // 로그아웃
    const logoutBtn = this.add.text(width - 20, 20, '로그아웃', {
      fontSize: '18px',
      color: '#94a3b8'
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.logout())
      .on('pointerover', () => logoutBtn.setColor('#ef4444'))
      .on('pointerout', () => logoutBtn.setColor('#94a3b8'));
  }

  onButtonClick(sceneName) {
    // 🔒 잠겨 있을 때
    if (!sceneName) {
      console.log('🔒 아직 해금되지 않은 모드입니다!');
      return;
    }

    console.log(`🎮 ${sceneName} 이동`);

    // 제스처 필요한 씬
    if (
      sceneName === 'LearningModeScene' ||
      sceneName === 'StageSelectScene' ||
      sceneName === 'InfiniteModeScene' ||
      sceneName === 'HiddenBossScene'
    ) {
      const container = document.getElementById('game-container');
      initGesture(container);
    }

    this.scene.start(sceneName);
  }

  logout() {
    console.log('🚪 로그아웃');
    clearGuestData();

    if (typeof removeGesture === 'function') {
      removeGesture();
    }

    this.scene.start('LoginScene');
  }
}
