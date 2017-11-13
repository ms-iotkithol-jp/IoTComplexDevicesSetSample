using Microsoft.Azure.Devices.Client;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Text;
using System.Threading.Tasks;
using Windows.Devices.Enumeration;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.Media.Capture;
using Windows.Media.Playback;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;
using Microsoft.Azure.Devices.Shared;
using Windows.Storage;
using Windows.Media.MediaProperties;
using System.Diagnostics;

// 空白ページの項目テンプレートについては、https://go.microsoft.com/fwlink/?LinkId=402352&clcid=0x411 を参照してください

namespace GuitarControllerUWP
{
    /// <summary>
    /// それ自体で使用できる空白ページまたはフレーム内に移動できる空白ページ。
    /// </summary>
    public sealed partial class MainPage : Page
    {
        private readonly string connectionString = "controller device-id's iot hub connection string";
        public MainPage()
        {
            this.InitializeComponent();
            this.Loaded += MainPage_Loaded;
            this.Unloaded += MainPage_Unloaded;
        }

        MediaCapture audioCapture;
        DeviceClient deviceClient;
        private async void MainPage_Unloaded(object sender, RoutedEventArgs e)
        {
            if (deviceClient != null)
            {
                await deviceClient.CloseAsync();
            }
        }

        private async void MainPage_Loaded(object sender, RoutedEventArgs e)
        {
            await CleanUpUploadingSoundFiles();
            if (await InitializeSoundCaptureSettings())
            {
                tbMixerStatus.Text = "Connected";
            }
            if (!string.IsNullOrEmpty(connectionString))
            {
                tbIoTHubCS.Text = connectionString;
            }
        }

        private string musicDeviceName = "";
        private static readonly string musicDeviceGoMixer = "GO:MIXER";
        private static readonly string musicDeviceSonicPortVX = "Sonic Port VX";
        private static readonly string[] musicDeviceNames = { musicDeviceGoMixer, musicDeviceSonicPortVX };
        private async Task<bool> InitializeSoundCaptureSettings()
        {
            var devices = await DeviceInformation.FindAllAsync(DeviceClass.AudioCapture);
            foreach(var device in devices)
            {
                foreach (var musicDevice in musicDeviceNames)
                {
                    if (device.Name.IndexOf(musicDevice) > 0)
                    {
                        musicDeviceName = musicDevice;
                        var captureSettings = new MediaCaptureInitializationSettings();
                        captureSettings.AudioDeviceId = device.Id;
                        captureSettings.StreamingCaptureMode = StreamingCaptureMode.Audio;
                        audioCapture = new MediaCapture();
                        await audioCapture.InitializeAsync(captureSettings);
                        return true;
                    }
                }
            }
            return false;
        }

        private async void buttonIoTHub_Click(object sender, RoutedEventArgs e)
        {
            if (buttonIoTHub.Content.ToString() == "Connect")
            {
                deviceClient = DeviceClient.CreateFromConnectionString(tbIoTHubCS.Text, TransportType.Mqtt);
                try
                {
                    await deviceClient.OpenAsync();
                    tbIoTHubStatus.Text = "Connected";
                    AppendPlayLog("IoT Hub Connected");

                    buttonIoTHub.Content = "Disconnect";

                    await deviceClient.SetDesiredPropertyUpdateCallbackAsync(OnDesiredPropertyUpdated, this);
                }
                catch (Exception ex)
                {
                    AppendPlayLog("IoT Hub Connection Error", ex.Message);
                    deviceClient = null;
                }
            }
            else
            {
                await deviceClient.CloseAsync();
                AppendPlayLog("IoT Hub Disconnected");
                tbIoTHubStatus.Text = "Disconnected";
                buttonIoTHub.Content = "Connect";
                deviceClient = null;
            }
        }

        bool playing = false;
        private async Task OnDesiredPropertyUpdated(TwinCollection desiredProperties, object userContext)
        {
            var desired = desiredProperties.ToJson();
            dynamic json = Newtonsoft.Json.JsonConvert.DeserializeObject(desired);
            dynamic playStatusToken = json.SelectToken("playstatus");
            if (playStatusToken != null)
            {
                string playStatus = playStatusToken.Value;
                await Dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, async () =>
                  {
                      AppendPlayLog("Play Status Received:", playStatus);
                      if (playStatus.ToLower() == "start")
                      {
                          if (deviceClient != null && audioCapture != null)
                          {
                              await StartCaptureAndUpload();
                              tbPlayStatus.Text = "Sending";
                              imgGuitar.Visibility = Visibility.Visible;
                              playing = true;
                          }
                          else
                          {
                              if (deviceClient == null)
                              {
                                  var dialog = new ContentDialog()
                                  {
                                      Title = "Alert",
                                      Content = "Please Connect to IoT Hub!",
                                      CloseButtonText = "OK"
                                  };
                                  await dialog.ShowAsync();
                              }
                              else
                              {
                                  var dialog = new ContentDialog()
                                  {
                                      Title = "Alert",
                                      Content = "Pleaes Connect "+musicDeviceName+" and restart this app!",
                                      CloseButtonText = "OK"
                                  };
                                  await dialog.ShowAsync();
                              }
                          }
                      }
                      else if (playStatus.ToLower() == "stop")
                      {
                          if (playing)
                          {
                              await StopCaptureAndUpload();
                              imgGuitar.Visibility = Visibility.Collapsed;
                              playing = false;
                          }
                          tbPlayStatus.Text = "Waiting...";
                      }

                      else
                      {
                          AppendPlayLog("Play Status message doesn't have playstatus");
                      }

                  });
            }
        }

