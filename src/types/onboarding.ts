export interface OnboardingAnswers {
  houseType: 'solo' | 'family' | 'shared' | 'dorm' | null;
  roomType: 'oneroom' | 'multiroom' | 'officetel' | 'other' | null;
  hasPet: boolean | null;
  petType: 'dog' | 'cat' | 'other' | null;
  cookingFrequency: 'rarely' | 'sometimes' | 'often' | 'daily' | null;
  cleaningFrequency: 1 | 2 | 3 | 4 | null;
  cleaningStyle: 1 | 2 | null;
  procrastination: 1 | 2 | 3 | 4 | null;
  difficulties: string[];
}

export interface PersonalityResult {
  title: string;
  description: string;
  recommendation: string;
  tips: string[];
}

export interface OnboardingResponse {
  message: string;
  personality: PersonalityResult;
  routine: {
    id: string;
    weeklyRoutine: any[];
  };
}
