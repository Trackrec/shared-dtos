import { LoggerModule } from "nestjs-pino";

export const loggerConfig = LoggerModule.forRoot({
  pinoHttp: {
    transport: {
      target: "pino-pretty",
      options: {
        messageKey: "message",
      },
    },
    messageKey: "message",
  },
});
