#r "System.IO"

using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Auth;
using Microsoft.WindowsAzure.Storage.Blob;

using System.IO;
using Newtonsoft.Json;

public static void Run(Stream myBlob, string name, TraceWriter log, out string outputChordMessage)
{
    // This logic is dummy...
    // Please someone provide chord recognize AI!
    var fileNames = name.Split(new char[] { '/' });
    log.Info($"C# Blob trigger function Processed blob\n Name:{fileNames[1]} \n  \n From:{fileNames[0]}");
    
    string[] chords = {"C", "D", "E", "F", "G", "A", "B", "Cm", "Dm", "Em", "Fm", "Gm", "Am", "Bm"};

    // TODO : call magic ai and recognize chord!
    var index = GetRandomNumber(chords.Length-1);
    log.Info("Random number is "+index);
    var message = new { deviceid = fileNames[0], chord = chords[index] };  

    string json = JsonConvert.SerializeObject(message);
    
    log.Verbose(json);   
    outputChordMessage = json;

}

private static readonly Random getrandom = new Random();
private static readonly object syncLock = new object();
public static int GetRandomNumber(int n)
{
    lock(syncLock) 
    { // synchronize
        return getrandom.Next(0,n);
    }
}