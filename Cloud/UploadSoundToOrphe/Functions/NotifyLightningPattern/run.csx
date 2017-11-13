using System;

public static void Run(string myEventHubMessage, TraceWriter log)
{
    log.Info($"C# Event Hub trigger function processed a message: {myEventHubMessage}");
    dynamic msgJson = Newtonsoft.Json.JsonConvert.DeserializeObject(myEventHubMessage);
    foreach(dynamic msg in msgJson){
        dynamic leftToken= msg.SelectToken("leftid");
        if (leftToken==null) {
            log.Info("leftid doesn't exist!");
            return;
        }

        string leftDeviceId = leftToken.Value;
        // Stream Analytics has bug which add ' ' for head of property value
        leftDeviceId = leftDeviceId.Trim();
        log.Info($"Got left:{leftDeviceId}");
 
        dynamic rightToken= msg.SelectToken("rightid");
        if (rightToken==null) {
            log.Info("rightid doesn't exist!");
            return;
        }

        string rightDeviceId = rightToken.Value;
        rightDeviceId = rightDeviceId.Trim();
        log.Info($"Got left:{rightDeviceId}");
 
        dynamic patternToken= msg.SelectToken("lightingpattern");
        if (patternToken==null) {
            log.Info("lightingpattern doesn't exist!");
            return;
        }

        long pattern = patternToken.Value;
        log.Info($"Got pattern:{pattern}");
 
        NotifyPattern(leftDeviceId, rightDeviceId, pattern, log).Wait();
    }
}

public static async System.Threading.Tasks.Task NotifyPattern(string leftDeviceId, string rightDeviceId, long pattern, TraceWriter log)
{
    var message = new
    {
        instructionType = "orphe",
        instructions = new[] { new { command = "lighting", pattern = pattern } }
    };
    var json = Newtonsoft.Json.JsonConvert.SerializeObject(message);
    var sendMsg = new Microsoft.Azure.Devices.Message(System.Text.UTF8Encoding.UTF8.GetBytes(json));
    log.Info("Sending message is - '"+json+"'");

    string cs = "HostName=EGCSESyncWeek201758.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=rBxH3W4FCLmdo7gFTm8bCHFjcmTS3kd9zXYVQVNl2w0=";
    var serviceClient = Microsoft.Azure.Devices.ServiceClient.CreateFromConnectionString(cs);
    try
    {
        await serviceClient.OpenAsync();
        log.Info("IoT Hub Connected");
        log.Info("Sending to '"+leftDeviceId+"'");
        var sendLMsg = new Microsoft.Azure.Devices.Message(System.Text.UTF8Encoding.UTF8.GetBytes(json));
        await serviceClient.SendAsync(leftDeviceId, sendLMsg);
        log.Info("Send to left completed");
        var sendRMsg = new Microsoft.Azure.Devices.Message(System.Text.UTF8Encoding.UTF8.GetBytes(json));
        await serviceClient.SendAsync(rightDeviceId, sendRMsg);
        log.Info("Send to right completed");
        await serviceClient.CloseAsync();
    }
    catch(Exception ex)
    {
        log.Info("Error Happened - "+ex.Message);
    }
}