using System.IO;
using System.Threading.Tasks;

namespace SassyGurl.Application.Services;

public interface IFileStorageService
{
    /// <summary>
    /// Uploads a file and returns its public URL
    /// </summary>
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string folderName = "avatars");

    /// <summary>
    /// Deletes a file given its public ID
    /// </summary>
    Task<bool> DeleteFileAsync(string publicId);
}
