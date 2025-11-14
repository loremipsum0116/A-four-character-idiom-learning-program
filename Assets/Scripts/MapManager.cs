using UnityEngine;
using UnityEngine.SceneManagement;

public class MapManager : MonoBehaviour
{
    public void OnPressMouse(){
        SceneManager.LoadScene("Mouse");
    }
    public void OnPressCow(){
        SceneManager.LoadScene("Cow");
    }
    public void OnPressTiger(){
        SceneManager.LoadScene("Tiger");
    }
    public void OnPressRabbit(){
        SceneManager.LoadScene("Rabbit");
    }
    public void OnPressDragon(){
        SceneManager.LoadScene("Dragon");
    }
    public void OnPressSnake(){
        SceneManager.LoadScene("Snake");
    }
    public void OnPressHorse(){
        SceneManager.LoadScene("Horse");
    }
    public void OnPressSheep(){
        SceneManager.LoadScene("Sheep");
    }
    public void OnPressMonkey(){
        SceneManager.LoadScene("Monkey");
    }
    public void OnPressChicken(){
        SceneManager.LoadScene("Chicken");
    }
    public void OnPressDog(){
        SceneManager.LoadScene("Dog");
    }
    public void OnPressPig(){
        SceneManager.LoadScene("Pig");
    }
}
