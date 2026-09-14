using Microsoft.AspNetCore.Mvc;
using App.Application.Commands;
using App.Application.Common;

namespace App.Api.Controllers;

[Route("api/v1/transactions")]
public sealed class TransactionsController : BaseApiController {
    private readonly ICommandHandler<CreateTransactionCommand, Guid> _handler;

    public TransactionsController(ICommandHandler<CreateTransactionCommand, Guid> handler, ILogger<TransactionsController> logger) : base(logger) {
        _handler = handler;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<Guid>> Create([FromBody] CreateTransactionCommand command, CancellationToken ct) {
        Logger.LogInformation("Creating transaction {TraceId}", TraceId);
        var id = await _handler.HandleAsync(command, ct);
        return CreatedAtAction(nameof(Create), new { id }, id);
    }
}