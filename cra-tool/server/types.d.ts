// Express request augmentation: the auth middleware attaches the decoded
// JWT payload as req.user.
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string } & Record<string, any>;
    }
  }
}

export {};
