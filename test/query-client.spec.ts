/*
* @adonisjs/lucid
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/database.ts" />

import * as test from 'japa'
import { Connection } from '../src/Connection'
import { getConfig, setup, cleanup, getLogger } from '../test-helpers'

test.group('Query client', (group) => {
  group.before(async () => {
    await setup()
  })

  group.after(async () => {
    await cleanup()
  })

  test('get query client in dual mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()

    const client = connection.getClient()

    assert.equal(client.mode, 'dual')
    assert.isDefined(client['_client'])
    assert.isDefined(client['_readClient'])

    await connection.disconnect()
  })

  test('get query client in read only mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()

    const client = connection.getClient('read')

    assert.equal(client.mode, 'read')
    assert.isUndefined(client['_client'])
    assert.isDefined(client['_readClient'])

    await connection.disconnect()
  })

  test('get query client in write only mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()

    const client = connection.getClient('write')

    assert.equal(client.mode, 'write')
    assert.isDefined(client['_client'])
    assert.isUndefined(client['_readClient'])

    await connection.disconnect()
  })
})

test.group('Query client | dual mode', (group) => {
  group.before(async () => {
    await setup()
  })

  group.after(async () => {
    await cleanup()
  })

  test('perform select queries in dual mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient()

    const results = await client.query().from('users')
    assert.isArray(results)
    assert.lengthOf(results, 0)

    await connection.disconnect()
  })

  test('perform insert queries in dual mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient()

    await client.insertQuery().table('users').insert({ username: 'virk' })
    const results = await client.query().from('users')

    assert.isArray(results)
    assert.lengthOf(results, 1)
    assert.equal(results[0].username, 'virk')

    await connection.disconnect()
  })

  test('perform raw queries in dual mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient()

    const command = process.env.DB === 'sqlite' ? `DELETE FROM users;` : 'TRUNCATE users;'

    await client.insertQuery().table('users').insert({ username: 'virk' })
    await client.raw(command).exec()
    const results = await client.query().from('users')

    assert.isArray(results)
    assert.lengthOf(results, 0)

    await connection.disconnect()
  })

  test('perform queries inside a transaction in dual mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient()

    const trx = await client.transaction()
    await trx.insertQuery().table('users').insert({ username: 'virk' })
    await trx.rollback()

    const results = await client.query().from('users')

    assert.isArray(results)
    assert.lengthOf(results, 0)

    await connection.disconnect()
  })
})

test.group('Query client | read mode', (group) => {
  group.before(async () => {
    await setup()
  })

  group.after(async () => {
    await cleanup()
  })

  test('perform select queries in read mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient('read')

    const results = await client.query().from('users')
    assert.isArray(results)
    assert.lengthOf(results, 0)

    await connection.disconnect()
  })

  test('raise error when attempting to perform insert in read mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient('read')

    const fn = () => client.insertQuery()
    assert.throw(fn, 'Write client is not available for query client instantiated in read mode')

    await connection.disconnect()
  })

  test('perform raw queries in read mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient('read')

    const result = await client.raw('SELECT 1 + 1').exec()
    assert.isDefined(result)

    await connection.disconnect()
  })

  test('raise error when attempting to get transaction in read mode', async (assert) => {
    assert.plan(1)

    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient('read')

    try {
      await client.transaction()
    } catch ({ message }) {
      assert.equal(
        message,
        'E_RUNTIME_EXCEPTION: Write client is not available for query client instantiated in read mode',
      )
    }

    await connection.disconnect()
  })
})

test.group('Query client | write mode', (group) => {
  group.before(async () => {
    await setup()
  })

  group.after(async () => {
    await cleanup()
  })

  test('perform select queries in write mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient('write')

    const results = await client.query().from('users')
    assert.isArray(results)
    assert.lengthOf(results, 0)

    await connection.disconnect()
  })

  test('perform insert queries in write mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient('write')

    await client.insertQuery().table('users').insert({ username: 'virk' })
    const results = await client.query().from('users')

    assert.isArray(results)
    assert.lengthOf(results, 1)
    assert.equal(results[0].username, 'virk')

    await connection.disconnect()
  })

  test('perform raw queries in write mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient('write')

    const command = process.env.DB === 'sqlite' ? `DELETE FROM users;` : 'TRUNCATE users;'

    await client.insertQuery().table('users').insert({ username: 'virk' })
    await client.raw(command).exec()
    const results = await client.query().from('users')

    assert.isArray(results)
    assert.lengthOf(results, 0)

    await connection.disconnect()
  })

  test('perform queries inside a transaction in write mode', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()
    const client = connection.getClient('write')

    const trx = await client.transaction()
    await trx.insertQuery().table('users').insert({ username: 'virk' })
    await trx.rollback()

    const results = await client.query().from('users')

    assert.isArray(results)
    assert.lengthOf(results, 0)

    await connection.disconnect()
  })
})
