using UnityEngine;
using UnityEngine.SceneManagement;

public class ModeManager : MonoBehaviour
{
    public void OnPressBlank(){
        SceneManager.LoadScene("FillInTheBlank");
    }
    public void OnPressCard(){
        SceneManager.LoadScene("CardMatching");
    }
}
