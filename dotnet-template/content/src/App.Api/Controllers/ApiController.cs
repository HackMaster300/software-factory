using Microsoft.AspNetCore.Mvc;

namespace App.Api.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase {
    protected ILogger Logger { get; }

    protected BaseApiController(ILogger logger) {
        Logger = logger;
    }

    protected string TraceId => HttpContext.TraceIdentifier;
}