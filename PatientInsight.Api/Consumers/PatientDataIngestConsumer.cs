using PatientInsight.Api.Logging;
using PatientInsight.Core.Interfaces;
using MassTransit;

namespace PatientInsight.Api.Consumers;

public class PatientDataIngestConsumer : IConsumer<PatientDataIngestEvent>
{
    private readonly IPatientService _patientService;
    private readonly IAuthService _authService;
    private readonly ILogger<PatientDataIngestConsumer> _logger;

    public PatientDataIngestConsumer(
        IPatientService patientService,
        IAuthService authService,
        ILogger<PatientDataIngestConsumer> logger)
    {
        _patientService = patientService;
        _authService = authService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PatientDataIngestEvent> context)
    {
        var message = context.Message;
        var cancellationToken = context.CancellationToken;

        _logger.LogInformation("Ingesting data for PatientId={PatientId}, SSN={Ssn}", message.PatientId, PiiMask.Ssn(message.Ssn));

        var token = await _authService.GetAuthTokenAsync(cancellationToken);

        await _patientService.SyncLabVisitsAsync(message.Ssn, message.PatientId, token, cancellationToken);
        await _patientService.SyncMedicationsAsync(message.Ssn, message.PatientId, token, cancellationToken);
        await _patientService.SyncVaccinationsAsync(message.Ssn, message.PatientId, token, cancellationToken);

        _logger.LogInformation("Data ingestion completed for PatientId={PatientId}", message.PatientId);
    }
}
