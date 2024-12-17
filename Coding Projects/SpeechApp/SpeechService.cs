using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.CognitiveServices.Speech;


namespace SpeechApp
{
    public class SpeechService
    {
        private const string SpeechSubscriptionKey = "ccd0cb4135b84628a6c4b3c8ff12ab51"; // Replace with your Azure Speech Key
        private const string SpeechRegion = "westus"; // Replace with your Azure Region
        private Stopwatch stopwatch;

        public SpeechService()
        {
            stopwatch = new Stopwatch();
        }

        // Method to start the stopwatch
        public void StartTimer()
        {
            stopwatch.Restart();
        }

        // Method to stop the stopwatch and return the elapsed time in seconds
        public double StopTimer()
        {
            stopwatch.Stop();
            return stopwatch.Elapsed.TotalSeconds;
        }

        // Method to transcribe speech using Azure Speech Service
        public async Task<string> TranscribeSpeechAsync()
        {
            try
            {
                // Configure the speech recognizer
                var config = SpeechConfig.FromSubscription(SpeechSubscriptionKey, SpeechRegion);
                using var recognizer = new SpeechRecognizer(config);

                // Start recognizing speech asynchronously
                var result = await recognizer.RecognizeOnceAsync();

                // Process the result
                if (result.Reason == ResultReason.RecognizedSpeech)
                {
                    return result.Text;
                }
                else if (result.Reason == ResultReason.NoMatch)
                {
                    return "No speech recognized.";
                }
                return "Speech recognition error.";
            }
            catch (Exception ex)
            {
                return $"Error: {ex.Message}";
            }
        }

        // Method to analyze the transcribed speech
        public string AnalyzeSpeech(string transcription)
        {
            double totalSeconds = stopwatch.Elapsed.TotalSeconds;

            // Example of word count and WPM calculation
            var words = transcription.Split(new[] { ' ', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            int wordCount = words.Length;

            // Calculate Words Per Minute (WPM)
            double wordsPerMinute = (wordCount / totalSeconds) * 60;

            // Example filler word detection (simple approach)
            string[] fillerWords = { "umm", "uh", "like", "you know", "ya know", "ah", "er", "so", "well", "actually", "basically", "literally", "right", "I mean", "you see", "sort of", "kind of", "okay", "just", "hmm" };

            int fillerWordCount = 0;
            foreach (var filler in fillerWords)
            {
                fillerWordCount += CountOccurrences(transcription, filler);
            }

            // Return a summary of the analysis
            return $"Word Count: {wordCount}\nTime: {totalSeconds}\nWPM: {wordsPerMinute:F2}\nFiller Words: {fillerWordCount}";
        }

        // Utility method to count occurrences of a word in a string
        private int CountOccurrences(string text, string word)
        {
            text = text.ToLower();
            word = word.ToLower();

            return (text.Length - text.Replace(word, string.Empty).Length) / word.Length;
        }
    }
}
