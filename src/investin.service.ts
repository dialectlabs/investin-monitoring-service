import { SourceData } from "@dialectlabs/monitor";
import { InvestinClient as InvestinDefiClient, INVESTMENT as  INVESTMENT_DEFI} from "@investin/client-sdk";
import { InvestinClient as InvestinMMClient, INVESTMENT_MM, programIdMM } from "client-mm-sdk";

import { PublicKey, Connection } from "@solana/web3.js";
import { Injectable, Logger } from '@nestjs/common';

export interface InvestmentsData {
    subscriber: PublicKey;
    investments: INVESTMENT_DEFI[];
}

export interface InvestmentsMMData {
    subscriber: PublicKey;
    investments: INVESTMENT_MM[];
}

const connection = new Connection(process.env.DIALECT_SDK_SOLANA_RPC_URL ?? 'https://investinpro.genesysgo.net');

@Injectable()
export class InvestinService {

    constructor() {}
    
    private readonly logger = new Logger(InvestinService.name);

    async getDefiInvestments (subscribers: PublicKey[]): Promise<SourceData<InvestmentsData>[]> {
        const client = new InvestinDefiClient(connection, 'mainnet');
        const investments = await client.fetchAllInvestments()
        const ok = subscribers.map(s => {
            const sourceData: SourceData<{ subscriber: PublicKey, investments: INVESTMENT_DEFI[] }> = {
                groupingKey: s.toBase58(),
                data: {
                    subscriber: s,
                    investments: investments.filter(f => Number(f.amount_in_router) > 0 && f.manager.toBase58() == s.toBase58())
                },
            };
            return sourceData;
        }).filter(k => k.data.investments.length > 0);

        return ok;
    };

    async getMMPendingInvestments (subscribers: PublicKey[]): Promise<SourceData<InvestmentsMMData>[]> {
        const client = new InvestinMMClient(connection, PublicKey.default );
        const investments = await client.fetchAllPendingDeposits()

        let ok : SourceData<{ subscriber: PublicKey, investments: INVESTMENT_MM[] }>[] = [];
        for (let index = 0; index < subscribers.length; index++) {
            const s = subscribers[index];
            if(s){
                const fundPDA = (await PublicKey.findProgramAddress([s.toBuffer()], programIdMM))[0];
                const sourceData: SourceData<{ subscriber: PublicKey, investments: INVESTMENT_MM[] }> = {
                    groupingKey: s.toBase58(),
                    data: {
                        subscriber: s,
                        investments: investments.filter(f => f.fund.toBase58() == fundPDA.toBase58())
                    },
                };
                ok.push(sourceData)
            }
            ok = ok.filter(k => k.data.investments.length > 0);
        }
        return ok;
    };

    async getMMPendingWithdraws (subscribers: PublicKey[]): Promise<SourceData<InvestmentsMMData>[]> {
        const client = new InvestinMMClient(connection, PublicKey.default );
        const investments = await client.fetchAllPendingWithdraws()

        let ok : SourceData<{ subscriber: PublicKey, investments: INVESTMENT_MM[] }>[] = [];
        for (let index = 0; index < subscribers.length; index++) {
            const s = subscribers[index];
            if(s){
                const fundPDA = (await PublicKey.findProgramAddress([s.toBuffer()], programIdMM))[0];
                const sourceData: SourceData<{ subscriber: PublicKey, investments: INVESTMENT_MM[] }> = {
                    groupingKey: s.toBase58(),
                    data: {
                        subscriber: s,
                        investments: investments.filter(f => f.fund.toBase58() == fundPDA.toBase58())
                    },
                };
                ok.push(sourceData)
            }
            ok = ok.filter(k => k.data.investments.length > 0);
        }
        return ok;
    };
}