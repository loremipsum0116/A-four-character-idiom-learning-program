import Phaser from 'phaser';

/**
 * IntroScene - 게임 스토리 인트로
 * 로그인 후 메인 메뉴 전에 스토리를 보여줌
 */
export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  init(data) {
    this.userData = data.user;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경 (어두운 분위기)
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

    // 스토리 텍스트
    const storyText = `사자는 본래 압도적 힘과 고귀한 덕목을 갖춘 존재로서
12지신의 정점에 있었다.

그러나 그의 권위를 의심하고 시기하던 호랑이가 기습을 감행해
사자의 지위를 탈취했다.

호랑이는 이 과정에서 사자가 지녔던 '자력(字力, 한자에서 유래한
신비한 마력)'까지 완전히 흡수했고, 사자는 모든 힘과 지식을
잃은 채 추방되었다.

이제 사자는 잃어버린 자력과 그 비밀을 되찾기 위해
험난한 여정을 다시 시작한다.`;

    // 타이틀
    this.add.text(width / 2, 80, '🦁 사자의 역습', {
      fontSize: '48px',
      color: '#fbbf24',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 스토리 본문
    const storyDisplay = this.add.text(width / 2, height / 2 - 20, '', {
      fontSize: '22px',
      color: '#e5e7eb',
      lineSpacing: 12,
      align: 'center',
      wordWrap: { width: width - 200 }
    }).setOrigin(0.5);

    // 타이핑 효과로 스토리 표시
    this.typeText(storyDisplay, storyText, 30);

    // 다음 버튼 (처음에는 숨김)
    const nextButton = this.add.text(width / 2, height - 80, '다음 →', {
      fontSize: '28px',
      color: '#fbbf24',
      fontStyle: 'bold',
      backgroundColor: '#1e293b',
      padding: { x: 30, y: 15 }
    }).setOrigin(0.5)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goToMainMenu())
      .on('pointerover', () => nextButton.setColor('#ffffff'))
      .on('pointerout', () => nextButton.setColor('#fbbf24'));

    // 스페이스바/엔터로 언제든지 넘어가기 (스킵 기능)
    this.input.keyboard.on('keydown-SPACE', () => this.goToMainMenu());
    this.input.keyboard.on('keydown-ENTER', () => this.goToMainMenu());

    // 타이핑 완료 후 다음 버튼 표시
    this.time.delayedCall(storyText.length * 30 + 1000, () => {
      this.tweens.add({
        targets: nextButton,
        alpha: 1,
        duration: 500,
        ease: 'Power2'
      });
    });

    // 안내 텍스트
    this.guideText = this.add.text(width / 2, height - 30, 'SPACE 키를 눌러 건너뛰기', {
      fontSize: '16px',
      color: '#64748b'
    }).setOrigin(0.5, 1);
  }

  /**
   * 타이핑 효과
   */
  typeText(textObject, fullText, speed) {
    let currentIndex = 0;
    const chars = fullText.split('');

    const timer = this.time.addEvent({
      delay: speed,
      callback: () => {
        if (currentIndex < chars.length) {
          textObject.text += chars[currentIndex];
          currentIndex++;
        } else {
          timer.remove();
        }
      },
      loop: true
    });

    this.typingTimer = timer;
  }

  /**
   * 메인 메뉴로 이동
   */
  goToMainMenu() {
    // 타이핑 타이머 정리
    if (this.typingTimer) {
      this.typingTimer.remove();
    }

    // 페이드아웃
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenuScene', { user: this.userData });
    });
  }

  shutdown() {
    // 키보드 이벤트 정리
    this.input.keyboard.off('keydown-SPACE');
    this.input.keyboard.off('keydown-ENTER');
  }
}
