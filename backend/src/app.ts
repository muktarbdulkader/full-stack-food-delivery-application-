import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/error.middleware';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
