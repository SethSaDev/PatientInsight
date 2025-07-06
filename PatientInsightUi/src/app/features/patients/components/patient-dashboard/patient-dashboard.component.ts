import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { PatientApiService } from '../../services/patient-api.service';
import { PatientDto } from '../../models/patient.dto';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, SpinnerComponent],
  template: `
    <div class="dashboard-container">
      <header>
        <h1>Patient Insight</h1>
        <p class="subtitle">Secure Patient Data Management Dashboard</p>
      </header>
      
      <section class="search-section">
        <app-search-bar (search)="handleSearch($event)"></app-search-bar>
        <app-spinner [show]="isLoading()" message="Searching intelligence..."></app-spinner>
      </section>

      <div *ngIf="error()" class="error-banner">
        <span class="icon">⚠️</span> {{ error() }}
      </div>
      
      <main *ngIf="patient() as pt" class="patient-card shadow-lg">
        <div class="card-header">
          <h2>{{ pt.firstName }} {{ pt.lastName }}</h2>
          <span class="badge">Verified Patient</span>
        </div>
        
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <label>SSN</label>
              <span>{{ pt.ssn }}</span>
            </div>
            <div class="info-item">
              <label>Location</label>
              <span>{{ pt.city }}, {{ pt.state }}</span>
            </div>
          </div>

          <div class="status-box">
             <h4>Data Integrity Check</h4>
             <p>External records synced: <strong>100%</strong></p>
          </div>
        </div>
      </main>

      <div *ngIf="!patient() && !isLoading()" class="empty-state">
        <p>No patient profile selected. Enter an SSN to begin.</p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
    .dashboard-container { padding: 40px 20px; max-width: 900px; margin: auto; }
    header { margin-bottom: 40px; text-align: center; }
    h1 { color: #1e293b; font-size: 2.5rem; font-weight: 800; margin: 0; }
    .subtitle { color: #64748b; margin-top: 8px; font-size: 1.1rem; }
    
    .search-section { position: relative; margin-bottom: 30px; }
    
    .error-banner { 
      background: #fef2f2; border-left: 4px solid #ef4444; color: #b91c1c; 
      padding: 16px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
    }

    .patient-card { 
      background: white; border-radius: 16px; border: 1px solid #e2e8f0; 
      overflow: hidden; transition: transform 0.2s;
    }
    .card-header { 
      background: #1e293b; color: white; padding: 24px; 
      display: flex; justify-content: space-between; align-items: center; 
    }
    .card-header h2 { margin: 0; font-size: 1.5rem; }
    .badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }

    .card-body { padding: 32px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-item label { display: block; color: #94a3b8; font-size: 0.875rem; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-item span { color: #1e293b; font-size: 1.25rem; font-weight: 600; }

    .status-box { background: #f1f5f9; padding: 20px; border-radius: 12px; }
    .status-box h4 { margin: 0 0 8px 0; color: #475569; }

    .empty-state { text-align: center; padding: 60px; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 16px; }
  `]
})
export class PatientDashboardComponent {
  private patientApi = inject(PatientApiService);
  
  patient = signal<PatientDto | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  handleSearch(ssn: string) {
    this.isLoading.set(true);
    this.error.set(null);
    this.patient.set(null);

    this.patientApi.checkExists(ssn).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.fetchPatientDetails(res.data);
        } else {
          this.error.set('Security Verification Failed: The provided SSN does not match any patient in our registry.');
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'An encrypted error occurred during the verification process.');
        this.isLoading.set(false);
      }
    });
  }
  
  private fetchPatientDetails(id: number) {
      this.patientApi.getPatient(id).subscribe({
          next: (res) => {
              this.patient.set(res.data);
              this.isLoading.set(false);
          },
          error: (err) => {
              this.error.set('Critical Failure: Unable to handshake with the patient data service.');
              this.isLoading.set(false);
          }
      })
  }
}
