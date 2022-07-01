import * as trpc from "@trpc/server";
import cardRouter from "./card";
import itemRouter from "./item";
import reviewRouter from "./review";
import reviewSessionRouter from "./reviewSession";

export const appRouter = trpc
  .router()
  .merge("card.", cardRouter)
  .merge("item.", itemRouter)
  .merge("review.", reviewRouter)
  .merge("review-session.", reviewSessionRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
