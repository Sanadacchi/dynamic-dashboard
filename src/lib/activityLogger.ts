import { supabase } from './supabase';

export type ActivityAction = 
  | 'TASK_CREATED' 
  | 'TASK_MOVED' 
  | 'TASK_DONE' 
  | 'DOC_UPLOADED' 
  | 'SOCIAL_POST' 
  | 'SOCIAL_LIKE' 
  | 'SOCIAL_COMMENT'
  | 'BLOCKER_ESCALATED'
  | 'EOD_SUBMITTED';

export const ACTION_POINTS: Record<ActivityAction, number> = {
  TASK_CREATED: 2,
  TASK_MOVED: 3,
  TASK_DONE: 6,
  DOC_UPLOADED: 4,
  SOCIAL_POST: 5,
  SOCIAL_LIKE: 1,
  SOCIAL_COMMENT: 2,
  BLOCKER_ESCALATED: 3,
  EOD_SUBMITTED: 5
};

export const logActivity = async (tenantId: number, userId: number | undefined, action: ActivityAction) => {
  if (!tenantId) return;
  
  try {
    // Fire and forget, don't await the promise here to avoid blocking UI
    supabase
      .from('activity_log')
      .insert([{
        tenant_id: tenantId,
        user_id: userId,
        action_type: action,
        points: ACTION_POINTS[action]
      }])
      .then(({ error }) => {
        if (error) console.warn('Activity Logging (Non-blocking) Notice:', error.message);
      });
  } catch (err) {
    // Totally silent
  }
};
