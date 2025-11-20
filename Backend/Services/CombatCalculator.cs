using IdiomLearningAPI.Models;

namespace IdiomLearningAPI.Services
{
    /// <summary>
    /// FR 7.0: 핵심 로직 - 전투 연산부 (특허 핵심)
    /// 학습 성과 데이터를 기반으로 데미지를 연산
    /// </summary>
    public class CombatCalculator
    {
        // FR 7.1: 난이도별 기본 데미지
        private static readonly Dictionary<Difficulty, int> BaseDamage = new()
        {
            { Difficulty.EASY, 10 },
            { Difficulty.MEDIUM, 20 },
            { Difficulty.HARD, 30 }
        };

        // FR 7.2: 난이도별 제한 시간 (밀리초)
        private static readonly Dictionary<Difficulty, int> TimeLimit = new()
        {
            { Difficulty.EASY, 15000 },   // 15초
            { Difficulty.MEDIUM, 10000 }, // 10초
            { Difficulty.HARD, 5000 }     // 5초
        };

        /// <summary>
        /// FR 7.1: 공격 데미지 계산 공식
        /// Final_Damage = f(난이도, 정확도, 응답속도)
        /// </summary>
        /// <param name="difficulty">난이도 (EASY, MEDIUM, HARD)</param>
        /// <param name="isCorrect">정답 여부</param>
        /// <param name="responseTimeMs">응답 시간 (밀리초)</param>
        /// <returns>최종 데미지</returns>
        public static int CalculateAttackDamage(Difficulty difficulty, bool isCorrect, int responseTimeMs)
        {
            // 기본 데미지 (난이도에 따라 차등)
            int baseDamage = BaseDamage[difficulty];

            // 정확도: 정답일 때만 데미지 적용
            double accuracy = isCorrect ? 1.0 : 0.0;

            // 응답 속도에 따른 보너스 데미지 계산
            int bonusDamage = CalculateBonusDamage(difficulty, responseTimeMs);

            // 최종 데미지 = 기본 데미지 * 정확도 + 보너스 데미지
            int finalDamage = (int)(baseDamage * accuracy) + bonusDamage;

            return finalDamage;
        }

        /// <summary>
        /// 응답 속도에 따른 보너스 데미지 계산
        /// 빠를수록 더 많은 보너스 (0~10 사이)
        /// </summary>
        /// <param name="difficulty">난이도</param>
        /// <param name="responseTimeMs">응답 시간 (밀리초)</param>
        /// <returns>보너스 데미지</returns>
        private static int CalculateBonusDamage(Difficulty difficulty, int responseTimeMs)
        {
            int timeLimit = TimeLimit[difficulty];

            // 제한 시간을 초과한 경우 보너스 없음
            if (responseTimeMs >= timeLimit)
            {
                return 0;
            }

            // 응답 시간 비율 (0.0 ~ 1.0)
            double timeRatio = (double)responseTimeMs / timeLimit;

            // 보너스는 빠를수록 높음 (역비례)
            // 최대 10의 보너스 데미지
            double bonus = (1 - timeRatio) * 10;

            return (int)Math.Floor(bonus);
        }

        /// <summary>
        /// FR 7.3: 방어 데미지 계산 공식
        /// Damage_Taken = Base_Boss_Damage * f(방어성공여부)
        /// </summary>
        /// <param name="baseBossDamage">보스의 기본 공격력</param>
        /// <param name="defenseSuccess">방어 성공 여부</param>
        /// <returns>사용자가 받는 최종 데미지</returns>
        public static int CalculateDefenseDamage(int baseBossDamage, bool defenseSuccess)
        {
            // 방어 성공 시 데미지 감소 (30%만 받음)
            double defenseMultiplier = defenseSuccess ? 0.3 : 1.0;

            int finalDamage = (int)Math.Floor(baseBossDamage * defenseMultiplier);

            return finalDamage;
        }

        /// <summary>
        /// 난이도에 따른 제한 시간 반환
        /// </summary>
        public static int GetTimeLimit(Difficulty difficulty)
        {
            return TimeLimit[difficulty];
        }

        /// <summary>
        /// 난이도에 따른 기본 데미지 반환
        /// </summary>
        public static int GetBaseDamage(Difficulty difficulty)
        {
            return BaseDamage[difficulty];
        }
    }
}
