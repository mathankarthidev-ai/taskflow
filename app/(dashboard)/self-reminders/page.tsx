import { redirect } from 'next/navigation';

export default function SelfRemindersRedirectPage() {
  redirect('/reminders?tab=self');
}
