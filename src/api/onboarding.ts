import client from './client';
import { OnboardingAnswers, OnboardingResponse } from '../types/onboarding';

export async function submitOnboarding(answers: OnboardingAnswers): Promise<OnboardingResponse> {
  const { data } = await client.post('/onboarding/submit', answers);
  return data;
}
