import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PatientApiService } from './patient-api.service';
import { environment } from '../../../../environments/environment';

describe('PatientApiService', () => {
  let service: PatientApiService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/patients`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PatientApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('passes the SSN as a query parameter when checking if a patient exists', () => {
    service.checkExists('123-45-6789').subscribe(res => expect(res.data).toBe(42));

    const req = http.expectOne(r => r.url === `${baseUrl}/exists`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('ssn')).toBe('123-45-6789');
    req.flush({ data: 42, success: true, errorMessage: null });
  });

  it('requests a single patient by id', () => {
    service.getPatient(7).subscribe(res => expect(res.success).toBeTrue());

    const req = http.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: null, success: true, errorMessage: null });
  });

  it('posts the patient payload when registering', () => {
    const patient = { firstName: 'Ada', lastName: 'Lovelace' } as any;
    service.registerPatient(patient).subscribe();

    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(patient);
    req.flush({ data: 1, success: true, errorMessage: null });
  });
});
