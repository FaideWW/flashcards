import { Prisma } from "@prisma/client";
import { prisma } from "@/backend/utils/prisma";
import { router, TRPCError } from "@trpc/server";
import { z } from "zod";
import { hoursFromNow, SRS_INTERVALS } from "../utils/srs";

const defaultItemSelect = Prisma.validator<Prisma.ItemSelect>()({
  id: true,
  currentSrsStage: true,
  nextAvailable: true,
  timesReviewed: true,
  timesCorrect: true,
  timesIncorrect: true,
  currentStreak: true,
  maxStreak: true,
  card: {
    select: {
      id: true,
      front: true,
      back: true,
      notes: true,
    },
  },
});

const TEST_USER_ID = "testUser";

const itemRouter = router()
  .mutation("create", {
    input: z.object({
      cardId: z.string(),
      currentSrsStage: z.number().optional(),
      nextAvailable: z.date().optional(),
    }),
    async resolve({ input }) {
      const {
        cardId,
        currentSrsStage = 0,
        nextAvailable = hoursFromNow(SRS_INTERVALS[currentSrsStage]),
      } = input;

      const newItem = await prisma.item.create({
        data: {
          cardId,
          currentSrsStage,
          nextAvailable,
          // TODO: Replace with userId from auth context, when that gets implemented.
          userId: TEST_USER_ID,
        },
      });

      return newItem;
    },
  })
  .query("all", {
    async resolve() {
      return prisma.item.findMany({
        select: defaultItemSelect,
      });
    },
  })
  .query("by-id", {
    input: z.object({ id: z.string() }),
    async resolve({ input }) {
      const { id } = input;
      const item = await prisma.item.findUnique({
        where: { id },
        select: defaultItemSelect,
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No item with id ${id}`,
        });
      }

      return item;
    },
  })
  .query("by-card", {
    input: z.object({ cardId: z.string() }),
    async resolve({ input }) {
      const { cardId } = input;
      const item = await prisma.item.findUnique({
        where: {
          userId_cardId: {
            cardId,
            userId: TEST_USER_ID,
          },
        },
        select: defaultItemSelect,
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No item with cardId ${cardId}`,
        });
      }

      return item;
    },
  })
  .query("ready-for-review", {
    input: z.object({ from: z.string().optional() }).optional(),
    async resolve({ input = {} }) {
      const { from = new Date().toISOString() } = input;
      const items = await prisma.item.findMany({
        where: {
          nextAvailable: {
            lte: from,
          },
        },
      });

      return items;
    },
  })
  .query("ready-for-review-ids", {
    input: z.object({ from: z.string().optional() }).optional(),
    async resolve({ input = {} }) {
      const { from = new Date().toISOString() } = input;
      console.log(from);
      const items = await prisma.item.findMany({
        where: {
          nextAvailable: {
            lte: from,
          },
        },
        select: { id: true },
      });

      return items;
    },
  })
  .mutation("set-srs-level", {
    input: z.object({
      id: z.string(),
      currentSrsStage: z.number(),
      nextAvailable: z.date().optional(),
    }),
    async resolve({ input }) {
      const {
        id,
        currentSrsStage,
        nextAvailable = hoursFromNow(SRS_INTERVALS[currentSrsStage]),
      } = input;
      return prisma.item.update({
        select: defaultItemSelect,
        where: { id },
        data: {
          currentSrsStage,
          nextAvailable,
        },
      });
    },
  })
  .mutation("update", {
    input: z.object({
      id: z.string(),
      currentSrsStage: z.number().optional(),
      nextAvailable: z.date().optional(),
      timesReviewed: z.number().optional(),
      timesCorrect: z.number().optional(),
      timesIncorrect: z.number().optional(),
      currentStreak: z.number().optional(),
      maxStreak: z.number().optional(),
    }),
    async resolve({ input }) {
      const { id, ...rest } = input;
      return prisma.item.update({
        select: defaultItemSelect,
        where: { id },
        data: rest,
      });
    },
  })
  .mutation("delete", {
    input: z.object({ id: z.string() }),
    async resolve({ input }) {
      const { id } = input;
      await prisma.item.delete({
        where: { id },
      });

      return { id };
    },
  });

export default itemRouter;
