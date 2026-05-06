import { z } from "zod";
import { authedQuery } from "./middleware";
import { createRouter } from "./middleware";
import { getDb } from "./queries/connection";
import { simulationStates, userProgress } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const simulationRouter = createRouter({
  saveState: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        programIndex: z.number().int().min(0),
        state: z.object({
          pc: z.number(),
          mar: z.number(),
          mbr: z.number(),
          accumulator: z.number(),
          clockCycle: z.number(),
          phase: z.string(),
          ram: z.array(z.object({
            address: z.number(),
            value: z.number(),
            isInstruction: z.boolean(),
          })),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;

      const db = getDb();
      const result = await db.insert(simulationStates).values({
        userId: user.id,
        name: input.name,
        programIndex: input.programIndex,
        state: input.state,
      });

      return { success: true, id: Number(result[0].insertId) };
    }),

  loadStates: authedQuery.query(async ({ ctx }) => {
    const user = ctx.user;

    const db = getDb();
    const states = await db
      .select()
      .from(simulationStates)
      .where(eq(simulationStates.userId, user.id))
      .orderBy(desc(simulationStates.updatedAt));

    return states;
  }),

  deleteState: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(simulationStates)
        .where(eq(simulationStates.id, input.id));

      return { success: true };
    }),

  getProgress: authedQuery.query(async ({ ctx }) => {
    const user = ctx.user;

    const db = getDb();
    const progress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, user.id))
      .limit(1);

    return progress[0] || null;
  }),

  updateProgress: authedQuery
    .input(
      z.object({
        totalCyclesCompleted: z.number().int().optional(),
        programsCompleted: z.number().int().optional(),
        componentsInspected: z.number().int().optional(),
        lastProgramIndex: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;

      const db = getDb();
      const existing = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userProgress)
          .set({
            ...input,
            lastActiveAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userProgress.userId, user.id));
      } else {
        await db.insert(userProgress).values({
          userId: user.id,
          ...input,
        });
      }

      return { success: true };
    }),
});
