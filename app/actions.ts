"use server";
import { ActivityType, FinancialType, Priority, Role, Status, Team } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { COMPANY_DOMAIN, currentUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const refresh = () => revalidatePath("/");
async function activity(type: ActivityType, message: string, actorId: string, taskId?: string) { await prisma.activityLog.create({ data: { type, message, actorId, taskId } }); }

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email.endsWith(`@${COMPANY_DOMAIN}`)) redirect("/sign-in?error=domain");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) redirect("/sign-in?error=unknown");
  const { cookies } = await import("next/headers"); (await cookies()).set("taskflow-user", user.id, { httpOnly:true, sameSite:"lax", path:"/" });
  redirect("/");
}
export async function signOut() { const { cookies } = await import("next/headers"); (await cookies()).delete("taskflow-user"); redirect("/sign-in"); }
export async function createTask(formData: FormData) {
  const user = await requireUser(); const team = String(formData.get("team")) as Team;
  if (user.role !== Role.ADMIN && team !== user.team && !Object.values(Team).includes(team)) throw new Error("Invalid team");
  const crossTeam = team !== user.team;
  const task = await prisma.task.create({ data: { title:String(formData.get("title")), description:String(formData.get("description")||"") || null, team, priority:String(formData.get("priority")) as Priority, dueDate: formData.get("dueDate") ? new Date(String(formData.get("dueDate"))) : null, creatorId:user.id, isIncoming:crossTeam } }); await activity(ActivityType.TASK_CREATED, `${user.name} created “${task.title}”`, user.id, task.id); refresh();
}
export async function updateTask(taskId: string, formData: FormData) {
  const user = await requireUser(); const task = await prisma.task.findUniqueOrThrow({where:{id:taskId}});
  const canManage = user.role === Role.ADMIN || (user.role === Role.LEAD && user.team === task.team) || task.assigneeId === user.id;
  if (!canManage || task.isIncoming) throw new Error("Not permitted");
  const status=String(formData.get("status")) as Status; await prisma.task.update({where:{id:taskId},data:{status}}); await activity(ActivityType.TASK_MOVED, `${user.name} moved “${task.title}” to ${status.replaceAll("_"," ")}`, user.id, task.id); refresh();
}
export async function routeTask(taskId: string, formData: FormData) {
  const user = await requireUser(); const task = await prisma.task.findUniqueOrThrow({where:{id:taskId}});
  if (!(user.role === Role.ADMIN || (user.role === Role.LEAD && user.team === task.team))) throw new Error("Only a team lead can route this task");
  const assigneeId=String(formData.get("assigneeId")); await prisma.task.update({where:{id:taskId},data:{isIncoming:false,assigneeId,status:Status.TODO}}); await prisma.notification.create({data:{userId:assigneeId,title:"New task assigned",body:task.title}}); await activity(ActivityType.TASK_ROUTED, `${user.name} routed “${task.title}”`, user.id, task.id); refresh();
}
export async function reassignTask(taskId: string, formData: FormData) {
  const user = await requireUser(); const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  if (!(user.role === Role.ADMIN || (user.role === Role.LEAD && user.team === task.team))) throw new Error("Only a team lead can reassign this task");
  const assigneeId = String(formData.get("assigneeId")); const assignee = await prisma.user.findUniqueOrThrow({ where: { id: assigneeId } });
  if (assignee.team !== task.team) throw new Error("Assignee must be on the receiving team");
  await prisma.task.update({ where: { id: taskId }, data: { assigneeId } }); await prisma.notification.create({data:{userId:assigneeId,title:"Task reassigned",body:task.title}}); await activity(ActivityType.TASK_ASSIGNED, `${user.name} reassigned “${task.title}”`, user.id, task.id); refresh();
}
export async function addComment(taskId: string, formData: FormData) { const user=await requireUser(); const body=String(formData.get("body")||"").trim(); if (!body) return; const task=await prisma.task.findUniqueOrThrow({where:{id:taskId}}); await prisma.comment.create({data:{taskId,authorId:user.id,body}}); if(task.assigneeId&&task.assigneeId!==user.id) await prisma.notification.create({data:{userId:task.assigneeId,title:"New task comment",body:`${user.name} commented on ${task.title}`}}); await activity(ActivityType.COMMENT_ADDED, `${user.name} commented on “${task.title}”`, user.id, taskId); refresh(); }
export async function archiveTask(taskId:string){const user=await requireUser();const task=await prisma.task.findUniqueOrThrow({where:{id:taskId}});if(!(user.role===Role.ADMIN||(user.role===Role.LEAD&&user.team===task.team)))throw new Error("Not permitted");await prisma.task.update({where:{id:taskId},data:{archivedAt:new Date()}});await activity(ActivityType.TASK_ARCHIVED,`${user.name} archived “${task.title}”`,user.id,taskId);refresh();}
export async function toggleUserActive(userId:string){const user=await requireUser();if(user.role!==Role.ADMIN)throw new Error("Admin only");const target=await prisma.user.findUniqueOrThrow({where:{id:userId}});await prisma.user.update({where:{id:userId},data:{isActive:!target.isActive}});await activity(ActivityType.USER_UPDATED,`${user.name} ${target.isActive?"deactivated":"activated"} ${target.name}`,user.id);revalidatePath("/admin");}
export async function createUser(formData:FormData){const admin=await requireUser();if(admin.role!==Role.ADMIN)throw new Error("Admin only");const name=String(formData.get("name")||"").trim(),email=String(formData.get("email")||"").trim().toLowerCase(),role=String(formData.get("role")) as Role,team=String(formData.get("team")) as Team,salary=Number(formData.get("monthlySalary")||0);if(!name||!email.endsWith(`@${COMPANY_DOMAIN}`))throw new Error("Use a company email");const person=await prisma.user.create({data:{name,email,role,team:role===Role.ADMIN?null:team,monthlySalary:salary}});await activity(ActivityType.USER_UPDATED,`${admin.name} created user ${person.name}`,admin.id);revalidatePath("/admin");}
export async function updateUser(userId:string,formData:FormData){const admin=await requireUser();if(admin.role!==Role.ADMIN)throw new Error("Admin only");const target=await prisma.user.findUniqueOrThrow({where:{id:userId}});const name=String(formData.get("name")||target.name),email=String(formData.get("email")||target.email).toLowerCase(),role=String(formData.get("role")) as Role,team=String(formData.get("team")) as Team,salary=Number(formData.get("monthlySalary")||0);if(!email.endsWith(`@${COMPANY_DOMAIN}`))throw new Error("Use a company email");await prisma.user.update({where:{id:userId},data:{name,email,role,team:role===Role.ADMIN?null:team,monthlySalary:salary}});await activity(ActivityType.USER_UPDATED,`${admin.name} updated ${target.name}'s profile`,admin.id);revalidatePath("/admin");}
export async function deleteUser(userId:string){const admin=await requireUser();if(admin.role!==Role.ADMIN||admin.id===userId)throw new Error("Not permitted");const target=await prisma.user.findUniqueOrThrow({where:{id:userId}});await prisma.user.update({where:{id:userId},data:{isActive:false}});await activity(ActivityType.USER_UPDATED,`${admin.name} removed access for ${target.name}`,admin.id);revalidatePath("/admin");}
export async function addFinancialEntry(formData:FormData){const admin=await requireUser();if(admin.role!==Role.ADMIN)throw new Error("Admin only");const type=String(formData.get("type")) as FinancialType,category=String(formData.get("category")||"").trim(),amount=Number(formData.get("amount")||0),note=String(formData.get("note")||"").trim();if(!category||amount<=0)throw new Error("Category and amount are required");await prisma.financialEntry.create({data:{type,category,amount,note:note||null}});revalidatePath("/business");}
export async function deleteFinancialEntry(id:string){const admin=await requireUser();if(admin.role!==Role.ADMIN)throw new Error("Admin only");await prisma.financialEntry.delete({where:{id}});revalidatePath("/business");}
