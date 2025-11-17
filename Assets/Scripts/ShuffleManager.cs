using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

public class ShuffleManager : MonoBehaviour
{
    [Header("HP Settings")]
    public float MaxHP = 10f;
    private float HP;
    public Image HPGauge;
    public float damageOnCorrect = 1f;

    [Header("UI Panels")]
    public GameObject EntirePanel;
    public GameObject LevelSelectPanel;
    public GameObject QuizPanel;

    [Header("Answer System")]
    public Text AnswerSheetText;   // 플레이어가 누른 버튼 텍스트 누적 표시
    public Text ResultText;        // 정답/오답 표시
    public Button[] OptionButtons; // 버튼 텍스트는 Inspector에서 직접 설정하거나 아래 initialOptionTexts 사용

    [Header("Level Select Buttons")]
    public Button[] LevelButtons;  // 단계 선택 버튼

    [Header("Quiz Data")]
    public List<QuestionData> QnA; // 정답만 저장하는 구조 (옵션 텍스트는 Inspector에서 설정 가능)
    private int currentQuestion;

    [Header("Inspector button texts (optional)")]
    public string[] initialOptionTexts; // Inspector에서 버튼 텍스트를 직접 설정하려면 여기에 값 입력

    private List<string> selectedAnswers = new List<string>();
    private float HPMaxWidth;

    [System.Serializable]
    public class QuestionData
    {
        public string CorrectAnswer;  // 예: "ABCD", "DACB" 등 4글자 — 버튼에 표시된 텍스트를 이어붙인 형태로 맞춰주세요
        // public string[] Options;    // (사용하지 않음) 버튼 텍스트는 Inspector의 Button > Text 또는 initialOptionTexts로 설정
    }

    void Start()
    {
        HP = MaxHP;
        if (HPGauge != null)
            HPMaxWidth = HPGauge.rectTransform.sizeDelta.x;

        if (EntirePanel != null) EntirePanel.SetActive(true);
        if (LevelSelectPanel != null) LevelSelectPanel.SetActive(true);
        if (QuizPanel != null) QuizPanel.SetActive(false);

        if (LevelButtons != null)
        {
            for (int i = 0; i < LevelButtons.Length; i++)
            {
                int idx = i;
                if (LevelButtons[i] != null)
                    LevelButtons[i].onClick.AddListener(() => OnLevelSelected(idx));
            }
        }

        if (OptionButtons != null)
        {
            for (int i = 0; i < OptionButtons.Length; i++)
            {
                int idx = i;
                if (OptionButtons[i] != null)
                {
                    OptionButtons[i].onClick.AddListener(() => OnOptionClicked(idx));
                }
            }

            // Inspector에 initialOptionTexts가 있으면 Start에서 적용 (버튼 텍스트를 확실히 세팅)
            ApplyInitialButtonTexts();
        }

        // 초기 UI 안전 초기화
        if (AnswerSheetText != null) AnswerSheetText.text = "";
        if (ResultText != null) ResultText.text = "";
    }

    void ApplyInitialButtonTexts()
    {
        if (initialOptionTexts == null || OptionButtons == null) return;

        int limit = Mathf.Min(initialOptionTexts.Length, OptionButtons.Length);
        for (int i = 0; i < limit; i++)
        {
            if (OptionButtons[i] == null) continue;
            Text btnText = OptionButtons[i].GetComponentInChildren<Text>();
            if (btnText != null)
                btnText.text = initialOptionTexts[i];
        }
        // 남는 버튼이 있으면 기존 텍스트 유지 (Inspector에서 직접 설정했을 경우)
    }

    void OnLevelSelected(int levelIndex)
    {
        if (LevelSelectPanel != null) LevelSelectPanel.SetActive(false);
        if (QuizPanel != null) QuizPanel.SetActive(true);

        MakeQuestion();
    }

    void MakeQuestion()
    {
        if (QnA == null || QnA.Count == 0)
        {
            GameOver();
            return;
        }

        currentQuestion = Random.Range(0, QnA.Count);

        // 선택 초기화
        selectedAnswers.Clear();
        if (AnswerSheetText != null) AnswerSheetText.text = "";
        if (ResultText != null) ResultText.text = "";

        // 버튼 텍스트는 기본적으로 Inspector(Button->Text)나 initialOptionTexts로 설정되어 있음.
        // (따로 덮어쓰지 않음 — 사용자가 Inspector에서 직접 버튼 텍스트를 설정하도록 함)
    }

    void OnOptionClicked(int index)
    {
        if (OptionButtons == null || index < 0 || index >= OptionButtons.Length) return;

        Text btnTextComp = OptionButtons[index].GetComponentInChildren<Text>();
        string clickedText = btnTextComp != null ? btnTextComp.text : "";

        if (selectedAnswers.Count < 4)
        {
            selectedAnswers.Add(clickedText);
            if (AnswerSheetText != null)
                AnswerSheetText.text = string.Join("", selectedAnswers);
        }

        if (selectedAnswers.Count == 4)
        {
            CheckAnswer();
        }
    }

    void CheckAnswer()
    {
        if (QnA == null || QnA.Count == 0) return;

        string userAnswer = string.Join("", selectedAnswers);
        string correct = QnA[currentQuestion].CorrectAnswer ?? "";

        if (userAnswer == correct)
            Correct();
        else
            Wrong();
    }

    void Correct()
    {
        HP -= damageOnCorrect;
        HP = Mathf.Clamp(HP, 0f, MaxHP);
        UpdateHPGauge();

        if (ResultText != null) ResultText.text = "정답!";

        if (QuizPanel != null) QuizPanel.SetActive(false);
        if (EntirePanel != null) EntirePanel.SetActive(false);
    }

    void Wrong()
    {
        if (ResultText != null) ResultText.text = "오답! 다시 선택하세요.";

        selectedAnswers.Clear();
        if (AnswerSheetText != null) AnswerSheetText.text = "";
    }

    void UpdateHPGauge()
    {
        if (HPGauge == null) return;

        float width = (HP / MaxHP) * HPMaxWidth;
        width = Mathf.Clamp(width, 0f, HPMaxWidth);

        Vector2 size = HPGauge.rectTransform.sizeDelta;
        size.x = width;
        HPGauge.rectTransform.sizeDelta = size;
    }

    void GameOver()
    {
        if (QuizPanel != null) QuizPanel.SetActive(false);
        if (EntirePanel != null) EntirePanel.SetActive(false);
        if (ResultText != null) ResultText.text = "게임 오버!";
    }
}
