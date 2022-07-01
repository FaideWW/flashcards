import { Prisma } from "@prisma/client";
import { prisma } from "@/backend/utils/prisma";
import { router, TRPCError } from "@trpc/server";
import { z } from "zod";

const defaultReviewSelect = Prisma.validator<Prisma.ReviewSelect>()({
  id: true,
  createdAt: true,
  startingSrsStage: true,
  endingSrsStage: true,
  timesIncorrect: true,
  item: {
    select: {
      currentSrsStage: true,
    },
  },
  card: {
    select: {
      front: true,
      back: true,
      notes: true,
    },
  },
});

const reviewRouter = router()
  .mutation("create", {
    input: z.object({
      startingSrsStage: z.number(),
      endingSrsStage: z.number(),
      timesIncorrect: z.number(),
      itemId: z.string(),
      cardId: z.string(),
      startTime: z.date(),
      endTime: z.date().optional(),
      reviewSessionId: z.string(),
    }),
    async resolve({ input }) {
      const newReview = await prisma.review.create({
        select: defaultReviewSelect,
        data: {
          endTime: new Date(),
          ...input,
        },
      });

      return newReview;
    },
  })
  .query("all", {
    async resolve() {
      return prisma.review.findMany({ select: defaultReviewSelect });
    },
  })
  .query("by-id", {
    input: z.object({ id: z.string() }),
    async resolve({ input }) {
      const { id } = input;
      const review = await prisma.review.findUnique({
        select: defaultReviewSelect,
        where: { id },
      });
      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No review with id ${id}`,
        });
      }

      return review;
    },
  })
  .query("by-item", {
    input: z.object({ itemId: z.string() }),
    async resolve({ input }) {
      const { itemId } = input;
      return prisma.review.findMany({
        select: defaultReviewSelect,
        where: { itemId },
      });
    },
  })
  .mutation("delete", {
    input: z.object({ id: z.string() }),
    async resolve({ input }) {
      const { id } = input;
      await prisma.review.delete({ where: { id } });

      return { id };
    },
  });

export default reviewRouter;
