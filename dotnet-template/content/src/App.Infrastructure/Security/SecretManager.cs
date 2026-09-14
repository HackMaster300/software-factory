namespace App.Infrastructure.Security;

public interface ISecretManager
{
    Task<string> GetSecretAsync(string secretName);
}