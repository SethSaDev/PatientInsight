using PatientInsight.Api.Consumers;
using PatientInsight.Api.Middleware;
using PatientInsight.Api.Validators;
using PatientInsight.Core.Interfaces;
using PatientInsight.Core.Services;
using PatientInsight.Infrastructure.Interfaces;
using PatientInsight.Infrastructure.Persistence;
using PatientInsight.Infrastructure.Repositories;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Validation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<PatientDtoValidator>();

// AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("ConnString")));

// HttpClient registrations
builder.Services.AddHttpClient<IPatientService, PatientService>();
builder.Services.AddHttpClient<IAuthService, AuthService>();

// Repositories
builder.Services.AddScoped<IPatientRepository, PatientRepository>();

// Message Bus
builder.Services.AddMassTransit(bcfg =>
{
    bcfg.SetKebabCaseEndpointNameFormatter();
    bcfg.AddConsumer<PatientDataIngestConsumer>();

    bcfg.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(new Uri(builder.Configuration["ServiceBus:Host"]!), h =>
        {
            h.Username(builder.Configuration["ServiceBus:User"] ?? "guest");
            h.Password(builder.Configuration["ServiceBus:Password"] ?? "guest");
        });

        cfg.ReceiveEndpoint("patient-data-ingest-queue", e =>
        {
            e.ConfigureConsumer<PatientDataIngestConsumer>(context);
            e.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(10)));
        });
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseCors(policy => policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
app.UseAuthorization();
app.MapControllers();

app.Run();
