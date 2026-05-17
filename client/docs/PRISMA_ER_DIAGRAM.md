# Entity–Relationship diagram (from `prisma/schema.prisma`)

This document mirrors the **Prisma / MongoDB** schema. Notation: **crow’s foot** (Mermaid `erDiagram`), suitable for GitHub, VS Code, and export to PNG via [Mermaid Live](https://mermaid.live).

**Compared to a classic Chen diagram (your reference):**

| Reference image | This codebase |
|-----------------|---------------|
| `Patient` | `PatientProfile` (1:1 with `User` when role is PATIENT) |
| `Doctor` | `DoctorProfile` (1:1 with `User` when role is DOCTOR) + `Clinic` |
| `SymptomLog` + 1:1 `Migraine_event` | **Single** `MigraineEvent` (symptom dimensions + `detectedSymptoms` on the same row) |
| `Lifestyle_log` | **Not** a separate table (could be added later) |
| `Environment_data` | **Not** a separate table (`PatientMriScan` covers device-uploaded context; weather etc. not modeled) |
| Patient ↔ Doctor M:N | `PatientDoctorLink` (explicit junction) |

---

## Full ER diagram (Mermaid)

```mermaid
erDiagram
  User ||--o| PatientProfile : "userId"
  User ||--o| DoctorProfile : "userId"

  Clinic ||--o{ DoctorProfile : "clinicId"

  PatientProfile }o--o{ DoctorProfile : "PatientDoctorLink"
  PatientDoctorLink }o--|| PatientProfile : "patientId"
  PatientDoctorLink }o--|| DoctorProfile : "doctorId"

  PatientProfile ||--o{ MigraineEvent : "patientId"
  PatientProfile ||--o{ MedicationLog : "patientId"
  PatientProfile ||--o{ MedicationGroup : "patientId"
  PatientProfile ||--o{ AIDiagnosticInsight : "patientId"
  PatientProfile ||--o{ DoctorPatientSummary : "patientId"
  PatientProfile ||--o{ Appointment : "patientId"
  PatientProfile ||--o{ ClinicalNote : "patientId"
  PatientProfile ||--o{ Communication : "patientId"
  PatientProfile ||--o{ Conversation : "patientId"
  PatientProfile ||--o{ PatientMriScan : "patientId"

  DoctorProfile ||--o{ PatientDoctorLink : "doctorId"
  DoctorProfile ||--o{ DoctorPatientSummary : "doctorId"
  DoctorProfile ||--o{ Appointment : "doctorId"
  DoctorProfile ||--o{ MedicationGroup : "doctorId"
  DoctorProfile ||--o{ ClinicalNote : "doctorId"
  DoctorProfile ||--o{ Communication : "doctorId"
  DoctorProfile ||--o{ Conversation : "doctorId"
  DoctorProfile ||--o{ AppointmentFile : "doctorId"

  MedicationGroup ||--o{ MigraineEvent : "medicationGroupId"
  MedicationGroup ||--o{ MedicationLog : "medicationGroupId"

  Appointment ||--o{ ClinicalNote : "appointmentId"
  Appointment ||--o{ Communication : "appointmentId"
  Appointment ||--o{ AppointmentFile : "appointmentId"

  Conversation ||--o{ ChatMessage : "conversationId"

  User {
    string id
    string email
    string passwordHash
    string role
    datetime createdAt
    string googleId
    string googleEmail
    string googleRefreshToken
  }

  Clinic {
    string id
    string name
    string address
    string ehrSystemEndpoint
  }

  DoctorProfile {
    string id
    string userId
    string name
    string specialization
    string clinicId
  }

  PatientProfile {
    string id
    string userId
    string name
    datetime dob
    string gender
    string phone
    string email
    string address
    string condition
    string ehrRecordId
    datetime createdAt
  }

  PatientDoctorLink {
    string id
    string doctorId
    string patientId
    string linkStatus
    datetime createdAt
  }

  MigraineEvent {
    string id
    string patientId
    datetime startDatetime
    int severity
    string duration
    string episodeNotes
    string medicationsDuringEpisode
    string detectedSymptomsCsv
    int trainingAge
    int trainingDuration
    int nausea
    int photophobia
    string perceivedTriggers
    string medicationGroupId
    string effectiveness
    string migraineType
    datetime createdAt
  }

  MedicationLog {
    string id
    string patientId
    string medicationGroupId
    string medicationName
    string medicationType
    datetime datetimeTaken
    string dosage
    string frequency
    float adherenceRate
    datetime createdAt
  }

  MedicationGroup {
    string id
    string patientId
    string doctorId
    string name
    string description
    string groupType
    string medicationsCsv
    string medicationScheduleJson
    string color
    boolean isActive
    float adherenceRate
    datetime createdAt
    datetime updatedAt
  }

  AIDiagnosticInsight {
    string id
    string patientId
    datetime createdDatetime
    string migraineType
    float migraineTypeConfidence
    float diagnosticProbability
    string riskAlertLevel
    string keyContributorsCsv
    string detectedSymptomsCsv
    string modelName
    string modelVersion
  }

  DoctorPatientSummary {
    string id
    string patientId
    string doctorId
    datetime generatedDate
    string summaryType
    string structuredSummaryText
    float avgFrequency
    float avgSeverity
    float adherenceScore
    string treatmentOutcomeAnalysis
  }

  Appointment {
    string id
    string patientId
    string doctorId
    datetime appointmentDate
    string appointmentType
    string status
    boolean patientPresent
    string notes
    datetime createdAt
  }

  AppointmentFile {
    string id
    string appointmentId
    string doctorId
    string title
    string fileUrl
    string fileName
    string mimeType
    datetime createdAt
  }

  ClinicalNote {
    string id
    string patientId
    string doctorId
    string appointmentId
    string noteContent
    datetime createdAt
    datetime updatedAt
  }

  Communication {
    string id
    string patientId
    string doctorId
    string appointmentId
    string communicationType
    string message
    string channel
    datetime createdAt
  }

  Conversation {
    string id
    string doctorId
    string patientId
    datetime createdAt
    datetime updatedAt
  }

  ChatMessage {
    string id
    string conversationId
    string senderRole
    string senderUserId
    string content
    datetime createdAt
    datetime readAt
  }

  PatientMriScan {
    string id
    string patientId
    string originalFileName
    string mimeType
    int fileSizeBytes
    string prediction
    float confidence
    string modelLabel
    datetime createdAt
  }
```

---

## Enum reference (not shown as entities)

- `Role`: ADMIN, PATIENT, DOCTOR  
- `LinkStatus`: PENDING, ACTIVE, REVOKED  
- `MedicationType`: PREVENTIVE, RESCUE  
- `SummaryType`: WEEKLY, MONTHLY  
- `RiskAlertLevel`: NONE, MEDIUM, HIGH  
- `AppointmentStatus`: SCHEDULED, COMPLETED, CANCELLED  
- `MedicationEffectiveness`: LOW, MODERATE, HIGH  
- `ChatSenderRole`: DOCTOR, PATIENT  
- `MigraineTypeClassification`: (see schema)

---

## Open in Draw.io (Chen-style subset)

For a diagram closer to your coursework image (entities + relationship diamonds), open:

`docs/PRISMA_ER_CHEN_OVERVIEW.drawio`

in [diagrams.net](https://app.diagrams.net/) and extend with attribute ovals as needed.
