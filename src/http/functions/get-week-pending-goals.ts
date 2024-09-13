import dayjs from "dayjs";
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { db } from "../db";
import { goals, goalsCompletions } from "../db/schema";
import { sql, count, lte, gte, and, eq } from "drizzle-orm";
import { number } from "zod";
//import { count } from "drizzle-orm";


dayjs.extend(weekOfYear)

export async function getWeekPendingGoals() {
    // Definindo as datas de início e fim da semana atual
    const firstDateOfWeek = dayjs().startOf('week').toDate();
    const lastDayOfWeek = dayjs().endOf('week').toDate();
  
    // Definindo a subquery 'goals_create_up_to_week'
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
  
    // Definindo a subquery 'goal_completion_counts'
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
            lte(goalsCompletions.createdAt, lastDayOfWeek)
          )
        )
        .groupBy(goalsCompletions.goalId)
    );
  
    // Consulta final usando as subqueries definidas acima
    const busca = await db
      .with(goalsCreateUpToWeek, goalCompletionCounts)
      .select({
        id:  goalsCreateUpToWeek.id,
        title:  goalsCreateUpToWeek.title,
        desiredWeeklyFrequency: goalsCreateUpToWeek.desiredWeeklyFrequency,
        completionCount: sql`
        COALESCE(${goalCompletionCounts.completionCount}, 0)
        `,
      })
      .from(goalsCreateUpToWeek)
      .leftJoin(
        goalCompletionCounts,
        eq(goalCompletionCounts.goalId, goalsCreateUpToWeek.id)
      )
      
  
    return busca;
  }