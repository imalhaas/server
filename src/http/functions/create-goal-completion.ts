import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { goals, goalsCompletions } from "../db/schema";
import dayjs from "dayjs";

interface CreateGoalCompetionRequest {
 goalId: string
}

export async function createGoalCompletion({
     goalId}: CreateGoalCompetionRequest ){

        const firstDateOfWeek = dayjs().startOf('week').toDate()
        const lastDayOfWeek = dayjs().endOf('week').toDate()

        const goalCompletionCounts = db.$with('goal_completion_counts').as(
            db
              .select({
                goalId: goalsCompletions.goalId,
                completionCount: count(goalsCompletions.id).as('completionCount'), 
              })
              .from(goalsCompletions)
              .where(
                and(
                  gte(goalsCompletions.createdAt, firstDateOfWeek),
                  lte(goalsCompletions.createdAt, lastDayOfWeek),
                  eq(goalsCompletions.goalId, goalId)
                )
              )
              .groupBy(goalsCompletions.goalId)
          );


    const result = await db
    .with(goalCompletionCounts)
    .select({
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        completionCount: sql`
        COALESCE(${goalCompletionCounts.completionCount}, 0)`,
    })
    .from(goals)
    .leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1)

    const { completionCount , desiredWeeklyFrequency} = result[0]

    if( completionCount >= desiredWeeklyFrequency){
        throw new Error('Goal already completed this week!')
    }

    const insertResult = await db.insert(goalsCompletions).values({ goalId }).returning()
    const goalCompleiton = insertResult[0]

    return {
        goalCompleiton,
    }
}