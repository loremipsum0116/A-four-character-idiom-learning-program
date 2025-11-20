import Phaser from 'phaser';

/**
 * PvPScene - 유저 간 대결
 *
 * FR 5.5: 유저 간 대결 (PvP)
 */
export default class PvPScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PvPScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d3561);

    // 타이틀
    this.add.text(width / 2, 80, '⚔️ PvP 대전', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // TODO: PvP 모드 구현
    this.add.text(width / 2, height / 2, 'PvP 모드는 준비 중입니다.\n\n실시간 또는 비동기 대전', {
      fontSize: '24px',
      color: '#94a3b8',
      align: 'center'
    }).setOrigin(0.5);

    // 뒤로 가기
    const backBtn = this.add.text(20, 20, '← 뒤로', {
      fontSize: '20px',
      color: '#94a3b8'
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'))
      .on('pointerover', () => backBtn.setColor('#ffffff'))
      .on('pointerout', () => backBtn.setColor('#94a3b8'));
  }
}
