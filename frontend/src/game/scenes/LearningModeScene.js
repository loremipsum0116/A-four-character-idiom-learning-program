import Phaser from 'phaser';

/**
 * LearningModeScene - 학습 모드
 *
 * FR 3.0: 학습 모드
 * FR 3.2: 빈칸 맞추기
 * FR 3.3: 카드 매칭
 */
export default class LearningModeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LearningModeScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d3561);

    // 타이틀
    this.add.text(width / 2, 80, '📚 학습 모드', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // TODO: 학습 모드 구현
    this.add.text(width / 2, height / 2, '학습 모드는 준비 중입니다.\n\n빈칸 맞추기 & 카드 매칭', {
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
