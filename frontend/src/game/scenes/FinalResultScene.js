import Phaser from 'phaser';
import { loadGameData, saveGameData } from '../../utils/storageManager.js';
import { GAME_CONSTANTS } from '../../utils/constants.js';

/**
 * FinalResultScene
 * - 전체 스테이지 클리어 후 최종 결과를 보여주는 씬
 * - 총 정답/오답/시간 + 체력 변화 그래프 출력
 */
export default class FinalResultScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FinalResultScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 배경
        this.add.rectangle(width / 2, height / 2, width, height, 0x020617);

        // 저장된 전투 기록 불러오기
        let raw = loadGameData('battleStats', '[]');
        let stats = [];
        try {
            const parsed = JSON.parse(raw);
            stats = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            stats = [];
        }

        // 기록이 없을 때
        if (stats.length === 0) {
            this.add.text(width / 2, height / 2, '표시할 전투 기록이 없습니다.', {
                fontSize: '24px',
                color: '#e5e7eb'
            }).setOrigin(0.5);
            return;
        }

        // 총합 계산
        const totalCorrect = stats.reduce((sum, s) => sum + (s.correct || 0), 0);
        const totalWrong = stats.reduce((sum, s) => sum + (s.wrong || 0), 0);
        const totalTime = stats.reduce((sum, s) => sum + (s.time || 0), 0);
        const totalStages = stats.length;

        // 타이틀
        this.add.text(width / 2, 60, '🏆 최종 결과', {
            fontSize: '36px',
            color: '#e5e7eb',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 요약 정보
        const summaryLines = [
           
            `총 정답 개수        : ${totalCorrect}`,
            `총 오답 개수        : ${totalWrong}`,
            `총 소요 시간        : ${totalTime.toFixed(1)}초`
        ];

        this.add.text(80, 120, summaryLines.join('\n'), {
            fontSize: '20px',
            color: '#e5e7eb',
            lineSpacing: 6
        });

        // 체력 그래프 표시
        this.drawHpGraph(stats);

        // 버튼: 스테이지 선택 화면으로
        const btn = this.add.text(width / 2, height - 60, '스테이지 선택 화면으로 돌아가기', {
            fontSize: '24px',
            color: '#e5e7eb',
            fontStyle: 'bold'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setColor('#facc15'))
            .on('pointerout', () => btn.setColor('#e5e7eb'))
            .on('pointerdown', () => {
                // 필요하면 여기서 기록 초기화도 가능
                // saveGameData('battleStats', '[]');
                this.scene.start('StageSelectScene');
            });
    }

    /**
     * 체력 변화 그래프 그리기
     */
    drawHpGraph(stats) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const graphWidth = width - 160;
        const graphHeight = 240;
        const originX = 80;
        const originY = height / 2 + 120;

        // 그래프 제목
        this.add.text(width / 2, height / 2 - 10, '❤️ 스테이지별 남은 체력 변화', {
            fontSize: '22px',
            color: '#e5e7eb'
        }).setOrigin(0.5);

        const g = this.add.graphics();

        // 축 그리기
        g.lineStyle(2, 0x475569);

        // Y축
        g.moveTo(originX, originY - graphHeight);
        g.lineTo(originX, originY);

        // X축
        g.moveTo(originX, originY);
        g.lineTo(originX + graphWidth, originY);

        g.strokePath();

        // 최대 체력 구하기
        const maxHp = stats.reduce((max, s) => Math.max(max, s.maxHp || s.endHp || 0), 0) || 1;

        // 데이터 라인
        const line = this.add.graphics();
        line.lineStyle(3, 0x38bdf8);

        stats.forEach((s, index) => {
            const t = stats.length === 1 ? 0 : index / (stats.length - 1);
            const x = originX + t * graphWidth;
            const ratio = (s.endHp || 0) / maxHp;
            const y = originY - ratio * graphHeight;

            if (index === 0) {
                line.moveTo(x, y);
            } else {
                line.lineTo(x, y);
            }

            // 데이터 점
            this.add.circle(x, y, 5, 0x38bdf8);

            // 스테이지 번호 라벨
            this.add.text(x, originY + 15, `스테이지 ${s.stageId}`, {
                fontSize: '14px',
                color: '#94a3b8'
            }).setOrigin(0.5, 0);

            // 체력 텍스트 라벨
            this.add.text(x, y - 10, `${s.endHp}/${s.maxHp}`, {
                fontSize: '12px',
                color: '#e5e7eb'
            }).setOrigin(0.5, 1);
        });

        line.strokePath();

        // Y축 눈금 라벨
        this.add.text(originX - 10, originY - graphHeight, `${maxHp}`, {
            fontSize: '12px',
            color: '#e5e7eb'
        }).setOrigin(1, 0.5);

        this.add.text(originX - 10, originY - graphHeight / 2, `${Math.round(maxHp / 2)}`, {
            fontSize: '12px',
            color: '#e5e7eb'
        }).setOrigin(1, 0.5);

        this.add.text(originX - 10, originY, `0`, {
            fontSize: '12px',
            color: '#e5e7eb'
        }).setOrigin(1, 0.5);
    }
}
