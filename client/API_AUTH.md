# PainPal API Authentication

## Hardcoded Test Credentials

For development and testing, use these credentials:

### Doctor Login
```
Email: doctor@painpal.com
Password: Doctor@123
Role: DOCTOR
```

### Patient Login
```
Email: patient@painpal.com
Password: Patient@123
Role: PATIENT
```

### Admin Login
```
Email: admin@painpal.com
Password: Admin@123
Role: ADMIN
```

## API Usage Examples

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@painpal.com",
    "password": "Doctor@123"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "doctor-001",
    "email": "doctor@painpal.com",
    "role": "DOCTOR",
    "name": "Dr. John Smith"
  }
}
```

### 2. Access Protected Routes

Use the token in the Authorization header:

```bash
# Get all doctor profiles (requires ADMIN or DOCTOR role)
curl -X GET http://localhost:3000/api/doctors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get all patients (requires ADMIN, DOCTOR, or PATIENT role)
curl -X GET http://localhost:3000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create migraine event (requires ADMIN or PATIENT role)
curl -X POST http://localhost:3000/api/migraine-events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "startDatetime": "2026-01-12T10:00:00Z",
    "severity": 7,
    "symptomsLog": "Throbbing pain, light sensitivity",
    "perceivedTriggers": "Stress, lack of sleep"
  }'
```

## Route Permissions

### Doctor Routes (`/api/doctors`)
- **GET**: ADMIN, DOCTOR
- **POST**: ADMIN only
- **PUT/PATCH**: ADMIN, DOCTOR
- **DELETE**: ADMIN only

### Patient Routes (`/api/patients`)
- **GET**: ADMIN, DOCTOR, PATIENT
- **POST**: ADMIN only
- **PUT/PATCH**: ADMIN, PATIENT
- **DELETE**: ADMIN only

### Migraine Events (`/api/migraine-events`)
- **GET**: ADMIN, DOCTOR, PATIENT
- **POST/PUT/PATCH/DELETE**: ADMIN, PATIENT

### Medication Logs (`/api/medication-logs`)
- **GET**: ADMIN, DOCTOR, PATIENT
- **POST/PUT/PATCH/DELETE**: ADMIN, PATIENT

### Patient-Doctor Links (`/api/patient-doctor-links`)
- **All methods**: ADMIN, DOCTOR

### Summaries (`/api/summaries`)
- **All methods**: ADMIN, DOCTOR

### Insights (`/api/insights`)
- **GET**: ADMIN, DOCTOR, PATIENT
- **POST/PUT/PATCH/DELETE**: ADMIN, DOCTOR

### Clinics (`/api/clinics`)
- **GET**: ADMIN, DOCTOR, PATIENT
- **POST/PUT/PATCH/DELETE**: ADMIN only

### Users (`/api/users`)
- **GET**: ADMIN, DOCTOR, PATIENT
- **POST/PUT/PATCH/DELETE**: ADMIN only
