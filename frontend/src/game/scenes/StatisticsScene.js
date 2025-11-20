import Phaser from 'phaser';

/**
 * StatisticsScene - 통계
 *
 * FR 6.0: 개인 기록 (통계 시스템)
 * FR 6.3: 통계 시각화
 */
export default class StatisticsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatisticsScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d3561);

    // 타이틀
    this.add.text(width / 2, 80, '📊 개인 기록', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // TODO: Chart.js 통계 그래프
    this.add.text(width / 2, height / 2, '통계 시스템은 준비 중입니다.\n\n학습 데이터 시각화 (Chart.js)', {
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
