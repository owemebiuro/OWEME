import { NoteType, TaskPriority, TaskStatus, type PrismaClient } from "@prisma/client";

type PrismaLike = Pick<PrismaClient, "task" | "note">;

export async function createTaskIfMissing(
  prisma: PrismaLike,
  input: {
    claimId: string;
    creatorId: string;
    title: string;
    assigneeId?: string | null;
    dueDate?: Date | null;
    priority?: TaskPriority;
  },
) {
  const existingTask = await prisma.task.findFirst({
    where: {
      claimId: input.claimId,
      title: input.title,
    },
    select: {
      id: true,
    },
  });

  if (existingTask) {
    return existingTask;
  }

  return prisma.task.create({
    data: {
      claimId: input.claimId,
      creatorId: input.creatorId,
      assigneeId: input.assigneeId ?? null,
      title: input.title,
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? TaskPriority.MEDIUM,
      status: TaskStatus.OPEN,
    },
    select: {
      id: true,
    },
  });
}

export async function createInternalNoteIfMissing(
  prisma: PrismaLike,
  input: {
    claimId: string;
    authorId: string;
    content: string;
  },
) {
  const existingNote = await prisma.note.findFirst({
    where: {
      claimId: input.claimId,
      authorId: input.authorId,
      content: input.content,
      type: NoteType.INTERNAL,
    },
    select: {
      id: true,
    },
  });

  if (existingNote) {
    return existingNote;
  }

  return prisma.note.create({
    data: {
      claimId: input.claimId,
      authorId: input.authorId,
      content: input.content,
      type: NoteType.INTERNAL,
    },
    select: {
      id: true,
    },
  });
}
