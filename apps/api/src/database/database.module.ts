import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDb } from "@cometkit/db";

export const DB = Symbol("DB");

@Global()
@Module({
  providers: [
    {
      provide: DB,
      useFactory: (config: ConfigService) =>
        createDb(config.getOrThrow<string>("DATABASE_URL")),
      inject: [ConfigService],
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
