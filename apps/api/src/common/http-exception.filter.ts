import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { ApiErrorBody } from "@cometkit/shared";

/**
 * The one error envelope. Every non-2xx response leaves through here,
 * shaped as ApiErrorBody from @cometkit/shared. Unknown errors become
 * 500s and are logged with their stack; expected HttpExceptions pass
 * through with their status and any Zod field errors preserved.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = "Internal server error";
    let error = "InternalServerError";
    let fieldErrors: Record<string, string[]> | undefined;

    if (isHttp) {
      error = exception.constructor.name.replace(/Exception$/, "");
      const response = exception.getResponse();
      if (typeof response === "string") {
        message = response;
      } else if (typeof response === "object" && response !== null) {
        const body = response as {
          message?: string | string[];
          errors?: Record<string, string[]>;
        };
        message = Array.isArray(body.message)
          ? body.message.join("; ")
          : (body.message ?? exception.message);
        fieldErrors = body.errors;
      }
    }

    if (status >= 500) {
      this.logger.error(
        { err: exception, requestId: request.id, path: request.url },
        "Unhandled exception",
      );
    }

    const body: ApiErrorBody = {
      statusCode: status,
      error,
      message,
      ...(fieldErrors ? { errors: fieldErrors } : {}),
      requestId: String(request.id),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    void reply.status(status).send(body);
  }
}
