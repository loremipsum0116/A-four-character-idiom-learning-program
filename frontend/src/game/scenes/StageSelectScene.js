import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../../utils/constants.js';
import { getLionLevel } from '../../utils/damageCalculator.js';
import { loadGameData } from '../../utils/storageManager.js';

/**
 * StageSelectScene - 스테이지 선택
 *
 * FR 4.1: 12지신 스테이지 맵
 */
export default class StageSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StageSelectScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d3561);

    // 타이틀
    this.add.text(width / 2, 60, '⚔️ 스테이지 선택', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 110, '12지신을 차례대로 물리치세요!', {
      fontSize: '20px',
      color: '#a5b4fc'
    }).setOrigin(0.5);

    // 사자 능력치 패널 (왼쪽 상단)
    this.createLionStatusPanel();

    // 스테이지 버튼들 생성
    this.createStageButtons();

    // 뒤로 가기 버튼
    this.createBackButton();
  }

  createLionStatusPanel() {
    const panelX = 30;
    const panelY = 160;
    const panelWidth = 280;
    const panelHeight = 200;

    // 현재 클리어한 스테이지 기준으로 사자 레벨 계산
    const maxClearedStage = this.getMaxClearedStage();
    const currentStage = maxClearedStage + 1; // 다음 도전할 스테이지
    const lionLevel = getLionLevel(currentStage);

    // 능력치 계산
    const baseHP = GAME_CONSTANTS.BATTLE.PLAYER_MAX_HP;
    const maxHP = baseHP + lionLevel.hpBonus;
    const attackBonus = lionLevel.attackBonus;
    const damageBonus = lionLevel.damageBonus || 0;

    // 패널 배경
    const panel = this.add.rectangle(panelX + panelWidth / 2, panelY + panelHeight / 2,
      panelWidth, panelHeight, 0x1e293b, 0.95);
    panel.setStrokeStyle(3, 0xfbbf24);

    // 타이틀
    this.add.text(panelX + panelWidth / 2, panelY + 20, '🦁 사자 능력치', {
      fontSize: '22px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 레벨 (이름)
    this.add.text(panelX + 20, panelY + 55, `레벨: ${lionLevel.name}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    });

    // 지위 (설명)
    this.add.text(panelX + 20, panelY + 80, lionLevel.description, {
      fontSize: '14px',
      color: '#a5b4fc',
      wordWrap: { width: panelWidth - 40 }
    });

    // 체력
    this.add.text(panelX + 20, panelY + 115, `❤️ 체력: ${maxHP} HP`, {
      fontSize: '16px',
      color: '#ef4444'
    });

    // 공격력 보너스
    let attackText = `⚔️ 공격력: +${attackBonus}%`;
    if (damageBonus > 0) {
      attackText += ` (+${damageBonus} 고정)`;
    }
    this.add.text(panelX + 20, panelY + 140, attackText, {
      fontSize: '16px',
      color: '#10b981'
    });

    // 진행도
    this.add.text(panelX + 20, panelY + 165, `📊 클리어: ${maxClearedStage}/12`, {
      fontSize: '16px',
      color: '#60a5fa'
    });
  }

  createStageButtons() {
    const stages = GAME_CONSTANTS.STAGES;
    const cols = 4; // 4열
    const rows = 3; // 3행
    const buttonSize = 120;
    const gap = 40;
    const startX = (this.cameras.main.width - (cols * (buttonSize + gap))) / 2 + buttonSize / 2;
    const startY = 180;

    // 클리어한 최고 스테이지 확인
    const maxClearedStage = this.getMaxClearedStage();

    stages.forEach((stage, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (buttonSize + gap);
      const y = startY + row * (buttonSize + gap);

      // 스테이지 잠금 여부 확인 (첫 스테이지는 항상 열림)
      const isLocked = stage.id > 1 && stage.id > (maxClearedStage + 1);
      const isCleared = stage.id <= maxClearedStage;

      // 스테이지 버튼
      const buttonColor = isLocked ? 0x1e1e1e : 0x1e293b;
      const strokeColor = isLocked ? 0x4b5563 : (isCleared ? 0x10b981 : 0x667eea);

      const button = this.add.rectangle(x, y, buttonSize, buttonSize, buttonColor, 0.9)
        .setStrokeStyle(3, strokeColor);

      if (!isLocked) {
        button.setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.selectStage(stage))
          .on('pointerover', () => {
            button.setFillStyle(0x334155);
            button.setStrokeStyle(4, isCleared ? 0x34d399 : 0x818cf8);
          })
          .on('pointerout', () => {
            button.setFillStyle(buttonColor);
            button.setStrokeStyle(3, strokeColor);
          });
      }

      // 이모지 (잠긴 스테이지는 자물쇠 표시)
      const emoji = isLocked ? '🔒' : stage.emoji;
      const emojiColor = isLocked ? 0x6b7280 : 0xffffff;
      this.add.text(x, y - 20, emoji, {
        fontSize: '48px'
      }).setOrigin(0.5).setTint(emojiColor);

      // 스테이지 번호 + 이름
      const textColor = isLocked ? '#6b7280' : '#ffffff';
      this.add.text(x, y + 25, `${stage.id}. ${stage.name}`, {
        fontSize: '18px',
        color: textColor,
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // HP 표시 (잠긴 스테이지는 표시 안 함)
      if (!isLocked) {
        this.add.text(x, y + 45, `HP ${stage.bossHp}`, {
          fontSize: '14px',
          color: '#ef4444'
        }).setOrigin(0.5);
      }

      // 클리어 마크
      if (isCleared) {
        this.add.text(x + 45, y - 45, '✓', {
          fontSize: '28px',
          color: '#10b981',
          fontStyle: 'bold'
        }).setOrigin(0.5);
      }
    });
  }

  // 스토리지에서 클리어한 최고 스테이지 가져오기
  // 게스트: sessionStorage, 일반: localStorage
  getMaxClearedStage() {
    const cleared = loadGameData('maxClearedStage', '0');
    return parseInt(cleared, 10);
  }

  selectStage(stage) {
    console.log(`🎯 스테이지 선택:`, stage);

    // BattleScene으로 이동
    this.scene.start('BattleScene', { stage });
  }

  createBackButton() {
    const backBtn = this.add.text(20, 20, '← 뒤로', {
      fontSize: '20px',
      color: '#94a3b8'
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'))
      .on('pointerover', () => backBtn.setColor('#ffffff'))
      .on('pointerout', () => backBtn.setColor('#94a3b8'));
  }
}
