import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

/**
 * Generic validation middleware factory
 * Creates a middleware function that validates request data against a Zod schema
 */
export const validate = <T>(
  schema: ZodSchema<T>,
  source: "body" | "params" | "query" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data =
        source === "body"
          ? req.body
          : source === "params"
          ? req.params
          : req.query;

      const validData = schema.parse(data);

      // Add the validated data to the request for use in controllers
      req[source] = validData;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: "error",
          message: `Invalid ${source} data`,
          errors: error.format(),
        });
        return;
      }

      res.status(400).json({
        status: "error",
        message: "Invalid request data",
      });
    }
  };
};
