// /course/constants/courseEnum.ts
export const courseClassTypeValues = ['KEDAMAY', 'KALEAY', 'SALSAY', 'RABEAY', 'KEREMT'] as const;
export type courseClassType = (typeof courseClassTypeValues)[number];

export const enrollmentStatusValues = ['ACTIVE', 'PENDING', 'WITHDREW', 'CANCELLED'] as const;
export type enrollmentStatus = (typeof enrollmentStatusValues)[number];

// Course class type display names
export const courseClassTypeDisplayNames: Record<courseClassType, string> = {
  KEDAMAY: 'Kedamay',
  KALEAY: 'Kale\'ay',
  SALSAY: 'Salsay',
  RABEAY: 'Rabe\'ay',
  KEREMT: 'Keremt',
};

// Enrollment status display names
export const enrollmentStatusDisplayNames: Record<enrollmentStatus, string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  WITHDREW: 'Withdrew',
  CANCELLED: 'Cancelled',
};
