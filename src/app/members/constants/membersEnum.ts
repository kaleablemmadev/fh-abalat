// /members/constants/membersEnum.ts
export const userTypeValues = ['ADMIN', 'MEMBER', 'SUPERADMIN'] as const;
export type userType = (typeof userTypeValues)[number];

export const genderTypeValues = ['MALE', 'FEMALE'] as const;
export type genderType = (typeof genderTypeValues)[number];

export const memberTypeValues = ['COURSE_STUDENT', 'REGULAR_MEMBER', 'YOUTH_STUDENT'] as const;
export type memberType = (typeof memberTypeValues)[number];

// Ethiopian month names for registration date
export const ethiopianMonths: Record<number, string> = {
  1: 'መስከረም',
  2: 'ጥቅምት',
  3: 'ኅዳር',
  4: 'ታኅሣሥ',
  5: 'ጥር',
  6: 'የካቲት',
  7: 'መጋቢት',
  8: 'ሚያዚያ',
  9: 'ግንቦት',
  10: 'ሰኔ',
  11: 'ሐምሌ',
  12: 'ነሐሴ',
  13: 'ጳጉሜ',
};

export const ethiopianMonthsEnglish: Record<number, string> = {
  1: 'Meskerem',
  2: 'Tikimt',
  3: 'Hidar',
  4: 'Tahsas',
  5: 'Tir',
  6: 'Yekatit',
  7: 'Megabit',
  8: 'Miyazya',
  9: 'Ginbot',
  10: 'Sene',
  11: 'Hamle',
  12: 'Nehase',
  13: 'Pagume',
};