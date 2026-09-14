using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace App.Infrastructure.Auth;

public class JwtTokenGenerator
{
    public string GenerateToken(string userId, string email, IEnumerable<string> roles)
    {
        // JWT generation logic
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
    }
}