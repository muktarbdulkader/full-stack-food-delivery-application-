/* eslint-disable @typescript-eslint/no-unused-vars */
import { IUser } from '../models/User.model';

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}

declare module 'express' {
  interface Request {
    user?: IUser;
  }
}
