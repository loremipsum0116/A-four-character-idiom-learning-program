import Phaser from 'phaser';
import { apiClient } from '../../services/APIClient.js';
import { isGuestMode } from '../../utils/storageManager.js';

/**
 * StatisticsScene - 통계
 *
 * FR 6.0: 개인 기록 (통계 시스템)
 * FR 6.3: 통계 시각화
 */
export default class StatisticsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatisticsScene' });
    this.stats = null;
  }

  async create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d3561);

    // 타이틀
    this.add.text(width / 2, 60, '📊 개인 기록', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 뒤로 가기
    const backBtn = this.add.text(20, 20, '← 뒤로', {
      fontSize: '20px',
      color: '#94a3b8'
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'))
      .on('pointerover', () => backBtn.setColor('#ffffff'))
      .on('pointerout', () => backBtn.setColor('#94a3b8'));

    // 게스트 모드 체크
    if (isGuestMode() || !apiClient.isAuthenticated()) {
      this.showGuestMessage(width, height);
      return;
    }

    // 로딩 메시지
    const loadingText = this.add.text(width / 2, height / 2, '통계를 불러오는 중...', {
      fontSize: '24px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    try {
      // 통계 데이터 로드
      this.stats = await apiClient.getStatistics();
      console.log('📊 통계 데이터:', this.stats);

      loadingText.destroy();
      this.displayStatistics(width, height);
    } catch (error) {
      console.error('❌ 통계 로드 실패:', error);
      loadingText.setText('통계를 불러올 수 없습니다\n\n' + error.message);
      loadingText.setColor('#ef4444');
    }
  }

  showGuestMessage(width, height) {
    this.add.text(width / 2, height / 2 - 50, '🔒 로그인이 필요합니다', {
      fontSize: '32px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, '개인 기록은 로그인한 사용자만 볼 수 있습니다.\n게임을 플레이한 후 통계를 확인하세요!', {
      fontSize: '18px',
      color: '#94a3b8',
      align: 'center'
    }).setOrigin(0.5);

    // 로그인 버튼
    const loginBtn = this.add.rectangle(width / 2, height / 2 + 120, 200, 50, 0x667eea)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        apiClient.logout();
        this.scene.start('LoginScene');
      })
      .on('pointerover', () => loginBtn.setFillStyle(0x818cf8))
      .on('pointerout', () => loginBtn.setFillStyle(0x667eea));

    this.add.text(width / 2, height / 2 + 120, '로그인하기', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  displayStatistics(width, height) {
    const { summary, byDifficulty, dailyStats, recentLogs } = this.stats;

    let yPos = 120;

    // 전체 요약
    this.add.rectangle(width / 2, yPos + 60, width - 80, 120, 0x1e293b, 0.8)
      .setStrokeStyle(2, 0x667eea);

    this.add.text(width / 2, yPos, '📈 전체 통계', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    yPos += 40;

    const summaryText = `총 문제: ${summary.totalQuizzes}개  |  정답: ${summary.correctCount}개  |  정답률: ${summary.accuracy.toFixed(1)}%\n` +
      `공격: ${summary.attackCount}회  |  방어: ${summary.defenseCount}회  |  총 데미지: ${summary.totalDamage}\n` +
      `평균 응답 시간: ${(summary.avgResponseTime / 1000).toFixed(2)}초`;

    this.add.text(width / 2, yPos + 30, summaryText, {
      fontSize: '16px',
      color: '#e2e8f0',
      align: 'center'
    }).setOrigin(0.5);

    yPos += 140;

    // 난이도별 통계
    this.add.text(width / 2, yPos, '🎯 난이도별 정답률', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    yPos += 40;

    const difficulties = [
      { label: 'EASY', data: byDifficulty.easy, color: 0x10b981 },
      { label: 'MEDIUM', data: byDifficulty.medium, color: 0xfbbf24 },
      { label: 'HARD', data: byDifficulty.hard, color: 0xef4444 }
    ];

    difficulties.forEach((diff, index) => {
      const xPos = 150 + (index * 300);

      this.add.rectangle(xPos, yPos + 50, 250, 100, 0x1e293b, 0.8)
        .setStrokeStyle(2, diff.color);

      this.add.text(xPos, yPos + 20, diff.label, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(xPos, yPos + 55, `정답: ${diff.data.correct} / ${diff.data.total}`, {
        fontSize: '16px',
        color: '#e2e8f0'
      }).setOrigin(0.5);

      this.add.text(xPos, yPos + 80, `${diff.data.accuracy.toFixed(1)}%`, {
        fontSize: '24px',
        color: this.getColorFromHex(diff.color),
        fontStyle: 'bold'
      }).setOrigin(0.5);
    });

    yPos += 160;

    // 최근 기록
    if (recentLogs && recentLogs.length > 0) {
      this.add.text(width / 2, yPos, '📜 최근 기록 (최근 10개)', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      yPos += 40;

      this.add.rectangle(width / 2, yPos + 100, width - 80, 220, 0x1e293b, 0.8)
        .setStrokeStyle(2, 0x667eea);

      yPos += 30;

      recentLogs.slice(0, 5).forEach((log, index) => {
        const time = new Date(log.timestamp).toLocaleString('ko-KR', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        const icon = log.isCorrect ? '✅' : '❌';
        const actionIcon = log.actionType === 'ATTACK' ? '⚔️' : '🛡️';

        const logText = `${actionIcon} ${time} | ${log.difficulty || 'N/A'} | ${icon} ${(log.responseTimeMs / 1000).toFixed(1)}초 | 데미지: ${log.damage}`;

        this.add.text(width / 2, yPos + (index * 35), logText, {
          fontSize: '14px',
          color: log.isCorrect ? '#10b981' : '#ef4444',
          align: 'center'
        }).setOrigin(0.5);
      });
    }
  }

  getColorFromHex(hex) {
    const r = (hex >> 16) & 0xFF;
    const g = (hex >> 8) & 0xFF;
    const b = hex & 0xFF;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
