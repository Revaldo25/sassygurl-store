using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using SassyGurl.Application.Services;

namespace SassyGurl.Infrastructure.Services;

public class CloudinaryStorageService : IFileStorageService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryStorageService(IConfiguration configuration)
    {
        var cloudName = configuration["Cloudinary:CloudName"] ?? "dummy_cloud";
        var apiKey = configuration["Cloudinary:ApiKey"] ?? "dummy_key";
        var apiSecret = configuration["Cloudinary:ApiSecret"] ?? "dummy_secret";

        var acc = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(acc);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string folderName = "avatars")
    {
        if (fileStream == null || fileStream.Length == 0) return null!;

        var uploadParams = new ImageUploadParams()
        {
            File = new FileDescription(fileName, fileStream),
            Folder = "sassygurl/" + folderName,
            Transformation = new Transformation().Width(500).Height(500).Crop("fill").Gravity("face")
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

        if (uploadResult.Error != null)
        {
            throw new Exception($"Cloudinary upload failed: {uploadResult.Error.Message}");
        }

        return uploadResult.SecureUrl.ToString();
    }

    public async Task<bool> DeleteFileAsync(string publicId)
    {
        var deletionParams = new DeletionParams(publicId);
        var result = await _cloudinary.DestroyAsync(deletionParams);

        return result.Result == "ok";
    }
}
