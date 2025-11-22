// src/scenes/HiddenBossScene.js
import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../../utils/constants.js';

export default class HiddenBossScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HiddenBossScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 배경
        this.add.rectangle(width / 2, height / 2, width, height, 0x020617);

        // 타이틀
        this.add.text(width / 2, 120, '🕶️ 히든 보스전', {
            fontSize: '40px',
            color: '#fbbf24',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 190,
            '12지신을 모두 쓰러뜨린 자만이\n도전할 수 있는 비밀 전투입니다.', {
            fontSize: '20px',
            color: '#e5e7eb',
            align: 'center'
        }).setOrigin(0.5);

        // 히든 보스 데이터 (constants에 따로 추가해도 되고, 여기 하드코딩해도 됨)
        const hiddenBoss = {
            id: 99,
            name: '히든 수호자',
            emoji: '🕶️',
            bossHp: 800,
            bossAttack: 40,
            image: '/pictures/hidden-boss.png',
            description: '사자왕의 앞을 마지막으로 가로막는 그림자'
        };

        this.add.text(width / 2, 260,
            `${hiddenBoss.emoji} ${hiddenBoss.name}\nHP ${hiddenBoss.bossHp} / ATK ${hiddenBoss.bossAttack}`, {
            fontSize: '22px',
            color: '#93c5fd',
            align: 'center'
        }).setOrigin(0.5);

        // 시작 버튼
        const startBtn = this.add.text(width / 2, height - 140, '⚔️ 히든 보스와 싸우기', {
            fontSize: '26px',
            color: '#e5e7eb',
            fontStyle: 'bold'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => startBtn.setColor('#facc15'))
            .on('pointerout', () => startBtn.setColor('#e5e7eb'))
            .on('pointerdown', () => {
                // BattleScene으로 히든 보스 스테이지 전달
                this.scene.start('BattleScene', { stage: hiddenBoss });
            });

        // 돌아가기 버튼
        const backBtn = this.add.text(width / 2, height - 80, '← 메인 메뉴로', {
            fontSize: '20px',
            color: '#9ca3af'
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backBtn.setColor('#e5e7eb'))
            .on('pointerout', () => backBtn.setColor('#9ca3af'))
            .on('pointerdown', () => {
                this.scene.start('MainMenuScene');
            });
    }
}
