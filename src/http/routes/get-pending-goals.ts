
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getWeekPendingGoals } from "../functions/get-week-pending-goals";


export const createPendingGoalRoute: FastifyPluginAsyncZod = async (app) => {


app.get('/pending-goals', async () => {
    try {
      const busca = await getWeekPendingGoals(); // Função que busca as metas pendentes
      return busca
    } catch (error) {
      console.error(error); // Log do erro no servidor para depuração // Retorna status 500 (erro interno do servidor) com mensagem de erro
    }
  });

}