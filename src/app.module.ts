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
import { DefiDepositMonitoringService } from './defi-deposit-monitoring.service';
import { MMDepositMonitoringService } from './mm-deposit-monitoring.service';
import { MMWithdrawMonitoringService } from './mm-withdraw-monitoring.service copy';

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
    DefiDepositMonitoringService,
    MMDepositMonitoringService,
    MMWithdrawMonitoringService,
    {
      provide: DialectSdk,
      useValue: Dialect.sdk({
        environment: process.env.DIALECT_SDK_ENVIRONMENT as Environment,
        solana: {
          network: process.env.DIALECT_SDK_SOLANA_NETWORK_NAME as SolanaNetwork,
          rpcUrl: process.env.DIALECT_SDK_SOLANA_RPC_URL,
        },
        dialectCloud: {
          url: process.env.DIALECT_SDK_DIALECT_CLOUD_URL,
        },
        wallet: NodeDialectWalletAdapter.create(),
      }),
    },
  ],
})
export class AppModule {}
