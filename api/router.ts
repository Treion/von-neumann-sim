import { authRouter } from "./auth-router";
import { simulationRouter } from "./simulation-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  simulation: simulationRouter,
});

export type AppRouter = typeof appRouter;