        DispatcherTimer uploadTimer;

        private List<int> uploadingSoundFileIndexes = new List<int>();
        private string soundFileNamePrefix = "sound";
        private string soudFileNameExt = ".mp3";
        private string currentFileName = "";
        private async Task CleanUpUploadingSoundFiles()
        {
            var localFolder = Windows.Storage.ApplicationData.Current.LocalFolder;
            foreach(var f in await localFolder.GetFilesAsync())
            {
                if (f.Name.StartsWith(soundFileNamePrefix) && f.Name.EndsWith(soudFileNameExt))
                {
                    await f.DeleteAsync();
                }
            }
        }

        LowLagMediaRecording mediaRecording = null;
        private async Task StartRecording()
        {
            int index = 0;
            lock (this)
            {
                if (uploadingSoundFileIndexes.Count() > 0)
                {
                    int max = uploadingSoundFileIndexes.Max();
                    while (index <= max)
                    {
                        if (!uploadingSoundFileIndexes.Contains(index))
                        {
                            break;
                        }
                        index++;
                    }
                }
                uploadingSoundFileIndexes.Add(index);
            }

            currentFileName = soundFileNamePrefix + index + soudFileNameExt;
            try
            {
                StorageFile file = await Windows.Storage.ApplicationData.Current.LocalFolder.CreateFileAsync(currentFileName, Windows.Storage.CreationCollisionOption.ReplaceExisting);
                mediaRecording = await audioCapture.PrepareLowLagRecordToStorageFileAsync(
                    MediaEncodingProfile.CreateMp3(AudioEncodingQuality.High), file);
                await mediaRecording.StartAsync();
                Debug.WriteLine("StartR - " + currentFileName);
            }
            catch(Exception ex)
            {
                AppendPlayLog("Start Recording Exception:", ex.Message);
            }
        }

        private async Task EndRecording()
        {
            try
            {
                await mediaRecording.StopAsync();
                await mediaRecording.FinishAsync();
                mediaRecording = null;
                Debug.WriteLine("EndR - " + currentFileName);
            }
            catch (Exception ex)
            {
                AppendPlayLog("End Recording Exception:", ex.Message);
            }
        }

        private void AppendPlayLog(string title, string message=null)
        {
            var sb = new StringBuilder();
            sb.AppendLine(title);
            if (!string.IsNullOrEmpty(message))
            {
                sb.AppendLine("\t" + message);
                sb.AppendLine("");
            }
            sb.Append(tbPlayLog.Text);

            tbPlayLog.Text = sb.ToString();
        }

        private void buttonTest_Click(object sender, RoutedEventArgs e)
        {
            if (buttonTest.Content.ToString()=="Test Start")
            {
                buttonTest.Content = "Test End";
                buttonTRecording.IsEnabled = true;
            }
            else
            {
                buttonTest.Content = "Test Start";
                buttonTRecording.IsEnabled = false;
            }
        }

        private  async void buttonTRecording_Click(object sender, RoutedEventArgs e)
        {
            if (buttonTRecording.Content.ToString().StartsWith("Start"))
            {
                await StartCaptureAndUpload();
                buttonTRecording.Content = "End Recording";
            }
            else
            {
                await StopCaptureAndUpload();
                buttonTRecording.Content = "Start Recording";
            }
        }

        private async Task StopCaptureAndUpload()
        {
            uploadTimer.Stop();

            if (mediaRecording != null)
            {
                await EndRecording();
            }
        }

        private async Task StartCaptureAndUpload()
        {
            uploadTimer = new DispatcherTimer();
            uploadTimer.Interval = TimeSpan.FromMilliseconds(int.Parse(tbSoundUploadInvervalMS.Text));
            uploadTimer.Tick += UploadTimer_Tick;
            await StartRecording();
            uploadTimer.Start();
        }

        private async void UploadTimer_Tick(object sender, object e)
        {
            await EndRecording();

            if (currentFileName != "")
            {
                string fileName = currentFileName;
                
                new Task(async () =>
                {
                    if (deviceClient != null)
                    {
                        try
                        {
                            var now = DateTime.Now;
                            var blobName = soundFileNamePrefix + now.ToString("yyyyMMddHHmmss") + soudFileNameExt;
                            var localFolder = Windows.Storage.ApplicationData.Current.LocalFolder;
                            var file = await localFolder.GetFileAsync(fileName);
                            using (var stream = await file.OpenStreamForReadAsync())
                            {
                                await deviceClient.UploadToBlobAsync(blobName, stream);
                                Debug.WriteLine("Uploaded - " + fileName);
                            }
                        }
                        catch(Exception ex)
                        {
                            Dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () =>
                            {
                                AppendPlayLog("Upload Error:", ex.Message);
                            });
                            Debug.WriteLine(ex.Message);
                        }
                    }
                    string numPart = fileName.Substring(soundFileNamePrefix.Length);
                    numPart = numPart.Substring(0, numPart.IndexOf(soudFileNameExt));
                    int fileIndex = int.Parse(numPart);
                    lock (this)
                    {
                        for (int i = 0; i < uploadingSoundFileIndexes.Count(); i++)
                        {
                            if (uploadingSoundFileIndexes[i] == fileIndex)
                            {
                                uploadingSoundFileIndexes.RemoveAt(i);
                            }
                        }
                    }

                }).Start();
            }
            await StartRecording();
        }
    }
}
