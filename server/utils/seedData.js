const mongoose = require('mongoose');
const Idiom = require('../models/Idiom');
const GameStage = require('../models/GameStage');
const fs = require('fs');
const path = require('path');

/**
 * 데이터베이스 초기화 스크립트
 */

// 12지신 스테이지 데이터
const gameStages = [
  {
    stage_id: 1,
    boss_name: '자(子) - 쥐신',
    zodiac_animal: '쥐',
    boss_hp: 100,
    boss_attack_power: 10,
    description: '영리하고 빠른 쥐의 신. 첫 번째 도전자를 기다린다.',
  },
  {
    stage_id: 2,
    boss_name: '축(丑) - 소신',
    zodiac_animal: '소',
    boss_hp: 150,
    boss_attack_power: 12,
    description: '강인하고 끈기 있는 소의 신. 묵묵히 자신의 자리를 지킨다.',
  },
  {
    stage_id: 3,
    boss_name: '인(寅) - 호랑이신',
    zodiac_animal: '호랑이',
    boss_hp: 200,
    boss_attack_power: 15,
    description: '용맹하고 위엄 있는 호랑이의 신. 강력한 포효가 들린다.',
  },
  {
    stage_id: 4,
    boss_name: '묘(卯) - 토끼신',
    zodiac_animal: '토끼',
    boss_hp: 180,
    boss_attack_power: 13,
    description: '민첩하고 영리한 토끼의 신. 재빠른 움직임으로 공격을 피한다.',
  },
  {
    stage_id: 5,
    boss_name: '진(辰) - 용신',
    zodiac_animal: '용',
    boss_hp: 300,
    boss_attack_power: 20,
    description: '신성하고 강대한 용의 신. 하늘을 지배하는 존재.',
  },
  {
    stage_id: 6,
    boss_name: '사(巳) - 뱀신',
    zodiac_animal: '뱀',
    boss_hp: 220,
    boss_attack_power: 16,
    description: '지혜롭고 신중한 뱀의 신. 예측 불가능한 공격 패턴을 가진다.',
  },
  {
    stage_id: 7,
    boss_name: '오(午) - 말신',
    zodiac_animal: '말',
    boss_hp: 250,
    boss_attack_power: 18,
    description: '자유롭고 역동적인 말의 신. 빠른 속도로 전장을 누빈다.',
  },
  {
    stage_id: 8,
    boss_name: '미(未) - 양신',
    zodiac_animal: '양',
    boss_hp: 200,
    boss_attack_power: 14,
    description: '온화하지만 완고한 양의 신. 집단의 힘을 이용한다.',
  },
  {
    stage_id: 9,
    boss_name: '신(申) - 원숭이신',
    zodiac_animal: '원숭이',
    boss_hp: 240,
    boss_attack_power: 17,
    description: '재치 있고 장난기 많은 원숭이의 신. 트릭을 사용한다.',
  },
  {
    stage_id: 10,
    boss_name: '유(酉) - 닭신',
    zodiac_animal: '닭',
    boss_hp: 230,
    boss_attack_power: 16,
    description: '근면하고 정확한 닭의 신. 새벽을 알리는 자.',
  },
  {
    stage_id: 11,
    boss_name: '술(戌) - 개신',
    zodiac_animal: '개',
    boss_hp: 260,
    boss_attack_power: 19,
    description: '충성스럽고 용감한 개의 신. 주인을 지키는 수호자.',
  },
  {
    stage_id: 12,
    boss_name: '해(亥) - 돼지신',
    zodiac_animal: '돼지',
    boss_hp: 350,
    boss_attack_power: 22,
    description: '풍요롭고 관대한 돼지의 신. 최후의 수호자이자 가장 강력한 적.',
  },
];

/**
 * 사자성어 데이터 로드 및 저장
 */
async function seedIdioms() {
  try {
    // 기존 데이터 삭제
    await Idiom.deleteMany({});

    // idioms.json 파일 로드
    const idiomsPath = path.join(__dirname, '../../idioms.json');
    const idiomsData = JSON.parse(fs.readFileSync(idiomsPath, 'utf-8'));

    // 데이터 삽입
    await Idiom.insertMany(idiomsData.idioms);

    console.log(`✅ ${idiomsData.idioms.length}개의 사자성어 데이터가 추가되었습니다.`);
  } catch (error) {
    console.error('❌ 사자성어 데이터 추가 실패:', error);
    throw error;
  }
}

/**
 * 게임 스테이지 데이터 저장
 */
async function seedGameStages() {
  try {
    // 기존 데이터 삭제
    await GameStage.deleteMany({});

    // 데이터 삽입
    await GameStage.insertMany(gameStages);

    console.log(`✅ ${gameStages.length}개의 게임 스테이지가 추가되었습니다.`);
  } catch (error) {
    console.error('❌ 게임 스테이지 추가 실패:', error);
    throw error;
  }
}

/**
 * 전체 데이터 초기화
 */
async function seedAll() {
  try {
    console.log('🌱 데이터베이스 초기화 시작...');

    await seedIdioms();
    await seedGameStages();

    console.log('✅ 모든 데이터 초기화 완료!');
  } catch (error) {
    console.error('❌ 데이터 초기화 실패:', error);
    throw error;
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/idiom-learning';

  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(async () => {
      console.log('✅ MongoDB 연결 성공');
      await seedAll();
      await mongoose.disconnect();
      console.log('✅ MongoDB 연결 종료');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ MongoDB 연결 실패:', err);
      process.exit(1);
    });
}

module.exports = {
  seedIdioms,
  seedGameStages,
  seedAll,
};
