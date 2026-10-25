'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { touchUserStreak } from '@/lib/actions/dashboard';
import type { DifficultyLevel, InterviewTrack } from '@/types/database';

export async function createInterviewQuestion(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const teamId = String(formData.get('teamId') ?? '');
  const track = (formData.get('track') as InterviewTrack) || 'palantir';
  const topic = String(formData.get('topic') ?? '').trim();
  const difficulty =
    (formData.get('difficulty') as DifficultyLevel) || 'medium';
  const questionText = String(formData.get('questionText') ?? '').trim();
  const checklistRaw = String(formData.get('checklistRaw') ?? '').trim();

  if (!questionText || !topic || !teamId) {
    return { error: 'Question text and topic are required.' };
  }

  const review_checklist = checklistRaw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const { error } = await supabase.from('interview_questions').insert({
    team_id: teamId,
    track,
    topic,
    difficulty,
    question_text: questionText,
    review_checklist:
      review_checklist.length > 0
        ? review_checklist
        : [
            'Did you clarify ambiguous constraints before jumping into architecture?',
            'Did you isolate failure domains and propose concrete metrics?',
            'Did you connect technical decisions to customer/operational impact?',
          ],
  });

  if (error) return { error: error.message };

  revalidatePath('/interviews');
  return { success: true };
}

export async function saveQuestionAttempt(
  questionId: string,
  answerText: string,
  confidenceRating: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Spaced-repetition calculation based on confidence (1-5)
  const daysToAdd =
    confidenceRating <= 2 ? 2 : confidenceRating === 3 ? 5 : 14;
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + daysToAdd);
  const nextReviewDateStr = nextReview.toISOString().split('T')[0];

  const { error } = await supabase.from('question_attempts').upsert(
    {
      question_id: questionId,
      user_id: user.id,
      answer_text: answerText,
      confidence_rating: confidenceRating,
      last_reviewed_at: new Date().toISOString(),
      next_review_date: nextReviewDateStr,
    },
    { onConflict: 'question_id,user_id' }
  );

  if (error) return { error: error.message };

  await touchUserStreak();
  revalidatePath('/interviews');
  revalidatePath('/');
  return { success: true };
}

export async function submitPeerFeedback(
  attemptId: string,
  peerFeedback: string,
  confidenceRating?: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const payload: {
    peer_reviewer_id: string;
    peer_feedback: string;
    confidence_rating?: number;
  } = {
    peer_reviewer_id: user.id,
    peer_feedback: peerFeedback.trim(),
  };

  if (confidenceRating !== undefined && !Number.isNaN(confidenceRating)) {
    payload.confidence_rating = confidenceRating;
  }

  const { error } = await supabase
    .from('question_attempts')
    .update(payload)
    .eq('id', attemptId);

  if (error) return { error: error.message };

  await touchUserStreak();
  revalidatePath('/interviews');
  return { success: true };
}

export async function createMockInterview(formData: FormData) {
  const supabase = await createClient();
  const teamId = String(formData.get('teamId') ?? '');
  const interviewerId = String(formData.get('interviewerId') ?? '');
  const candidateId = String(formData.get('candidateId') ?? '');
  const track = (formData.get('track') as InterviewTrack) || 'palantir';
  const interviewType = String(formData.get('interviewType') ?? 'Decomposition');
  const scheduledAt = String(formData.get('scheduledAt') ?? '');

  if (!teamId || !interviewerId || !candidateId || !scheduledAt) {
    return { error: 'All scheduling fields are required.' };
  }

  const { error } = await supabase.from('mock_interviews').insert({
    team_id: teamId,
    interviewer_id: interviewerId,
    candidate_id: candidateId,
    track,
    interview_type: interviewType,
    scheduled_at: new Date(scheduledAt).toISOString(),
    status: 'scheduled',
  });

  if (error) return { error: error.message };

  revalidatePath('/interviews');
  revalidatePath('/');
  return { success: true };
}

export async function gradeMockInterview(formData: FormData) {
  const supabase = await createClient();

  const mockId = String(formData.get('mockId') ?? '');
  const scoreDecomposition = Number(formData.get('scoreDecomposition') ?? 3);
  const scoreTechnical = Number(formData.get('scoreTechnical') ?? 3);
  const scoreCommunication = Number(formData.get('scoreCommunication') ?? 3);
  const scoreCustomer = Number(formData.get('scoreCustomer') ?? 3);

  const strengths = String(formData.get('strengths') ?? '').trim();
  const improvements = String(formData.get('improvements') ?? '').trim();
  const followUpTasks = String(formData.get('followUpTasks') ?? '').trim();

  const overallScore = Math.round(
    (scoreDecomposition +
      scoreTechnical +
      scoreCommunication +
      scoreCustomer) /
      4
  );

  const { error } = await supabase
    .from('mock_interviews')
    .update({
      status: 'completed',
      overall_score: overallScore,
      rubric_scores: {
        problem_decomposition: scoreDecomposition,
        technical_depth: scoreTechnical,
        communication_clarity: scoreCommunication,
        customer_orientation: scoreCustomer,
      },
      strengths: strengths || null,
      improvements: improvements || null,
      follow_up_tasks: followUpTasks || null,
    })
    .eq('id', mockId);

  if (error) return { error: error.message };

  await touchUserStreak();
  revalidatePath('/interviews');
  revalidatePath('/');
  return { success: true };
}
