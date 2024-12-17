using Microsoft.Maui.Controls;
using System;
using System.Threading.Tasks;

namespace SpeechApp
{
    public partial class TalkToPage : ContentPage
    {
        private bool isRecording = false;
        private SpeechService speechService;
        private readonly PhiAIService _phiAIService;

        public TalkToPage()
        {
            InitializeComponent();
            speechService = new SpeechService();
            _phiAIService = new PhiAIService();
        }

        // This method is called when the page appears
        protected override async void OnAppearing()
        {
            base.OnAppearing();

            // Disable the StartStopButton initially
            StartStopButton.IsEnabled = false;

            // Directly call the PermissionManager's method to check and request microphone permission
            bool hasPermission = await PermissionManager.RequestMicrophonePermissionAsync();

            if (!hasPermission)
            {
                // Permission was denied, show an alert or navigate as needed
                await DisplayAlert("Permission Denied", "Microphone access is required for this app to function properly.", "OK");
            }
            else
            {
                // Permission granted, proceed with app functionality
                StartStopButton.IsEnabled = true;
            }
        }


        // Event handler for the button to start/stop recording
        private async void StartStopButton_Clicked(object sender, EventArgs e)
        {
            if (isRecording)
            {
                // Stop the process manually if user clicks "Stop Talking"
                await StopRecording();
            }
            else
            {
                // Start the recording process
                await StartRecording();
            }
        }

        // Method to start recording audio and recognize speech using Azure
        private async Task StartRecording()
        {
            try
            {
                // Start recording
                isRecording = true;
                StartStopButton.Text = "Stop Talking";

                speechService.StartTimer();

                // Use SpeechService to transcribe speech
                var transcription = await speechService.TranscribeSpeechAsync();

                // Display the transcription result
                TranscriptionLabel.Text = transcription;

                // Perform analysis on the transcription
                var analysisResult = speechService.AnalyzeSpeech(transcription);
                MetricsLabel.Text = analysisResult;

                // Perform AI chat response
                string response = await _phiAIService.GetChatResponseAsync(/*transcription*/"test, hello!");
                AILabel.Text = response;

                // Automatically stop recording once the speech is recognized and analysis is done
                await StopRecording();
            }
            catch (Exception ex)
            {
                TranscriptionLabel.Text = $"Error: {ex.Message}";
            }
        }

        // Method to stop recording and reset the button text
        private async Task StopRecording()
        {
            // Stop the timer and reset recording state
            isRecording = false;
            StartStopButton.Text = "Start Talking";
            await Task.CompletedTask;
        }
    }
}