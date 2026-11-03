// src/lib/errors.ts
import { NextResponse } from "next/server";

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

type HandlerFn = (request: Request, context?: unknown) => Promise<NextResponse>;

/**
 * Wraps an API route handler with consistent error handling.
 * - AppError → { error: message } with correct status code
 * - "UNAUTHORIZED" → 401
 * - "FORBIDDEN" → 403
 * - Unknown errors → 500
 */
export function withHandler(fn: HandlerFn): HandlerFn {
  return async (request: Request, context?: unknown) => {
    try {
      return await fn(request, context);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      if (error instanceof Error) {
        if (error.message === "UNAUTHORIZED") {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }
        if (error.message === "FORBIDDEN") {
          return NextResponse.json(
            { error: "Access denied" },
            { status: 403 }
          );
        }
      }

      console.error("Unhandled error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
