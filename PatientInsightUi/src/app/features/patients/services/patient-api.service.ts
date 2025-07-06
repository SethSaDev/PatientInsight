import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { PatientDto } from '../models/patient.dto';

@Injectable({ providedIn: 'root' })
export class PatientApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/patients`;

  checkExists(ssn: string): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.baseUrl}/exists`, {
      params: new HttpParams().set('ssn', ssn)
    });
  }

  getPatient(id: number): Observable<ApiResponse<PatientDto>> {
    return this.http.get<ApiResponse<PatientDto>>(`${this.baseUrl}/${id}`);
  }

  registerPatient(patient: PatientDto): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.baseUrl, patient);
  }
}
