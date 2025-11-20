using System.Collections;
using UnityEngine;
using IdiomLearning.Models;
using IdiomLearning.API;

namespace IdiomLearning.Game
{
    /// <summary>
    /// FR 4.0: 턴제 전투 관리
    /// 게임의 핵심 전투 로직을 관리하는 매니저
    /// </summary>
    public class BattleManager : MonoBehaviour
    {
        public static BattleManager Instance { get; private set; }

        [Header("Battle State")]
        public GameStage currentStage;
        public int playerHp = 100;
        public int bossHp;
        public bool isPlayerTurn = true;

        [Header("Quiz State")]
        public BlankQuiz currentQuiz;
        public Difficulty selectedDifficulty = Difficulty.EASY;
        private float questionStartTime;

        [Header("Events")]
        public System.Action<int> OnPlayerHpChanged;
        public System.Action<int> OnBossHpChanged;
        public System.Action<string> OnMessageReceived;
        public System.Action OnBattleWon;
        public System.Action OnBattleLost;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }
            else
            {
                Destroy(gameObject);
            }
        }

        /// <summary>
        /// FR 4.2: 전투 시작
        /// </summary>
        public void StartBattle(GameStage stage)
        {
            currentStage = stage;
            playerHp = 100;
            bossHp = stage.boss_hp;
            isPlayerTurn = true;

            OnPlayerHpChanged?.Invoke(playerHp);
            OnBossHpChanged?.Invoke(bossHp);

            Debug.Log($"Battle started against {stage.boss_name}");
        }

        /// <summary>
        /// FR 4.3: 난이도 선택
        /// </summary>
        public void SelectDifficulty(Difficulty difficulty)
        {
            selectedDifficulty = difficulty;
            Debug.Log($"Difficulty selected: {difficulty}");

            // 난이도 선택 후 문제 로드
            StartCoroutine(LoadQuizForAttack());
        }

        /// <summary>
        /// FR 4.4: 공격용 퀴즈 로드
        /// </summary>
        private IEnumerator LoadQuizForAttack()
        {
            string difficultyStr = selectedDifficulty.ToString();

            yield return APIClient.Instance.GetBlankQuiz(
                difficultyStr,
                (quiz) =>
                {
                    currentQuiz = quiz;
                    questionStartTime = Time.time;
                    Debug.Log($"Quiz loaded: {quiz.question}");
                },
                (error) =>
                {
                    Debug.LogError($"Failed to load quiz: {error}");
                    OnMessageReceived?.Invoke("문제를 불러오지 못했습니다.");
                }
            );
        }

        /// <summary>
        /// FR 4.6: 공격 처리 (사용자가 답을 선택했을 때)
        /// </summary>
        public void SubmitAttack(string selectedAnswer)
        {
            if (currentQuiz == null) return;

            bool isCorrect = selectedAnswer == currentQuiz.correctAnswer;
            int responseTime = Mathf.RoundToInt((Time.time - questionStartTime) * 1000); // ms

            var attackRequest = new AttackRequest
            {
                stageId = currentStage.stage_id,
                idiomId = currentQuiz.idiom_id,
                difficulty = (int)selectedDifficulty,
                isCorrect = isCorrect,
                responseTimeMs = responseTime
            };

            StartCoroutine(ProcessAttackRequest(attackRequest));
        }

        private IEnumerator ProcessAttackRequest(AttackRequest request)
        {
            yield return APIClient.Instance.ProcessAttack(
                request,
                (response) =>
                {
                    // 보스 HP 감소
                    bossHp -= response.damage;
                    OnBossHpChanged?.Invoke(bossHp);
                    OnMessageReceived?.Invoke($"{response.message} 데미지: {response.damage}");

                    Debug.Log($"Attack result: {response.damage} damage");

                    // 승리 체크
                    if (bossHp <= 0)
                    {
                        OnBattleWon?.Invoke();
                    }
                    else
                    {
                        // 보스 턴 시작
                        StartCoroutine(StartBossTurn());
                    }
                },
                (error) =>
                {
                    Debug.LogError($"Attack failed: {error}");
                    OnMessageReceived?.Invoke("공격 처리 실패");
                }
            );
        }

        /// <summary>
        /// FR 4.7: 보스 턴 시작 (방어 문제)
        /// </summary>
        private IEnumerator StartBossTurn()
        {
            isPlayerTurn = false;
            OnMessageReceived?.Invoke("보스의 공격!");

            yield return new WaitForSeconds(1f);

            // 방어 문제 로드 (EASY 난이도 고정)
            yield return APIClient.Instance.GetBlankQuiz(
                "EASY",
                (quiz) =>
                {
                    currentQuiz = quiz;
                    questionStartTime = Time.time;
                    OnMessageReceived?.Invoke("방어 문제! 정답을 맞춰 데미지를 줄이세요!");
                },
                (error) =>
                {
                    Debug.LogError($"Failed to load defense quiz: {error}");
                }
            );
        }

        /// <summary>
        /// FR 4.8: 방어 처리
        /// </summary>
        public void SubmitDefense(string selectedAnswer)
        {
            if (currentQuiz == null) return;

            bool defenseSuccess = selectedAnswer == currentQuiz.correctAnswer;
            int responseTime = Mathf.RoundToInt((Time.time - questionStartTime) * 1000);

            var defenseRequest = new DefenseRequest
            {
                stageId = currentStage.stage_id,
                idiomId = currentQuiz.idiom_id,
                defenseSuccess = defenseSuccess,
                responseTimeMs = responseTime,
                bossDamage = currentStage.boss_attack_power
            };

            StartCoroutine(ProcessDefenseRequest(defenseRequest));
        }

        private IEnumerator ProcessDefenseRequest(DefenseRequest request)
        {
            yield return APIClient.Instance.ProcessDefense(
                request,
                (response) =>
                {
                    // 플레이어 HP 감소
                    playerHp -= response.damageTaken;
                    OnPlayerHpChanged?.Invoke(playerHp);
                    OnMessageReceived?.Invoke($"{response.message} 받은 데미지: {response.damageTaken}");

                    Debug.Log($"Defense result: {response.damageTaken} damage taken");

                    // 패배 체크
                    if (playerHp <= 0)
                    {
                        OnBattleLost?.Invoke();
                    }
                    else
                    {
                        // 다시 플레이어 턴
                        isPlayerTurn = true;
                        OnMessageReceived?.Invoke("공격 턴! 난이도를 선택하세요");
                    }
                },
                (error) =>
                {
                    Debug.LogError($"Defense failed: {error}");
                }
            );
        }

        /// <summary>
        /// 현재 퀴즈 반환
        /// </summary>
        public BlankQuiz GetCurrentQuiz()
        {
            return currentQuiz;
        }

        /// <summary>
        /// 현재 턴 확인
        /// </summary>
        public bool IsPlayerTurn()
        {
            return isPlayerTurn;
        }
    }
}
