using UnityEngine;
using TMPro;
using System.Collections.Generic;
using UnityEngine.SceneManagement;


public class CardMatchManager : MonoBehaviour
{
    public List<QuestionAnswer> QnA;
    public GameObject[] options;
    public int currentQuestion;
    public TMP_Text QuestionText;
    public GameObject QuizPanel;
    public GameObject GoPanel;
    public TMP_Text ScoreText;
    int totalQuestion = 0;
    public int score;

    private void Start(){
        totalQuestion = QnA.Count;
        GoPanel.SetActive(false);
        makeQuestion();
    }

    void makeQuestion(){
        if(QnA.Count > 0){
            currentQuestion = Random.Range(0, QnA.Count);
            QuestionText.text = QnA[currentQuestion].Question;
            SetAnswer();
        }
       else{
            Debug.Log("문제를 다 풀었습니다.");
            GameOver();
       }
    }

    void SetAnswer(){
        for(int i = 0; i < options.Length; i++){
            options[i].GetComponent<AnswerScript>().isCorrect = false;
            options[i].transform.GetChild(0).GetComponent<TMP_Text>().text = QnA[currentQuestion].Answer[i];

            if(QnA[currentQuestion].CorrectAnswer == i + 1){
                options[i].GetComponent<AnswerScript>().isCorrect = true;
            }
        }
    }

    public void correct(){
        score += 1;
        QnA.RemoveAt(currentQuestion);
        makeQuestion();
    }

    public void wrong(){
        QnA.RemoveAt(currentQuestion);
        makeQuestion();
    }
    void GameOver(){
        QuizPanel.SetActive(false);
        GoPanel.SetActive(true);
        ScoreText.text = score + " 개 맞았습니다.";
    }
    public void retry(){
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }
}
