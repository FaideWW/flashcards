import { Prisma } from "@prisma/client";
import { prisma } from "@/backend/utils/prisma";
import { router } from "@trpc/server";
import { z } from "zod";
import { hoursFromNow, SRS_INTERVALS } from "../utils/srs";

const defaultReviewSessionSelect =
  Prisma.validator<Prisma.ReviewSessionSelect>()({
    id: true,
    startedAt: true,
    endedAt: true,
    status: true,
  });

const reviewSessionDataSelect = Prisma.validator<Prisma.ReviewSessionSelect>()({
  id: true,
  startedAt: true,
  endedAt: true,
  status: true,
  items: {
    select: {
      id: true,
      currentSrsStage: true,
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
    },
  },
  reviews: {
    select: {
      id: true,
      startingSrsStage: true,
      endingSrsStage: true,
      secondsElapsed: true,
      timesIncorrect: true,
    },
  },
});

const reviewSessionSummarySelect =
  Prisma.validator<Prisma.ReviewSessionSelect>()({
    id: true,
    startedAt: true,
    endedAt: true,
    status: true,
    reviews: {
      select: {
        id: true,
        startingSrsStage: true,
        endingSrsStage: true,
        secondsElapsed: true,
        timesIncorrect: true,
        item: {
          select: {
            id: true,
            currentSrsStage: true,
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
          },
        },
      },
    },
  });

const reviewSessionRouter = router()
  .mutation("create", {
    input: z.object({
      startedAt: z.date().optional(),
      status: z.enum(["STARTED", "CANCELLED", "COMPLETE"]).optional(),
      itemIds: z.array(z.string()),
    }),
    async resolve({ input }) {
      const { startedAt = new Date(), status = "STARTED", itemIds } = input;

      const newSession = await prisma.reviewSession.create({
        select: defaultReviewSessionSelect,
        data: {
          startedAt,
          status,
          items: { connect: itemIds.map((itemId) => ({ id: itemId })) },
        },
      });

      return newSession;
    },
  })
  .query("all", {
    async resolve() {
      return prisma.reviewSession.findMany({
        select: defaultReviewSessionSelect,
      });
    },
  })
  .query("by-id", {
    input: z.object({ id: z.string() }),
    async resolve({ input }) {
      const { id } = input;
      return prisma.reviewSession.findUnique({
        where: { id },
        select: reviewSessionDataSelect,
      });
    },
  })
  .query("by-id.summary", {
    input: z.object({ id: z.string() }),
    async resolve({ input }) {
      const { id } = input;
      return prisma.reviewSession.findUnique({
        where: { id },
        select: reviewSessionSummarySelect,
      });
    },
  })
  .mutation("complete", {
    input: z.object({
      id: z.string(),
      endedAt: z.string().optional(),
      reviews: z.array(
        z.object({
          itemId: z.string(),
          cardId: z.string(),
          secondsElapsed: z.number(),
          startingSrsStage: z.number(),
          endingSrsStage: z.number(),
          timesIncorrect: z.number(),
          item: z.object({
            currentStreak: z.number(),
            maxStreak: z.number(),
          }),
        })
      ),
    }),
    async resolve({ input }) {
      const { id, endedAt = new Date().toISOString(), reviews } = input;
      // When a session is completed:
      //  Mark the session as complete
      //  Log the endedAt time
      //  For each review in reviews:
      //    Create a new review with the given properties, and connect the item and card models
      //    For the item associated with the review:
      //     - set currentSrsStage to endingSrsStage
      //     - set nextAvailable based on the corresponding SRS interval
      //     - increment timesReviewed
      //     - Increment timesCorrect
      //     - Add timesIncorrect
      //     - Set currentStreak
      //     - Set maxStreak
      const [session] = await prisma.$transaction([
        prisma.reviewSession.update({
          select: defaultReviewSessionSelect,
          where: { id },
          data: {
            status: "COMPLETE",
            endedAt: new Date(endedAt),
            reviews: {
              create: reviews.map((review) => {
                const boundedEndingSrs = Math.min(
                  SRS_INTERVALS.length - 1,
                  review.endingSrsStage
                );
                return {
                  secondsElapsed: review.secondsElapsed,
                  startingSrsStage: review.startingSrsStage,
                  endingSrsStage: boundedEndingSrs,
                  timesIncorrect: review.timesIncorrect,
                  card: { connect: { id: review.cardId } },
                  item: {
                    connect: { id: review.itemId },
                  },
                };
              }),
            },
          },
        }),
        ...reviews.map((review) => {
          const boundedEndingSrs = Math.min(
            SRS_INTERVALS.length - 1,
            review.endingSrsStage
          );
          return prisma.item.update({
            where: { id: review.itemId },
            data: {
              currentSrsStage: boundedEndingSrs,
              nextAvailable: hoursFromNow(SRS_INTERVALS[boundedEndingSrs]),
              timesReviewed: { increment: 1 },
              timesCorrect: { increment: 1 },
              timesIncorrect: { increment: review.timesIncorrect },
              currentStreak: review.item.currentStreak,
              maxStreak: review.item.maxStreak,
            },
          });
        }),
      ]);

      return session;
    },
  })
  .mutation("cancel", {
    input: z.object({
      id: z.string(),
      endedAt: z.string().optional(),
      reviews: z.array(
        z.object({
          itemId: z.string(),
          cardId: z.string(),
          secondsElapsed: z.number(),
          startingSrsStage: z.number(),
          endingSrsStage: z.number(),
          timesIncorrect: z.number(),
          item: z.object({
            currentStreak: z.number(),
            maxStreak: z.number(),
          }),
        })
      ),
    }),
    async resolve({ input }) {
      const { id, endedAt = new Date().toISOString(), reviews } = input;
      // When a session is cancelled:
      //  Mark the session as cancelled
      //  Log the endedAt time
      //  For each review in reviews:
      //    Create a new review with the given properties, and connect the item and card models
      //    For the item associated with the review:
      //     - set currentSrsStage to endingSrsStage
      //     - set nextAvailable based on the corresponding SRS interval
      //     - increment timesReviewed
      //     - Increment timesCorrect
      //     - Add timesIncorrect
      //     - Set currentStreak
      //     - Set maxStreak
      const session = await prisma.reviewSession.update({
        select: defaultReviewSessionSelect,
        where: { id },
        data: {
          status: "CANCELLED",
          endedAt: new Date(endedAt),
          reviews: {
            create: reviews.map((review) => {
              const boundedEndingSrs = Math.min(
                SRS_INTERVALS.length - 1,
                review.endingSrsStage
              );
              return {
                secondsElapsed: review.secondsElapsed,
                startingSrsStage: review.startingSrsStage,
                endingSrsStage: boundedEndingSrs,
                timesIncorrect: review.timesIncorrect,
                card: { connect: { id: review.cardId } },
                item: {
                  connect: { id: review.itemId },
                  update: {
                    currentSrsStage: boundedEndingSrs,
                    nextAvailable: hoursFromNow(
                      SRS_INTERVALS[boundedEndingSrs]
                    ),
                    timesReviewed: { increment: 1 },
                    timesCorrect: { increment: 1 },
                    timesIncorrect: { increment: review.timesIncorrect },
                    currentStreak: review.item.currentStreak,
                    maxStreak: review.item.maxStreak,
                  },
                },
              };
            }),
          },
        },
      });

      return session;
    },
  })
  .mutation("delete", {
    input: z.object({ id: z.string() }),
    async resolve({ input }) {
      const { id } = input;
      await prisma.reviewSession.delete({ where: { id } });
      return { id };
    },
  });

export default reviewSessionRouter;
