using PatientInsight.Api.Logging;
using Microsoft.AspNetCore.Mvc;
using PatientInsight.Api.Consumers;
using PatientInsight.Core.Interfaces;
using PatientInsight.Domain.DTOs;
using MassTransit;

namespace PatientInsight.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<PatientsController> _logger;

    public PatientsController(
        IPatientService patientService,
        IPublishEndpoint publishEndpoint,
        ILogger<PatientsController> logger)
    {
        _patientService = patientService;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    [HttpGet("exists")]
    public async Task<ActionResult<ApiResponse<int?>>> IsExistingPatient([FromQuery] string ssn, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Checking existence for SSN: {Ssn}", PiiMask.Ssn(ssn));
        var result = await _patientService.IsExistingPatientAsync(ssn, cancellationToken);
        
        if (result == null)
        {
            _logger.LogWarning("Patient not found for SSN: {Ssn}", PiiMask.Ssn(ssn));
            return NotFound(ApiResponse<int?>.Fail("Patient not found."));
        }

        return Ok(ApiResponse<int?>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PatientDto>>> GetPatient(int id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Retrieving patient details for Id: {Id}", id);
        var patient = await _patientService.GetPatientAsync(id, cancellationToken);
        
        if (patient == null)
            return NotFound(ApiResponse<PatientDto>.Fail("Patient not found."));

        return Ok(ApiResponse<PatientDto>.Ok(patient));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<int>>> RegisterPatient([FromBody] PatientDto patientDto, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Registering new patient");
        var patientId = await _patientService.RegisterPatientAsync(patientDto, cancellationToken);

        await _publishEndpoint.Publish(new PatientDataIngestEvent
        {
            PatientId = patientId,
            Ssn = patientDto.Ssn,
            OccurredAt = DateTime.UtcNow
        }, cancellationToken);

        _logger.LogInformation("Data ingest event published for PatientId: {PatientId}", patientId);
        return CreatedAtAction(nameof(GetPatient), new { id = patientId }, ApiResponse<int>.Ok(patientId));
    }
}
