using System;

public static void Run(string myEventHubMessage, TraceWriter log)
{
    log.Info($"C# Event Hub trigger function processed a message: {myEventHubMessage}");
    dynamic msgJson = Newtonsoft.Json.JsonConvert.DeserializeObject(myEventHubMessage);

    foreach (dynamic msg in msgJson)
    {
        dynamic deviceIdToken= msg.SelectToken("controller");
        if (deviceIdToken==null) {
            log.Info("controller doesn't exist!");
            return;
        }

        string deviceId = deviceIdToken.Value;
        log.Info($"Got controller:{deviceId}");
 
        dynamic statusToken= msg.SelectToken("status");
        if (statusToken==null) {
            log.Info("playstatus doesn't exist!");
            return;
        }

        string status = statusToken.Value;
        log.Info($"Got status:{status}");
    
        UpdateTwin(deviceId, status, log).Wait();
    }
}

private async static System.Threading.Tasks.Task UpdateTwin(string deviceId, string status, TraceWriter log)
{
    log.Info("Start nottify via Twin");
    string cs = "HostName=EGCSESyncWeek201758.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=dWrc5wp5ZWnEsAXTQKp0STUW4dzXx1rTetT6XPSo4aU=";
    var registryMgr = Microsoft.Azure.Devices.RegistryManager.CreateFromConnectionString(cs);
    await registryMgr.OpenAsync();
    var device = await registryMgr.GetTwinAsync(deviceId);
    if (device != null)
    {
        log.Info($"Device Found");
        var twinJson = "{\"properties\":{\"desired\":{\"playstatus\":\"" + status + "\"}}";
        await registryMgr.UpdateTwinAsync(deviceId, twinJson, device.ETag);
        log.Info($"Updated Play Stauts");
    }

    await registryMgr.CloseAsync();
}
 