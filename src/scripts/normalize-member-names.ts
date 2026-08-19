import prisma from "@/src/lib/prisma";

const members = await prisma.user.findMany({
  where: { type: "MEMBER", fullName: { not: null } },
  select: { id: true, fullName: true, createdAt: true },
  orderBy: [{ fullName: "asc" }, { createdAt: "asc" }],
});

const groups = new Map<string, typeof members>();
for (const member of members) {
  const name = member.fullName!.trim();
  const group = groups.get(name) ?? [];
  group.push(member);
  groups.set(name, group);
}

let renamed = 0;
for (const [name, group] of groups) {
  if (group.length < 2) continue;
  for (let index = 1; index < group.length; index++) {
    let candidate = `${name} (${index})`;
    let suffix = index;
    while (await prisma.user.findFirst({ where: { fullName: candidate, NOT: { id: group[index].id } }, select: { id: true } })) {
      suffix++;
      candidate = `${name} (${suffix})`;
    }
    await prisma.user.update({ where: { id: group[index].id }, data: { fullName: candidate } });
    renamed++;
    console.log(`Renamed duplicate member: ${name} -> ${candidate}`);
  }
}

console.log(`Renamed ${renamed} duplicate member names.`);
await prisma.$disconnect();
