import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DialectSdk } from './dialect-sdk';
import { Monitors, Pipelines } from '@dialectlabs/monitor';

import { Duration } from 'luxon';
import { InvestinService, InvestmentsData, InvestmentsMMData } from './investin.service';
import { INVESTMENT_MM } from 'client-mm-sdk';

@Injectable()
export class MMWithdrawMonitoringService implements OnModuleInit {

  private readonly logger = new Logger(MMWithdrawMonitoringService.name);

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
    }).defineDataSource<InvestmentsMMData>()
      .poll(
        async (subscribers) => this.investinService.getMMPendingWithdraws(subscribers),
        Duration.fromObject({ seconds: 60 }),
      )
      .transform<INVESTMENT_MM[], INVESTMENT_MM[]>({
        keys: ['investments'],
        pipelines: [Pipelines.added((fo1, fo2) => fo1.pubKey?.toBase58() === (fo2.pubKey?.toBase58()))],
      })
      .notify()
      .dialectSdk(
        ({ value, context }) => {
          const message: string = `You have recieved a Withdraw request of $${value.map(f => (Number(f.amount) / 10 ** 6).toFixed(2)).join(',')}!`;

          this.logger.log(
            `${context.origin.subscriber} has recieved a Withdraw request of $${value.map(f => (Number(f.amount) / 10 ** 6).toFixed(2)).join(',')}!`,
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
