using UnityEngine;
using UnityEngine.SceneManagement;

public class MenuManager : MonoBehaviour
{
    public void OnPressGameStart(){
        SceneManager.LoadScene("ModeSelect");
    }
    public void OnPressProfile(){
        SceneManager.LoadScene("Profile");
    }
}
