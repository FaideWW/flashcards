import { router, TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/backend/utils/prisma";
import { Prisma } from "@prisma/client";

const defaultCardSelect = Prisma.validator<Prisma.CardSelect>()({
  id: true,
  createdAt: true,
  updatedAt: true,
  front: true,
  back: true,
});

const cardRouter = router()
  .mutation("create", {
    input: z.object({
      front: z.string(),
      back: z.string(),
    }),
    async resolve({ input }) {
      const newCard = await prisma.card.create({
        select: defaultCardSelect,
        data: {
          front: input.front,
          back: input.back,
        },
      });

      return newCard;
    },
  })
  .query("all", {
    async resolve() {
      return prisma.card.findMany({
        select: defaultCardSelect,
      });
    },
  })
  .query("by-id", {
    input: z.object({ id: z.string() }),
    async resolve({ input }) {
      const { id } = input;
      const card = prisma.card.findUnique({
        where: { id },
        select: defaultCardSelect,
      });
      if (!card) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No card with id ${id}`,
        });
      }

      return card;
    },
  })
  .mutation("edit", {
    input: z.object({
      id: z.string(),
      data: z.object({
        front: z.string(),
        back: z.string(),
      }),
    }),
    async resolve({ input }) {
      const { id } = input;
      const card = prisma.card.update({
        where: { id },
        data: input.data,
        select: defaultCardSelect,
      });

      return card;
    },
  })
  .mutation("delete", {
    input: z.object({ id: z.string() }),
    async resolve({ input }) {
      const { id } = input;
      await prisma.card.delete({
        where: { id },
      });
      return { id };
    },
  });

export default cardRouter;
