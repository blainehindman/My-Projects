namespace SpeechApp;

public partial class ModesPage : ContentPage
{
	public ModesPage()
	{
		InitializeComponent();
	}

    // This method will be called when the "Talk To" frame is clicked
    private async void OnTalkToClicked(object sender, EventArgs e)
    {
        // Navigate to the TalkToModePage
        await Navigation.PushAsync(new TalkToPage());
    }
}