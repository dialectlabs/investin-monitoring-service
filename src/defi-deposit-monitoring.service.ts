import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DialectSdk } from './dialect-sdk';
import { Monitors, Pipelines } from '@dialectlabs/monitor';
import { INVESTMENT } from '@investin/client-sdk';
import { Duration } from 'luxon';
import { InvestinService, InvestmentsData } from './investin.service';

@Injectable()
export class DefiDepositMonitoringService implements OnModuleInit {

  private readonly logger = new Logger(DefiDepositMonitoringService.name);

  constructor(
    private readonly sdk: DialectSdk,
    private readonly investinService: InvestinService
  ) { }

  onModuleInit() {
    const monitor = Monitors.builder({
      sdk: this.sdk,
      sinks: {
        telegram: {
          telegramBotToken: process.env.TELEGRAM_TOKEN!,
        },
      },
    }).defineDataSource<InvestmentsData>()
      .poll(
        async (subscribers) => this.investinService.getDefiInvestments(subscribers),
        Duration.fromObject({ seconds: 60 }),
      )
      .transform<INVESTMENT[], INVESTMENT[]>({
        keys: ['investments'],
        pipelines: [Pipelines.added((fo1, fo2) => fo1.pubKey === (fo2.pubKey))],
      })
      .notify()
      .dialectSdk(
        ({ value, context }) => {
          const message: string = `You have recieved a deposit of $${value.map(f => (Number(f.amount_in_router) / 10 ** 6).toFixed(2)).join(',')}!`;

          this.logger.log(
            `${context.origin.subscriber} has recieved a deposit of $${value.map(f => (Number(f.amount_in_router) / 10 ** 6).toFixed(2)).join(',')}!`,
          );
          return {
            title: `Deposit Received!`,
            message,
          };
        },
        { dispatch: 'unicast', to: ({ origin }) => origin.subscriber },
      )
      .and()
      .build();
      monitor.start()
  }
}
