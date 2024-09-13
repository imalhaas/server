import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { goals, goalsCompletions } from "../db/schema";
import { db } from "../db";
import dayjs from "dayjs";
import { number } from "zod";



export async function getWeekSummary() {

    const lastDayOfWeek = dayjs().endOf('week').toDate()
    const firstDateOfWeek = dayjs().startOf('week').toDate();

    const goalsCreateUpToWeek = db.$with('goals_create_up_to_week').as(
        db
          .select({
            id: goals.id, // Certifique-se de que 'goals' está definido corretamente
            title: goals.title,
            desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
            createdAt: goals.createdAt,
          })
          .from(goals)
          .where(lte(goals.createdAt, lastDayOfWeek))
      );
    
      const goalCompletedWeek = db.$with('goals_completed_in_week').as(
        db
          .select({
            id: goals.id,
            title: goals.title,
            completedAt: goalsCompletions.createdAt,
            completedAtDate: sql/*sql*/`DATE(${goalsCompletions.createdAt})`.as('completedAtDate'), // Adicionando o alias 'completedAtDate'
          })
          .from(goalsCompletions)
          .innerJoin(goals, eq(goals.id, goalsCompletions.goalId))
          .where(
            and(
              gte(goalsCompletions.createdAt, firstDateOfWeek), // Verifique o formato da data
              lte(goalsCompletions.createdAt, lastDayOfWeek) // Verifique o formato da data
            )
          )
      );
      
      const goalsCompletedByWeekDay = db.$with('goal_completed_by_week_day').as(
        db
        .select({
            completedAtDate: goalCompletedWeek.completedAtDate,
            completions: sql/*sql*/`
            JSON_AGG(
            JSON_BUILD_OBJECT(
            'id', ${goalCompletedWeek.id},
            'title', ${goalCompletedWeek.title},
            'completedAt', ${goalCompletedWeek.completedAt}
            )
            )
            `.as('completions'),
        })
        .from(goalCompletedWeek)
        .groupBy(goalCompletedWeek.completedAtDate)
      )

      const result = await db
      .with(goalsCreateUpToWeek, goalCompletedWeek, goalsCompletedByWeekDay)
      .select({
        completed: sql/*sql*/ `(SELECT COUNT(*) FROM ${goalCompletedWeek})`,
        total: sql/*sql*/ `(SELECT SUM(${goalsCreateUpToWeek.desiredWeeklyFrequency}) FROM ${goalsCreateUpToWeek})`,
        goalsPerDay: sql/*sql*/ `
        JSON_OBJECT_AGG(
        ${goalsCompletedByWeekDay.completedAtDate},
        ${goalsCompletedByWeekDay.completions}
        )
        `
      })
      .from(goalsCompletedByWeekDay)

    return {
        summary: result
    }
  }