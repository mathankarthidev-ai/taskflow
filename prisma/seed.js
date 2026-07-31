const { PrismaClient, Role, Team, Status, Priority } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany(); await prisma.activityLog.deleteMany(); await prisma.comment.deleteMany(); await prisma.task.deleteMany(); await prisma.user.deleteMany();
  const users = await Promise.all([
    prisma.user.create({data:{name:"Maya Chen",email:"maya@taskflow.company",role:Role.LEAD,team:Team.CREATIVE}}),
    prisma.user.create({data:{name:"Oliver Reed",email:"oliver@taskflow.company",role:Role.MEMBER,team:Team.CREATIVE}}),
    prisma.user.create({data:{name:"Priya Shah",email:"priya@taskflow.company",role:Role.LEAD,team:Team.MARKETING}}),
    prisma.user.create({data:{name:"Daniel Kim",email:"daniel@taskflow.company",role:Role.MEMBER,team:Team.MARKETING}}),
    prisma.user.create({data:{name:"Aria Patel",email:"aria@taskflow.company",role:Role.LEAD,team:Team.DEV}}),
    prisma.user.create({data:{name:"Noah Williams",email:"noah@taskflow.company",role:Role.MEMBER,team:Team.DEV}}),
    prisma.user.create({data:{name:"Alex Morgan",email:"alex@taskflow.company",role:Role.ADMIN}})
  ]);
  const [maya,oliver,priya,daniel,aria,noah,admin]=users;
  const specs = [
    ["Q3 campaign visual system",Team.CREATIVE,Status.IN_PROGRESS,Priority.HIGH,maya,oliver,5], ["Landing page illustrations",Team.CREATIVE,Status.TODO,Priority.CRITICAL,daniel,null,-2], ["Brand asset library",Team.CREATIVE,Status.REVIEW,Priority.MEDIUM,maya,oliver,3], ["Social launch templates",Team.CREATIVE,Status.DONE,Priority.MEDIUM,maya,oliver,-4], ["Customer story graphics",Team.CREATIVE,Status.TODO,Priority.LOW,maya,oliver,12],
    ["Product launch announcement",Team.MARKETING,Status.REVIEW,Priority.HIGH,priya,daniel,2], ["SEO content calendar",Team.MARKETING,Status.IN_PROGRESS,Priority.MEDIUM,priya,daniel,8], ["Competitor campaign review",Team.MARKETING,Status.TODO,Priority.HIGH,priya,daniel,-1], ["Partner newsletter",Team.MARKETING,Status.DONE,Priority.LOW,priya,daniel,-6], ["Webinar promotion plan",Team.MARKETING,Status.TODO,Priority.MEDIUM,priya,daniel,10],
    ["Improve dashboard load time",Team.DEV,Status.TODO,Priority.MEDIUM,aria,noah,4], ["API rate-limit middleware",Team.DEV,Status.IN_PROGRESS,Priority.CRITICAL,aria,noah,1], ["Task activity timeline",Team.DEV,Status.REVIEW,Priority.HIGH,aria,noah,6], ["Database backup monitor",Team.DEV,Status.DONE,Priority.MEDIUM,aria,noah,-3], ["Reporting export API",Team.DEV,Status.TODO,Priority.LOW,aria,noah,14]
  ];
  const tasks=[]; for(const [title,team,status,priority,creator,assignee,days] of specs){tasks.push(await prisma.task.create({data:{title,team,status,priority,creatorId:creator.id,assigneeId:assignee?.id,dueDate:new Date(Date.now()+days*864e5),isIncoming:title==="Landing page illustrations"}}));}
  await prisma.comment.createMany({data:[{taskId:tasks[0].id,authorId:oliver.id,body:"Initial concepts are ready for review."},{taskId:tasks[6].id,authorId:daniel.id,body:"Keyword themes are drafted."},{taskId:tasks[11].id,authorId:noah.id,body:"Middleware is ready for QA."}]});
  await prisma.activityLog.createMany({data:tasks.slice(0,8).map((task,index)=>({type:"TASK_CREATED",message:`Seeded task: ${task.title}`,actorId:index%2?maya.id:admin.id,taskId:task.id}))});
  await prisma.notification.create({data:{userId:admin.id,title:"Welcome to TaskFlow",body:"Your company dashboard is ready."}});
}
main().finally(()=>prisma.$disconnect());
