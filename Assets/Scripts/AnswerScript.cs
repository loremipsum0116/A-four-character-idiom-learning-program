using UnityEngine;

public class AnswerScript : MonoBehaviour
{
    public bool isCorrect = false;
    public CardMatchManager quizManager;
    public void Answer(){
        if(isCorrect){
            Debug.Log("Correct");
            quizManager.correct();
        }
        else{
            Debug.Log("wrong");
            //quizManager.wrong();
        }
    }
}
