import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";
import { Logger } from "nestjs-pino";
import { ulid } from "ulid";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    // ULID request ids: time-ordered and grep-able across logs.
    new FastifyAdapter({ genReqId: () => ulid() }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));

  // Every response carries its request id for log correlation.
  app
    .getHttpAdapter()
    .getInstance()
    .addHook("onSend", (request, reply, _payload, done) => {
      void reply.header("x-request-id", request.id);
      done();
    });

  const config = app.get(ConfigService);
  app.enableCors({
    origin: config.getOrThrow<string>("CORS_ORIGIN"),
    credentials: true,
  });

  const port = config.getOrThrow<number>("PORT");
  await app.listen({ port, host: "0.0.0.0" });
}

void bootstrap();
