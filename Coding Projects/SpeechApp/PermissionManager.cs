using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Maui.Controls;
using Microsoft.Maui.ApplicationModel;

namespace SpeechApp
{
    public class PermissionManager
    {
        public static async Task<bool> RequestMicrophonePermissionAsync()
        {
            var status = await Permissions.CheckStatusAsync<Permissions.Microphone>();

            if (status != PermissionStatus.Granted)
            {
                // Request the microphone permission
                status = await Permissions.RequestAsync<Permissions.Microphone>();

                // If permission is denied, navigate to MainPage
                if (status != PermissionStatus.Granted)
                {
                    return false;
                }
            }

            return true; // Permission is granted
        }
    }
}
