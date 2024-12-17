using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;

//namespace SpeechApp
//{
//    public class PhiAIService
//    {
//        private const string ApiKey = "4XwbLf3UJqCSpdazcQWJxZMnQs33eSuL"; // Replace with your API Key
//        private const string EndpointUrl = "https://Phi-3-medium-4k-instruct-cmrpr.eastus2.models.ai.azure.com/v1/chat/completions"; // Replace with your endpoint

//        public async Task<string> GetChatResponseAsync(string userMessage)
//        {
//            if (string.IsNullOrEmpty(ApiKey))
//            {
//                throw new Exception("A key should be provided to invoke the endpoint.");
//            }

//            var handler = new HttpClientHandler()
//            {
//                ClientCertificateOptions = ClientCertificateOption.Manual,
//                ServerCertificateCustomValidationCallback = (httpRequestMessage, cert, cetChain, policyErrors) => { return true; }
//            };

//            using (var client = new HttpClient(handler))
//            {
//                // Create the request body with the user message
//                var requestBody = $@"{{
//                    ""messages"": [
//                        {{
//                            ""role"": ""user"",
//                            ""content"": ""{userMessage}""
//                        }}
//                    ],
//                    ""max_tokens"": 2048,
//                    ""temperature"": 0,
//                    ""top_p"": 1
//                }}";

//                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ApiKey);
//                client.BaseAddress = new Uri(EndpointUrl);

//                var content = new StringContent(requestBody, Encoding.UTF8, "application/json");

//                // Send the POST request to the AI model
//                HttpResponseMessage response = await client.PostAsync("", content);

//                // Handle response
//                if (response.IsSuccessStatusCode)
//                {
//                    // Return the result as a string
//                    return await response.Content.ReadAsStringAsync();
//                }
//                else
//                {
//                    string responseContent = await response.Content.ReadAsStringAsync();
//                    throw new Exception($"The request failed with status code: {response.StatusCode}\nResponse: {responseContent}");
//                }
//            }
//        }


//    }
//}
namespace SpeechApp
{
    public class PhiAIService
    {
        private const string ApiKey = "4XwbLf3UJqCSpdazcQWJxZMnQs33eSuL"; // Replace with your API Key
        private const string EndpointUrl = "https://Phi-3-medium-4k-instruct-cmrpr.eastus2.models.ai.azure.com/v1/chat/completions"; // Replace with your endpoint

        public async Task<string> GetChatResponseAsync(string userMessage)
        {
            if (string.IsNullOrEmpty(ApiKey))
            {
                throw new Exception("A key should be provided to invoke the endpoint.");
            }

            var handler = new HttpClientHandler()
            {
                ClientCertificateOptions = ClientCertificateOption.Manual,
                ServerCertificateCustomValidationCallback = (httpRequestMessage, cert, cetChain, policyErrors) => { return true; }
            };

            using (var client = new HttpClient(handler))
            {
                // Create the request body with the user message
                var requestBody = $@"{{
                    ""messages"": [
                        {{
                            ""role"": ""user"",
                            ""content"": ""{userMessage}""
                        }}
                    ],
                    ""max_tokens"": 2048,
                    ""temperature"": 0,
                    ""top_p"": 1
                }}";

                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ApiKey);
                client.BaseAddress = new Uri(EndpointUrl);

                var content = new StringContent(requestBody, Encoding.UTF8, "application/json");

                // Send the POST request to the AI model
                HttpResponseMessage response = await client.PostAsync("", content);

                // Handle response
                if (response.IsSuccessStatusCode)
                {
                    // Parse the JSON response and extract the "clean" sentence
                    string jsonResponse = await response.Content.ReadAsStringAsync();
                    return ExtractResponseContent(jsonResponse);
                }
                else
                {
                    string responseContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"The request failed with status code: {response.StatusCode}\nResponse: {responseContent}");
                }
            }
        }

        private string ExtractResponseContent(string jsonResponse)
        {
            try
            {
                // Parse the JSON response
                using (JsonDocument document = JsonDocument.Parse(jsonResponse))
                {
                    // Navigate through the JSON structure to get the "content"
                    var content = document
                        .RootElement
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();

                    return content;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing JSON response: {ex.Message}");
                return null;
            }
        }
    }
}