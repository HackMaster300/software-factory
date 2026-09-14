namespace App.Core.Entities;

public sealed class Transaction : BaseEntity {
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "BRL";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}