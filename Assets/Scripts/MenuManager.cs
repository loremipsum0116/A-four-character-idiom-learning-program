using UnityEngine;
using UnityEngine.SceneManagement;

public class MenuManager : MonoBehaviour
{
    public void OnPressGameStart(){
        SceneManager.LoadScene("Map");
    }
    public void OnPressProfile(){
        SceneManager.LoadScene("Profile");
    }
}
