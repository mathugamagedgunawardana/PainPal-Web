# Project-wide class / component diagram

This document describes the **FYP workspace**: the **Painpal** Flutter app (`painpal/`), the **LLM** stack (`LLM/client` Next.js + Prisma, `LLM/model` Python API), and how they connect.  
Diagrams use [Mermaid](https://mermaid.js.org/) `classDiagram` notation (UML-like). TypeScript “classes” are mostly **modules** and **React components**—shown as `<<component>>` / `<<module>>` where there is no `class` keyword.

**Repos**

| Path | Role |
|------|------|
| `painpal/lib/**` | Flutter UI, services, local DB, API DTOs |
| `LLM/client/**` | Next.js 16 App Router, REST `/api/*`, Prisma |
| `LLM/model/**` | FastAPI migraine/MRI inference (optional; `MODEL_API_URL`) |

---

## 1. System context (applications and backends)

```mermaid
classDiagram
  direction LR
  class PainpalFlutter <<Flutter app>> {
    +main()
    +HTTP to Next.js
  }
  class NextJsServer <<Next.js>> {
    +App Router
    +Route Handlers /api/*
  }
  class PrismaORM <<Prisma>> {
    +PrismaClient
  }
  class MongoDB <<database>>
  class PythonModelAPI <<FastAPI>> {
    +model/main.py
    +predict endpoints
  }
  class GoogleGemini <<external>> {
    +from mobile .env
  }

  PainpalFlutter --> NextJsServer : REST + Bearer JWT
  NextJsServer --> PrismaORM
  PrismaORM --> MongoDB
  NextJsServer ..> PythonModelAPI : MODEL_API_URL (optional)
  PainpalFlutter ..> GoogleGemini : Gemini SDK (AI chat)
```

---

## 2. Painpal (Flutter) — presentation & shell

```mermaid
classDiagram
  direction TB
  class PainpalApp <<Widget>>
  class SessionShell <<StatefulWidget>>
  class HomeScreen <<StatefulWidget>>
  class LogAttackScreen <<StatefulWidget>>
  class AnalyticsScreen <<StatefulWidget>>
  class MigraineFormScreen <<StatefulWidget>>
  class MriUploadScreen <<StatefulWidget>>
  class HistoryScreen <<StatefulWidget>>
  class SettingsScreen <<StatefulWidget>>
  class LoginScreen <<StatefulWidget>>
  class LandingScreen <<StatelessWidget>>
  class ChatDialog <<StatefulWidget>>

  PainpalApp --> SessionShell : routes
  SessionShell --> HomeScreen : tab shell
  SessionShell --> LoginScreen
  HomeScreen --> LogAttackScreen
  HomeScreen --> AnalyticsScreen
  HomeScreen --> MigraineFormScreen
  HomeScreen --> HistoryScreen
  HomeScreen --> MriUploadScreen
  HomeScreen --> SettingsScreen
  HomeScreen --> ChatDialog : FAB / overlay
```

---

## 3. Painpal (Flutter) — services, persistence, API models

```mermaid
classDiagram
  direction TB
  class AppServices <<singleton>> {
    +AuthService auth
  }
  class AuthService <<service>> {
    +User? currentUser
    +login register refreshToken
    +resolveApiBaseUrl()
  }
  class SettingsStorage <<dao>> {
    +readBaseUrl()
  }
  class BackendConfig <<static>> {
    +endpoints const
  }
  class PainpalDatabase <<singleton>> {
    +sqflite local history
    +AI chat persistence
  }
  class ApiClient <<http>> {
    +post get
  }
  class PatientDataService <<service>> {
    +sync migraine / MRI
  }
  class GeminiAiService <<service>> {
    +sendMessage()
  }
  class VoiceAgentService <<service>> {
    +MethodChannel speech
    +speak() TTS
  }
  class MedicationReminderService <<singleton>> {
    +local notifications
    +syncWithBackend()
  }
  class DoctorPatientChatApi <<service>> {
    +list conversations messages
  }

  class User <<dto>>
  class PatientProfile <<dto>>
  class DoctorProfile <<dto>>
  class LoginResponse <<dto>>
  class MigraineAttack <<model>>
  class MriScan <<model>>
  class PatientAnalyticsData <<dto>>
  class PatientNextAttackData <<dto>>

  AppServices --> AuthService
  AuthService --> SettingsStorage
  AuthService --> BackendConfig
  AuthService ..> User : holds
  AuthService ..> PatientProfile
  PatientDataService --> ApiClient
  PatientDataService --> BackendConfig
  GeminiAiService ..> PainpalDatabase : optional persist
  VoiceAgentService ..> AppServices : reads auth
  MedicationReminderService ..> AuthService : schedule GET
  DoctorPatientChatApi ..> BackendConfig

  LoginScreen ..> AuthService
  LogAttackScreen ..> AuthService
  LogAttackScreen ..> PatientAnalyticsData : fetch DTOs
  MigraineFormScreen ..> MigraineAttack
  MriUploadScreen ..> MriScan
  HistoryScreen ..> PainpalDatabase
  ChatDialog ..> GeminiAiService
  ChatDialog ..> VoiceAgentService
```

> **Note:** `lib/data/patient_remote_api.dart` and `patient_analytics_api.dart` expose **top-level functions** (not classes)—they sit alongside `PatientAnalyticsData` and call `BackendConfig` + `http`.

---

## 4. LLM/client (Next.js) — boundary, auth, doctor/patient features

React files are **components** (functions), not ES6 classes—shown as `<<route>>` / `<<component>>`.

```mermaid
classDiagram
  direction TB

  class ApiAuthRoutes <<route>> {
    +/api/auth/*
  }
  class ApiPatientRoutes <<route>> {
    +/api/patient/*
  }
  class ApiDoctorPatientRoutes <<route>> {
    +/api/patients/[id]/*
  }
  class ApiChatRoutes <<route>> {
    +/api/chat/*
  }
  class ApiSummaryMri <<route>> {
    +/api/summary
    +/api/mri/predict
  }

  class MiddlewareAuth <<module>> {
    +authenticateRequest()
    +requireRole()
  }
  class JwtLib <<module>> {
    +signToken verifyToken
    +setAuthCookie
  }
  class PasswordLib <<module>> {
    +comparePassword hashPassword
  }
  class AssertDoctorAccess <<module>> {
    +assertDoctorPatientAccess()
  }
  class MigraineModelRecords <<module>> {
    +fetchNextAttackPredictionWithReason()
    +migraineEventsToModelRecords()
  }
  class SyncSeedPredictions <<module>> {
    +triggerSeedPredictionSync()
  }

  class PrismaClientProxy <<Prisma>> {
    +global singleton
  }

  class AppointmentsTab <<component>>
  class MedicationsTab <<component>>
  class ChatPanel <<component>>
  class PatientAnalyticsPage <<component>>

  ApiAuthRoutes --> JwtLib
  ApiAuthRoutes --> PasswordLib
  ApiPatientRoutes --> MiddlewareAuth
  ApiPatientRoutes --> PrismaClientProxy
  ApiDoctorPatientRoutes --> MiddlewareAuth
  ApiDoctorPatientRoutes --> AssertDoctorAccess
  ApiDoctorPatientRoutes --> PrismaClientProxy
  ApiDoctorPatientRoutes ..> MigraineModelRecords : analytics
  ApiDoctorPatientRoutes ..> SyncSeedPredictions : on login seed
  ApiChatRoutes --> PrismaClientProxy
  ApiSummaryMri --> PrismaClientProxy

  AppointmentsTab ..> ApiDoctorPatientRoutes : fetch client
  MedicationsTab ..> ApiDoctorPatientRoutes
  ChatPanel ..> ApiChatRoutes
  PatientAnalyticsPage ..> ApiDoctorPatientRoutes
```

---

## 5. Prisma domain (MongoDB document models)

Maps 1:1 to `LLM/client/prisma/schema.prisma` **model** blocks (ORM entities, not Dart/TS classes).

```mermaid
classDiagram
  direction LR
  class User
  class PatientProfile
  class DoctorProfile
  class Clinic
  class PatientDoctorLink
  class MigraineEvent
  class MedicationLog
  class MedicationGroup
  class AIDiagnosticInsight
  class DoctorPatientSummary
  class Appointment
  class AppointmentFile
  class ClinicalNote
  class Communication
  class Conversation
  class ChatMessage
  class PatientMriScan

  User ||--o| PatientProfile
  User ||--o| DoctorProfile
  DoctorProfile }o--|| Clinic
  PatientProfile ||--o{ PatientDoctorLink
  DoctorProfile ||--o{ PatientDoctorLink
  PatientProfile ||--o{ MigraineEvent
  PatientProfile ||--o{ MedicationLog
  PatientProfile ||--o{ MedicationGroup
  PatientProfile ||--o{ AIDiagnosticInsight
  PatientProfile ||--o{ DoctorPatientSummary
  PatientProfile ||--o{ Appointment
  PatientProfile ||--o{ ClinicalNote
  PatientProfile ||--o{ Communication
  PatientProfile ||--o{ Conversation
  PatientProfile ||--o{ PatientMriScan
  DoctorProfile ||--o{ DoctorPatientSummary
  DoctorProfile ||--o{ Appointment
  DoctorProfile ||--o{ MedicationGroup
  DoctorProfile ||--o{ ClinicalNote
  DoctorProfile ||--o{ Communication
  DoctorProfile ||--o{ Conversation
  DoctorProfile ||--o{ AppointmentFile
  Appointment ||--o{ AppointmentFile
  Appointment ||--o{ ClinicalNote
  Appointment ||--o{ Communication
  MedicationGroup ||--o{ MigraineEvent
  MedicationGroup ||--o{ MedicationLog
  Conversation ||--o{ ChatMessage
```

---

## 6. LLM/model (Python) — high level

Training scripts are procedural; the **serving** surface is mainly **`model/main.py`** (FastAPI).

```mermaid
classDiagram
  direction TB
  class FastAPIApp <<FastAPI>> {
    +routes /predict/*
  }
  class NextJsMigraineBridge <<caller>> {
    +MigraineModelRecords fetch()
  }
  FastAPIApp ..> NextJsMigraineBridge : HTTP JSON records in/out
```

---

## 7. How to render / export

1. Paste any section’s ` ```mermaid ` block into [Mermaid Live Editor](https://mermaid.live) → **PNG/SVG**.
2. VS Code: Markdown preview with Mermaid support, or **Markdown Preview Mermaid Support** extension.
3. For a **single UML file** in StarUML / PlantUML: translate these groups manually, or use `mermaid-cli` (`mmdc`) in CI to emit SVG into `LLM/docs/diagrams/`.

---

## 8. Files ↔ diagram (quick index)

| Area | Representative paths |
|------|------------------------|
| Flutter entry | `painpal/lib/main.dart` |
| Flutter services | `painpal/lib/services/*.dart`, `painpal/lib/data/auth_service.dart` |
| Flutter UI | `painpal/lib/screens/*.dart`, `painpal/lib/widgets/*.dart` |
| Next API | `LLM/client/app/api/**/route.ts` |
| Shared TS lib | `LLM/client/lib/**/*.ts` |
| Prisma | `LLM/client/prisma/schema.prisma`, `LLM/client/lib/prisma.ts` |
| Python API | `LLM/model/main.py`, `LLM/model/text/*.py`, `LLM/model/image/*.py` |

If you want this committed as **`.drawio`** UML class shapes instead of Mermaid, say so and we can add a second artifact.
