export const userTypeValues = ['ADMIN', 'MEMBER', 'SUPERADMIN'] as const;
export type userType = (typeof userTypeValues)[number];

export const genderTypeValues = ['MALE', 'FEMALE'] as const;
export type genderType = (typeof genderTypeValues)[number];

export const memberTypeValues = ['COURSE_STUDENT', 'REGULAR_MEMBER', 'YOUTH_STUDENT'] as const;
export type memberType = (typeof memberTypeValues)[number];