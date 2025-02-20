import fastify from 'fastify'
import { serializerCompiler,
   validatorCompiler,
   type  ZodTypeProvider } from 'fastify-type-provider-zod'
import { createGoalRoute } from './routes/create-goal'
import { createCompletionRoute } from './routes/create-completion'
import { createPendingGoalRoute } from './routes/get-pending-goals'
import { getWeekSummary } from './functions/get-week-summary'
import { getWeekSummaryRoute } from './routes/get-week-summary'
import fastifyCors from '@fastify/cors'


const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: '*',
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);


app.register(createGoalRoute);
app.register(createCompletionRoute);
app.register(createPendingGoalRoute);
app.register(getWeekSummaryRoute);


app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('HTTP SERVER RUNNING!')
  })
