import Phaser from 'phaser';

/**
 * EndingScene - 엔딩
 *
 * FR 5.1: 엔딩 화면
 * FR 5.2: 엔딩 콘텐츠 잠금 해제
 */
export default class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndingScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d3561);

    // 타이틀
    this.add.text(width / 2, 150, '👑 사자 왕이 되다!', {
      fontSize: '56px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 250, '12지신을 모두 물리쳤습니다!', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 엔딩 콘텐츠 잠금 해제 (FR 5.2)
    this.add.text(width / 2, 350, '🎉 엔딩 콘텐츠 잠금 해제!\n\n🐉 히든 보스전\n♾️ 무한 모드\n⚔️ PvP 대전', {
      fontSize: '24px',
      color: '#a5b4fc',
      align: 'center'
    }).setOrigin(0.5);

    // 메인 메뉴 버튼
    const button = this.add.rectangle(width / 2, height - 100, 300, 60, 0x667eea)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'))
      .on('pointerover', () => button.setFillStyle(0x818cf8))
      .on('pointerout', () => button.setFillStyle(0x667eea));

    this.add.text(width / 2, height - 100, '메인 메뉴로', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
}
