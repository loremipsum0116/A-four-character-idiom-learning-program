import Phaser from 'phaser';

/**
 * BootScene - 초기 로딩 씬
 *
 * 게임 에셋 로딩 및 초기화
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('🎮 BootScene: 에셋 로딩 시작');

    // 로딩 바 생성
    this.createLoadingBar();

    // TODO: 에셋 로딩 (스프라이트, 사운드 등)
    // 현재는 임시 데이터만 로드

    this.load.on('progress', (value) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x667eea, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 4,
        this.cameras.main.height / 2 - 15,
        (this.cameras.main.width / 2) * value,
        30
      );
    });

    this.load.on('complete', () => {
      console.log('✅ 에셋 로딩 완료');
    });
  }

  create() {
    console.log('🎮 BootScene: 초기화 완료');

    // 로그인 씬으로 전환
    this.time.delayedCall(500, () => {
      this.scene.start('LoginScene');
    });
  }

  createLoadingBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d3561);

    // 타이틀
    const title = this.add.text(width / 2, height / 2 - 100, '🦁 사자의 역습', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    // 서브타이틀
    const subtitle = this.add.text(width / 2, height / 2 - 50, '사자성어 학습 게임', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#a5b4fc'
    });
    subtitle.setOrigin(0.5);

    // 로딩 바 배경
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x222222, 0.8);
    this.progressBarBg.fillRect(
      width / 4,
      height / 2 - 15,
      width / 2,
      30
    );

    // 로딩 바
    this.progressBar = this.add.graphics();
  }
}
