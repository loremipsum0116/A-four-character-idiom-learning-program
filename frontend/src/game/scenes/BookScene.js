import Phaser from "phaser";
import { idioms } from '../../data/idioms.js'; 

const WIDTH = 1280;
const HEIGHT = 720;
const MAX_IDIOMS = 30; 

export default class BookScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BookScene' });
        this.currentIdiomIndex = 0;
        this.filteredIdioms = [];
        this.difficultyLabel = {
            EASY: '초급',
            MEDIUM: '중급',
            HARD: '고급',
        };
    }

    init(data) {
        this.difficulty = data.difficulty || 'EASY'; 
        this.displayDifficulty = this.difficultyLabel[this.difficulty] || '초급';
    }

    create() {
        
        let filteredPool = idioms.filter(item => item.difficulty === this.difficulty);

        this.filteredIdioms = filteredPool.slice(0, MAX_IDIOMS);
        
        // --- 데이터 검증 및 초기 설정 ---

        if (this.filteredIdioms.length === 0) {
            this.add.text(WIDTH / 2, HEIGHT / 2, `선택한 난이도(${this.displayDifficulty})에 해당하는 단어가 없습니다.`, { fontSize: '30px', color: '#ff4444' }).setOrigin(0.5);
            this.createBackButton();
            return;
        }

        if (this.filteredIdioms.length < MAX_IDIOMS) {
            this.add.text(WIDTH / 2, HEIGHT - 50, `🚨 ${this.displayDifficulty} 단어가 ${this.filteredIdioms.length}개만 로드되었습니다.`, { fontSize: '20px', color: '#ffdd00' }).setOrigin(0.5);
        }

        this.currentIdiomIndex = 0;

        this.createBackground();
        this.createTitle();
        this.createCardUI(); 
        this.createNavButtons(); 
        this.updateCard(); 
        this.createBackButton();
    }

    createBackground() {
        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x2d3561);
    }

    createTitle() {
        this.add.text(WIDTH / 2, 80, `📚 ${this.displayDifficulty} 사자성어 단어장`, {
            fontSize: '40px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    createCardUI() {
        const centerX = WIDTH / 2;
        
        //너비 변수 설정
        const boxWidth = 800;          //하단 박스
        const topBoxWidth = 500;       //상단 박스
        
        const idiomBoxHeight = 150;    //사자성어 박스 높이
        const meaningBoxHeight = 250;  //설명 박스 높이
        const gap = 20;                //박스 사이 간격
        
        // 박스 Y 좌표 계산 (이 부분은 동일하게 유지)
        const idiomBoxY = HEIGHT / 2 - meaningBoxHeight / 2 - gap / 2; // 위쪽 박스 중앙 Y 좌표
        const meaningBoxY = HEIGHT / 2 + idiomBoxHeight / 2 + gap / 2; // 아래쪽 박스 중앙 Y 좌표

        //상단 박스
        this.add.rectangle(centerX, idiomBoxY, topBoxWidth, idiomBoxHeight, 0x4a5591, 0.9).setOrigin(0.5);

        // 사자성어 텍스트
        this.idiomText = this.add.text(centerX, idiomBoxY, '', {
            fontSize: '72px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.rectangle(centerX, meaningBoxY, boxWidth, meaningBoxHeight, 0x3d4575, 0.9).setOrigin(0.5);

        const newTopOffset = 50; 
        const textStartY = meaningBoxY - meaningBoxHeight / 2 + newTopOffset;
        const gapBetweenTexts = 60; 

        // 독음 (발음) 텍스트
        this.pronunciationText = this.add.text(centerX, textStartY, '', {
            fontSize: '28px',
            color: '#cccccc'
        }).setOrigin(0.5);

        // 뜻 (설명) 텍스트
        this.meaningText = this.add.text(centerX, textStartY + gapBetweenTexts, '', {
            fontSize: '24px',
            color: '#ffffff',
            // ⭐ 줄바꿈: boxWidth(800) 기반으로 설정하여 하단 박스 너비를 따르게 합니다.
            wordWrap: { width: boxWidth - 50 } 
        }).setOrigin(0.5);
        
        // 인덱스 표시
        this.indexText = this.add.text(WIDTH / 2, HEIGHT - 200, '', {
             fontSize: '20px',
             color: '#ffffff'
        }).setOrigin(0.5);
    }

    // UI 업데이트 함수
    updateCard() {
        if (this.filteredIdioms.length === 0) {
            return;
        }

        const currentData = this.filteredIdioms[this.currentIdiomIndex];

        const hanjaText = currentData.hanja.join('');
        this.idiomText.setText(hanjaText);
        
        //독음
        this.pronunciationText.setText(`[ ${currentData.hangul} ]`);
        
        //뜻
        this.meaningText.setText(currentData.meaning);
        
        this.indexText.setText(`${this.currentIdiomIndex + 1} / ${this.filteredIdioms.length}`);

        this.nextButton.setVisible(this.currentIdiomIndex < this.filteredIdioms.length - 1);
        this.prevButton.setVisible(this.currentIdiomIndex > 0);
    }

    createNavButtons() {
        const buttonStyle = {
            fontSize: '32px',
            color: '#2d3561',
            backgroundColor: '#ffffff',
            padding: { x: 30, y: 15 },
            fontStyle: 'bold'
        };
        const hoverColor = '#ffdd00';
        const defaultColor = '#ffffff';

        const buttonY = HEIGHT - 100;
        const spacing = 200; //버튼 간격

        //이전 단어 버튼 
        this.prevButton = this.add.text(WIDTH / 2 - spacing, buttonY, '◀ 이전 단어', buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (this.currentIdiomIndex > 0) {
                this.currentIdiomIndex--;
                this.updateCard(); 
            }
        })
        .on('pointerover', () => this.prevButton.setBackgroundColor(hoverColor))
        .on('pointerout', () => this.prevButton.setBackgroundColor(defaultColor));

        //다음 단어 버튼
        this.nextButton = this.add.text(WIDTH / 2 + spacing, buttonY, '다음 단어 ▶', buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (this.currentIdiomIndex < this.filteredIdioms.length) {
                this.currentIdiomIndex++;
                this.updateCard(); 
            }
        })
        .on('pointerover', () => this.nextButton.setBackgroundColor(hoverColor))
        .on('pointerout', () => this.nextButton.setBackgroundColor(defaultColor));
        
    }

    createBackButton() {
        const backBtn = this.add.text(20, 20, '← 뒤로', {
            fontSize: '20px',
            color: '#94a3b8'
        }).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.scene.start('DifficultySelectScene')) 
          .on('pointerover', () => backBtn.setColor('#ffffff'))
          .on('pointerout', () => backBtn.setColor('#94a3b8'));
    }
}