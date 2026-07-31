import { Role, Team, User } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export const COMPANY_DOMAIN = "taskflow.company";
export async function currentUser(): Promise<User | null> {
  const id = (await cookies()).get("taskflow-user")?.value;
  return id ? prisma.user.findUnique({ where: { id } }) : null;
}
export async function requireUser() { const user = await currentUser(); if (!user) redirect("/sign-in"); return user; }
export function isLead(user: User) { return user.role === Role.LEAD || user.role === Role.ADMIN; }
export function canSeeTask(user: User, task: { team: Team; creatorId: string; assigneeId: string | null; isIncoming: boolean }) {
  if (user.role === Role.ADMIN) return true;
  if (user.role === Role.LEAD && user.team === task.team) return true;
  return task.creatorId === user.id || task.assigneeId === user.id || (!task.isIncoming && user.team === task.team);
}
