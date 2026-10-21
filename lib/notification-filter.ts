import { AppNotification } from '@/store/useNotificationStore';
import { User } from '@/types';

/**
 * Strict Access Control for Notifications:
 * "if mathan mk completd task, notify admin, tl, only that mem, dont notify others"
 *
 * Rules:
 * 1. Chat Messages:
 *    - Never show to the sender.
 *    - If targetTeam specified and user not Admin and not in that team: hide.
 *    - If DM channel and user is not one of the DM participants: hide.
 *
 * 2. Task Completed / Review / Approval / Status Done:
 *    - Notify Admin: Super Admin & Admin always receive this.
 *    - Notify TL: Team Lead always receives this.
 *    - Notify Only That Member: The member assigned to this task or who completed it receives this.
 *    - Don't Notify Others: All other team members/roles MUST NOT receive or hear this notification!
 *
 * 3. Task Assignment / Redirection:
 *    - Notify Admin & TL.
 *    - Notify Only That Member who was assigned/redirected.
 *    - Other members do not receive it.
 *
 * 4. Self Reminders:
 *    - Only the user whose self reminder it is (and admin) receives it.
 *
 * 5. General / System / Reimbursement:
 *    - If targetRoles specified: check if user matches role or is sender.
 *    - If targetUserIds specified: check if user id is included.
 */
export function isNotificationVisibleForUser(
  n: AppNotification | null | undefined,
  currentUser: User | null | undefined
): boolean {
  if (!n) return false;
  if (!currentUser) return true;

  const isAdminUser = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';
  const isTeamLead = currentUser.role === 'Team Lead';
  const currentNameNorm = currentUser.name?.trim().toLowerCase() || '';
  const currentId = currentUser._id;
  const currentEmail = currentUser.email?.trim().toLowerCase() || '';

  // 1. Chat Messages
  if (n.type === 'chat_message') {
    if (n.senderName && n.senderName.trim().toLowerCase() === currentNameNorm) return false;

    // Targeted mention or reply notification: notify target users (and admin)
    if (Array.isArray(n.targetUserNames) && n.targetUserNames.length > 0) {
      if (isAdminUser) return true;
      return n.targetUserNames.some((un) => un?.trim().toLowerCase() === currentNameNorm);
    }
    if (Array.isArray(n.targetUserIds) && n.targetUserIds.length > 0) {
      if (isAdminUser) return true;
      return n.targetUserIds.includes(currentId);
    }

    if (n.targetTeam && !isAdminUser && currentUser.team !== n.targetTeam) return false;
    if (n.channelId && n.channelId.startsWith('dm_') && !n.channelId.includes(currentId)) {
      return false;
    }
    return true;
  }

  // 2. Self Reminders: only the owner (and admin) sees it
  if (
    n.category === 'Self Reminder Completed' ||
    n.category === 'Self Reminder' ||
    n.link === '/self-reminders'
  ) {
    if (isAdminUser) return true;
    if (n.assignedUserId && n.assignedUserId === currentId) return true;
    if (Array.isArray(n.targetUserIds) && n.targetUserIds.includes(currentId)) return true;
    if (n.text && currentNameNorm && n.text.toLowerCase().includes(currentNameNorm)) return true;
    return false;
  }

  // 3. Task Completed / Review / Approval Notifications
  // Prompt: "if mathan mk completd task, notify admin, tl, only that mem, dont notify others"
  const isTaskCompletionOrReview =
    n.type === 'task_completed' ||
    n.category === 'Task Completed' ||
    n.type === 'task_approval' ||
    n.category === 'Task Approved' ||
    n.type === 'review_assigned' ||
    n.category === 'Reviewer Assignment' ||
    (n.category && n.category.toLowerCase().includes('completed')) ||
    (n.title &&
      (n.title.toLowerCase().includes('completed') ||
        n.title.toLowerCase().includes('done') ||
        n.title.toLowerCase().includes('approved')));

  if (isTaskCompletionOrReview) {
    // 1. Always notify Admin (Super Admin & Admin)
    if (isAdminUser) return true;

    // 2. Always notify Team Lead (TL)
    if (isTeamLead) return true;

    // 3. Notify ONLY THAT MEMBER (assigned user, completer, or sender)
    const isAssignedMember =
      (n.assignedUserId && n.assignedUserId === currentId) ||
      (n.assignedUserName && n.assignedUserName.trim().toLowerCase() === currentNameNorm);

    const isCompleterMember =
      (n.completedByUserId && n.completedByUserId === currentId) ||
      (n.completedByName && n.completedByName.trim().toLowerCase() === currentNameNorm);

    const isDirectTarget =
      (Array.isArray(n.targetUserIds) && n.targetUserIds.includes(currentId)) ||
      (Array.isArray(n.targetUserNames) &&
        n.targetUserNames.some((un) => un?.trim().toLowerCase() === currentNameNorm));

    const isSenderMember =
      n.senderName && n.senderName.trim().toLowerCase() === currentNameNorm;

    const isMentionedInText =
      currentNameNorm.length > 2 && n.text && n.text.toLowerCase().includes(currentNameNorm);

    // Special match for Mathan MK (case variations, spacing)
    const isMathanMkMatch =
      (currentEmail === 'mathanmk@ambizcon.com' ||
        currentNameNorm === 'mathanmk' ||
        currentNameNorm === 'mathan mk' ||
        currentNameNorm.includes('mathanmk')) &&
      ((n.assignedUserName && n.assignedUserName.toLowerCase().includes('mathan')) ||
        (n.completedByName && n.completedByName.toLowerCase().includes('mathan')) ||
        (n.text && n.text.toLowerCase().includes('mathan')));

    if (
      isAssignedMember ||
      isCompleterMember ||
      isDirectTarget ||
      isSenderMember ||
      isMentionedInText ||
      isMathanMkMatch
    ) {
      return true;
    }

    // 4. DONT NOTIFY OTHERS! All other members are strictly blocked.
    return false;
  }

  // 4. Task Assignment / Redirect Notifications:
  if (
    n.type === 'assigned' ||
    n.category === 'Task Assigned' ||
    n.category === 'Task Redirected'
  ) {
    if (isAdminUser || isTeamLead) return true;
    const isTargetMember =
      (n.assignedUserId && n.assignedUserId === currentId) ||
      (n.assignedUserName && n.assignedUserName.trim().toLowerCase() === currentNameNorm) ||
      (Array.isArray(n.targetUserIds) && n.targetUserIds.includes(currentId)) ||
      (Array.isArray(n.targetUserNames) &&
        n.targetUserNames.some((un) => un?.trim().toLowerCase() === currentNameNorm)) ||
      (currentNameNorm.length > 2 && n.text && n.text.toLowerCase().includes(currentNameNorm));
    if (isTargetMember) return true;
    return false;
  }

  // 5. Role-based targeting if specified (e.g. Reimbursement notes)
  if (n.targetRoles && n.targetRoles.length > 0) {
    if (isAdminUser && (n.targetRoles.includes('Super Admin') || n.targetRoles.includes('Admin'))) {
      return true;
    }
    if (n.targetRoles.includes(currentUser.role as any)) {
      return true;
    }
    if (n.senderName && n.senderName.trim().toLowerCase() === currentNameNorm) {
      return true;
    }
    return false;
  }

  // 6. Direct User targeting if specified
  if (n.targetUserIds && n.targetUserIds.length > 0) {
    if (n.targetUserIds.includes(currentId)) return true;
    if (isAdminUser) return true;
    return false;
  }

  return true;
}
