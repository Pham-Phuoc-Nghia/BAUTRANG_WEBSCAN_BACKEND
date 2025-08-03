// src/types/express/index.d.ts

interface UserPayload {
  UserId: number;
  UserName: string;
  branchId: number;
}

declare namespace Express {
  export interface Request {
    user?: UserPayload;
  }
}
