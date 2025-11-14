using UnityEngine;
using TMPro;


public class GameManager : MonoBehaviour
{
public TMP_Text problemText;
public TMP_InputField inputField;
public TMP_Text timerText;


private string correctAnswer;
private float timeLimit = 10f;
private float timer;


void Start()
{
LoadProblem();
timer = timeLimit;
}


void Update()
{
timer -= Time.deltaTime;
timerText.text = timer.ToString("F1");


if (timer <= 0)
CheckAnswer();
}


void LoadProblem()
{
problemText.text = "一石 〇〇";
correctAnswer = "二鳥";
}


public void CheckAnswer()
{
string userAnswer = inputField.text;


if (userAnswer == correctAnswer)
Debug.Log("정답! 공격 성공!");
else
Debug.Log("오답! 공격 실패!");
}
}