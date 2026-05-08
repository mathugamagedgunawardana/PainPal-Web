import type { DoctorProfile, PatientProfile } from '@prisma/client'

/** Shape expected by the Painpal Flutter app (`auth_models.dart`). */
export function patientProfileToMobile(p: PatientProfile) {
  return {
    id: p.id,
    userId: p.userId,
    name: p.name,
    dateOfBirth: p.dob.toISOString(),
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    address: p.address,
    condition: p.condition,
    ehrRecordId: p.ehrRecordId,
    createdAt: p.createdAt.toISOString(),
  }
}

export function doctorProfileToMobile(d: DoctorProfile) {
  return {
    id: d.id,
    userId: d.userId,
    name: d.name,
    specialization: d.specialization,
    clinicId: d.clinicId,
  }
}
