import { SourceData } from "@dialectlabs/monitor";
import { InvestinClient, INVESTMENT } from "@investin/client-sdk";
import { PublicKey, Connection } from "@solana/web3.js";
import { Injectable, Logger } from '@nestjs/common';

export interface InvestmentsData {
    subscriber: PublicKey;
    investments: INVESTMENT[];
}

const connection = new Connection( process.env.DIALECT_SDK_SOLANA_RPC_URL ?? 'https://investinpro.genesysgo.net');

@Injectable()
export class InvestinService {

    constructor() {}
    
    private readonly logger = new Logger(InvestinService.name);

    async getDefiInvestments (subscribers: PublicKey[]): Promise<SourceData<InvestmentsData>[]> {
        const client = new InvestinClient(connection, 'mainnet');
        const investments = await client.fetchAllInvestments()
        const ok = subscribers.map(s => {
            const sourceData: SourceData<{ subscriber: PublicKey, investments: INVESTMENT[] }> = {
                groupingKey: s.toBase58(),
                data: {
                    subscriber: s,
                    investments: investments.filter(f => Number(f.amount_in_router) > 0 && f.manager.toBase58() == s.toBase58())
                },
            };
            return sourceData;
        }).filter(k => k.data.investments.length > 0);

        // if (ok.length) {
        //     // console.log('ok ::: ', ok.length)
        //     console.log('ok ::: ', ok[0]?.data.investments)
        //   }

        return ok;
    };
}