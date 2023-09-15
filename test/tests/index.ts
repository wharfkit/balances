import {strict as assert} from 'assert'

import {Asset, Serializer} from '@wharfkit/antelope'
import {makeClient} from '@wharfkit/mock-data'

import * as SystemTokenContract from '../../src/contracts/system.token'

const apiClient = makeClient('https://jungle4.greymass.com')

import {Token} from '../../src'

suite('Token', function () {
    const token = new Token({
        client: apiClient,
    })

    this.slow(20000)

    suite('balance()', function () {
        test('returns the system token balance of an account when no symbol code is passed', async function () {
            const result = await token.balance('teamgreymass')
            assert.equal(result instanceof Asset, true)
            assert.equal(String(result.symbol.code), 'EOS')
        })

        test('returns the balance of an account for a specific symbol', async function () {
            const result = await token.balance('teamgreymass', 'EOS')
            assert.equal(result instanceof Asset, true)
            assert.equal(String(result.symbol.code), 'EOS')
        })

        test('throws an error when the account does not exist', async function () {
            await assert.rejects(
                () => token.balance('notanaccount'),
                "Account 'notanaccount' does not exist."
            )
        })

        test('throws an error when the symbol does not exist', async function () {
            await assert.rejects(
                () => token.balance('teamgreymass', 'NOT'),
                "Symbol 'NOT' does not exist."
            )
        })
    })

    suite('transfer()', function () {
        test('creates a transfer action', async function () {
            const action = await token.transfer(
                'teamgreymass',
                'teamgreymass',
                1.32,
                'this is a test'
            )

            assert.equal(String(action.account), 'eosio.token')
            assert.equal(String(action.name), 'transfer')

            const decoded = Serializer.decode({
                data: action.data,
                type: SystemTokenContract.Types.Transfer,
            })
            assert.equal(String(decoded.from), 'teamgreymass')
            assert.equal(String(decoded.to), 'teamgreymass')
            assert.equal(String(decoded.quantity), '1.3200 EOS')
            assert.equal(String(decoded.memo), 'this is a test')
        })

        test('throws an error when one of the accounts does not exist', async function () {
            await assert.rejects(() => token.transfer('teamgreymass', 'notanaccount', 1.32))
            await assert.rejects(() => token.transfer('notanaccount', 'teamgreymass', 1.32))
        })

        test('throws an error when the balance of the sender is too low', async function () {
            await assert.rejects(() => token.transfer('teamgreymass', 'dafuga.gm', 10000000))
        })
    })
})
