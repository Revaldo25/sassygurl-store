using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Infrastructure.Services;

/// <summary>
/// AES-256-GCM implementation for strong encryption and decryption.
/// GCM provides both confidentiality and authenticated encryption (integrity).
/// 
/// The format of the stored cipher text is Base64 of:
/// [Nonce (12 bytes)] + [Ciphertext] + [AuthTag (16 bytes)]
/// </summary>
public class AesGcmEncryptionService : IEncryptionService
{
    private readonly byte[] _masterKey;

    public AesGcmEncryptionService(IConfiguration configuration)
    {
        var keyHex = configuration["Security:EncryptionMasterKey"];
        if (string.IsNullOrWhiteSpace(keyHex) || keyHex.Length != 64)
        {
            throw new InvalidOperationException("Security:EncryptionMasterKey must be a 64-character hex string (32 bytes for AES-256).");
        }

        _masterKey = Convert.FromHexString(keyHex);
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return plainText;

        byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
        
        // AES-GCM requires a 12-byte nonce (IV)
        byte[] nonce = new byte[AesGcm.NonceByteSizes.MaxSize];
        RandomNumberGenerator.Fill(nonce);

        // AES-GCM authentication tag is 16 bytes
        byte[] tag = new byte[AesGcm.TagByteSizes.MaxSize];
        byte[] cipherBytes = new byte[plainBytes.Length];

        using (var aesGcm = new AesGcm(_masterKey, AesGcm.TagByteSizes.MaxSize))
        {
            aesGcm.Encrypt(nonce, plainBytes, cipherBytes, tag);
        }

        // Combine Nonce + CipherText + Tag
        var result = new byte[nonce.Length + cipherBytes.Length + tag.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, nonce.Length);
        Buffer.BlockCopy(cipherBytes, 0, result, nonce.Length, cipherBytes.Length);
        Buffer.BlockCopy(tag, 0, result, nonce.Length + cipherBytes.Length, tag.Length);

        return Convert.ToBase64String(result);
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
            return cipherText;

        byte[] encryptedData = Convert.FromBase64String(cipherText);

        int nonceSize = AesGcm.NonceByteSizes.MaxSize;
        int tagSize = AesGcm.TagByteSizes.MaxSize;
        int cipherSize = encryptedData.Length - nonceSize - tagSize;

        if (cipherSize < 0)
        {
            throw new CryptographicException("Invalid cipher text length.");
        }

        byte[] nonce = new byte[nonceSize];
        byte[] cipherBytes = new byte[cipherSize];
        byte[] tag = new byte[tagSize];

        Buffer.BlockCopy(encryptedData, 0, nonce, 0, nonceSize);
        Buffer.BlockCopy(encryptedData, nonceSize, cipherBytes, 0, cipherSize);
        Buffer.BlockCopy(encryptedData, nonceSize + cipherSize, tag, 0, tagSize);

        byte[] plainBytes = new byte[cipherSize];

        using (var aesGcm = new AesGcm(_masterKey, tagSize))
        {
            aesGcm.Decrypt(nonce, cipherBytes, tag, plainBytes);
        }

        return Encoding.UTF8.GetString(plainBytes);
    }
}
