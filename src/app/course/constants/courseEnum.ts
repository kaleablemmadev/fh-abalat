// /course/constants/courseEnum.ts
export const courseClassTypeValues = ['KEDAMAY', 'KALEAY', 'SALSAY', 'RABEAY', 'KEREMT'] as const;
export type courseClassType = (typeof courseClassTypeValues)[number];

export const enrollmentStatusValues = ['ACTIVE', 'PENDING', 'WITHDREW', 'CANCELLED'] as const;
export type enrollmentStatus = (typeof enrollmentStatusValues)[number];

// Course class type display names
export const courseClassTypeDisplayNames: Record<courseClassType, string> = {
  KEDAMAY: 'ቀዳማይ',
  KALEAY: 'ካልዓይ',
  SALSAY: 'ሣልሳይ',
  RABEAY: 'ራብዓይ',
  KEREMT: 'ክረምት ቀዳማይ',
};

export const courseClassList: Record<string, string> = {
  "KEDAMAY": 'ቀዳማይ',
  "KALEAY": 'ካልዓይ',
  "SALSAY": 'ሣልሳይ',
  "RABEAY": 'ራብዓይ',
  "KEREMT": 'ክረምት ቀዳማይ',
};

// Enrollment status display names
export const enrollmentStatusDisplayNames: Record<enrollmentStatus, string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  WITHDREW: 'Withdrew',
  CANCELLED: 'Cancelled',
};
