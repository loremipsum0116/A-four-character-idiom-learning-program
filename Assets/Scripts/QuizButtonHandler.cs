using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using UnityEngine.SceneManagement;

public class QuizButtonHandler : MonoBehaviour
{
    [Header("HP Settings")]
    public float MaxHP = 10f;               // 최대 HP
    private float HP;                       // 현재 HP
    public Image HPGauge;                   // HP 게이지 이미지
    public float damageOnCorrect = 1f;      // 정답 선택 시 HP 감소량

    [Header("UI Panels")]
    public GameObject EntirePanel;          // 전체 패널
    public GameObject LevelSelectPanel;     // 단계 선택 패널
    public GameObject QuizPanel;            // 퀴즈 패널 (QuestionPanel 포함)
    public GameObject QuestionPanel;        // 퀴즈 질문 영역 (QuizPanel 하위)

    [Header("Quiz Settings")]
    public Text QuestionText;
    public Button[] OptionButtons;
    public List<QuestionAnswer> QnA;

    [Header("Level Select Buttons")]
    public Button[] LevelButtons;           // 단계 선택 버튼 3개

    [Header("Result Display")]
    public Text ResultText;

    private int currentQuestion;
    private float HPMaxWidth;

    void Start()
    {
        HP = MaxHP;
        if (HPGauge != null)
            HPMaxWidth = HPGauge.rectTransform.sizeDelta.x;

        // EntirePanel 항상 활성
        if (EntirePanel != null)
            EntirePanel.SetActive(true);

        // 초기 상태: LevelSelectPanel 활성, QuizPanel 비활성
        if (LevelSelectPanel != null)
            LevelSelectPanel.SetActive(true);
        if (QuizPanel != null)
            QuizPanel.SetActive(false);

        // 단계 선택 버튼 이벤트 연결
        for (int i = 0; i < LevelButtons.Length; i++)
        {
            int index = i;
            LevelButtons[i].onClick.AddListener(() => OnLevelSelected(index));
        }

        // 퀴즈 옵션 버튼 이벤트 연결
        for (int i = 0; i < OptionButtons.Length; i++)
        {
            int index = i;
            OptionButtons[i].onClick.AddListener(() => OnOptionClicked(index));
        }
    }

    // 단계 선택 버튼 클릭 시
    void OnLevelSelected(int levelIndex)
    {
        // LevelSelectPanel 숨기고 QuizPanel 활성화
        if (LevelSelectPanel != null)
            LevelSelectPanel.SetActive(false);
        if (QuizPanel != null)
            QuizPanel.SetActive(true);

        // 필요 시 levelIndex로 난이도 조정 가능
        MakeQuestion();
    }

    void MakeQuestion()
    {
        if (QnA.Count == 0)
        {
            GameOver();
            return;
        }

        currentQuestion = Random.Range(0, QnA.Count);

        if (QuestionText != null)
            QuestionText.text = QnA[currentQuestion].Question;

        for (int i = 0; i < OptionButtons.Length; i++)
        {
            if (OptionButtons[i] != null)
            {
                Text btnText = OptionButtons[i].GetComponentInChildren<Text>();
                if (btnText != null && i < QnA[currentQuestion].Answer.Length)
                    btnText.text = QnA[currentQuestion].Answer[i];
            }
        }

        if (ResultText != null)
            ResultText.text = "";
    }

    void OnOptionClicked(int index)
    {
        if (QnA.Count == 0) return;

        if (QnA[currentQuestion].CorrectAnswer == index + 1)
            Correct();
        else
            Wrong();
    }

    void Correct()
    {
        // HP 감소
        HP -= damageOnCorrect;
        HP = Mathf.Clamp(HP, 0f, MaxHP);
        UpdateHPGauge();

        if (ResultText != null)
            ResultText.text = "정답!";

        // 퀴즈 완료 후 QuizPanel 종료
        if (QuizPanel != null)
            QuizPanel.SetActive(false);

        if (EntirePanel != null)
            EntirePanel.SetActive(false);
    }

    void Wrong()
    {
        if (ResultText != null)
            ResultText.text = "오답!";
    }

    void UpdateHPGauge()
    {
        if (HPGauge != null)
        {
            float width = (HP / MaxHP) * HPMaxWidth;
            width = Mathf.Clamp(width, 0f, HPMaxWidth);

            Vector2 size = HPGauge.rectTransform.sizeDelta;
            size.x = width;
            HPGauge.rectTransform.sizeDelta = size;
        }
    }

    void GameOver()
    {
        if (QuizPanel != null)
            QuizPanel.SetActive(false);

        if (EntirePanel != null)
            EntirePanel.SetActive(false);

        if (ResultText != null)
            ResultText.text = "게임 오버!";
    }
}
