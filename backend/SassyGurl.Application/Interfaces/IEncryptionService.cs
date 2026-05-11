namespace SassyGurl.Application.Interfaces;

/// <summary>
/// Service for encrypting and decrypting sensitive data (like API keys)
/// using strong encryption algorithms (e.g., AES-256-GCM).
/// </summary>
public interface IEncryptionService
{
    /// <summary>
    /// Encrypts the specified plain text.
    /// </summary>
    /// <param name="plainText">The data to encrypt.</param>
    /// <returns>Base64-encoded encrypted string (including nonce and tag).</returns>
    string Encrypt(string plainText);

    /// <summary>
    /// Decrypts the specified base64-encoded cipher text.
    /// </summary>
    /// <param name="cipherText">The Base64-encoded string returned from Encrypt.</param>
    /// <returns>The decrypted plain text.</returns>
    string Decrypt(string cipherText);
}
