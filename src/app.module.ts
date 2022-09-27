import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { HttpModule } from '@nestjs/axios';
import {
  Dialect,
  Environment,
  NodeDialectWalletAdapter,
  SolanaNetwork,
} from '@dialectlabs/sdk';
import { DialectSdk } from './dialect-sdk';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { InvestinService } from './investin.service';
import { DepositMonitoringService } from './deposit-monitoring.service';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    ConfigModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: process.env.ENVIRONMENT !== 'production',
        redact: ['req.headers'],
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: process.env.ENVIRONMENT === 'local-development',
            translateTime: true,
            singleLine: true,
            ignore: 'pid,hostname',
          },
        },
      },
    }),
  ],
  controllers: [HealthController],
  providers: [
    // MonitoringService,
    InvestinService,
    DepositMonitoringService,
    {
      provide: DialectSdk,
      useValue: Dialect.sdk({
        environment: process.env.DIALECT_SDK_ENVIRONMENT as Environment,
        solana: {
          network: process.env.DIALECT_SDK_SOLANA_NETWORK_NAME as SolanaNetwork,
          rpcUrl: process.env.DIALECT_SDK_SOLANA_RPC_URL,
        },
        wallet: NodeDialectWalletAdapter.create(),
      }),
    },
  ],
})
export class AppModule {}