using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace App.Infrastructure.Caching;

public class RedisCacheService
{
    private readonly IDistributedCache _cache;
    public RedisCacheService(IDistributedCache cache) => _cache = cache;

    public async Task<T?> GetAsync<T>(string key)
    {
        var data = await _cache.GetStringAsync(key);
        return data == null ? default : JsonSerializer.Deserialize<T>(data);
    }
}