namespace App.Application.Commands;

public sealed record CreateTransactionCommand(decimal Amount, string Currency);