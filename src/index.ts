import {APIClient, Asset, AssetType, Name, NameType} from '@wharfkit/antelope'
import * as SystemTokenContract from './contracts/system.token'
import {Contract} from '@wharfkit/contract'

interface TokenOptions {
    client: APIClient
    tokenSymbol?: Asset.SymbolType
    contract?: Contract
}

export class Token {
    readonly contract: Contract

    constructor({contract, client}: TokenOptions) {
        this.contract = contract || new SystemTokenContract.Contract({client})
    }

    async transfer(from: NameType, to: NameType, amount: AssetType, memo = '') {
        const quantity = Asset.from(amount)

        return this.contract.action('transfer', {
            from: Name.from(from),
            to: Name.from(to),
            quantity,
            memo,
        })
    }

    balance(accountName: NameType, symbolCode?: Asset.SymbolCodeType): Promise<Asset> {
        const table = this.contract.table('accounts', accountName)

        let tableQuery

        if (symbolCode) {
            tableQuery = table.get(String(symbolCode), {index_position: 'primary'})
        } else {
            tableQuery = table.get()
        }

        return tableQuery
            .then((accountBalance) => {
                if (!accountBalance) {
                    throw new Error(`Account ${accountName} does not exist.`)
                }

                if (symbolCode && !accountBalance.balance.symbol.code.equals(symbolCode)) {
                    throw new Error(`Symbol '${symbolCode}' does not exist.`)
                }

                return accountBalance?.balance
            })
            .catch((err) => {
                throw new Error(`Failed to fetch balance for ${accountName}: ${err}`)
            })
    }
}
