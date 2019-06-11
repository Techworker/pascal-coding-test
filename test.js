const RpcTypes = require('@pascalcoin-sbx/json-rpc').Types;
const Coding = require('@pascalcoin-sbx/common').Coding;
const Endian = require('@pascalcoin-sbx/common').Endian;
const CompositeType = Coding.CompositeType;

// rpc values
let rpcAccountNormal = {
  account: 1002,
  enc_pubkey: 'CA0220001C0073E3793283C7ECBF9ABA90666B52649EFC3080881CB1925F75D6B24037ED2000942133FC0103004B3BA69107328E0A0F42E67EC550978422DECC61F62275A7BB',
  balance: 39284.2105 * 10000,
  n_operation: 13,
  updated_b: 319829,
  state: 'normal',
  name: 'pascalcoin-foundation-opex-spain',
  type: 0
};

let rpcAccountListed = {
  account: 1002,
  enc_pubkey: 'CA0220001C0073E3793283C7ECBF9ABA90666B52649EFC3080881CB1925F75D6B24037ED2000942133FC0103004B3BA69107328E0A0F42E67EC550978422DECC61F62275A7BB',
  balance: 39284.2105 * 10000,
  n_operation: 13,
  updated_b: 319829,
  state: 'listed',
  name: 'pascalcoin-foundation-opex-spain',
  type: 0,
  seller_account: 1234,
  locked_until_block: 350000,
  private_sale: false,
  price: 100 * 10000,
  new_enc_pubkey: 'CA0220001C0073E3793283C7ECBF9ABA90666B52649EFC3080881CB1925F75D6B24037ED2000942133FC0103004B3BA69107328E0A0F42E67EC550978422DECC61F62275A7BB'
};

// create rich objects
let richAccountNormal = RpcTypes.Account.createFromRPC(rpcAccountNormal);
let richAccountListed = RpcTypes.Account.createFromRPC(rpcAccountListed);

/**
 * Coder for plain RPC object
 */
class AccountRPCCoder extends CompositeType {
  constructor() {
    super('account_rpc');
    this.addSubType(new Coding.Core.Int32('account', true, Endian.LITTLE_ENDIAN));
    this.addSubType(new Coding.Core.StringWithLength('enc_pubkey'));
    this.addSubType(new Coding.Core.Int64('balance', true, Endian.LITTLE_ENDIAN));
    this.addSubType(new Coding.Core.Int32('n_operation'));
    this.addSubType(new Coding.Core.Int32('updated_b', true, Endian.LITTLE_ENDIAN));
    this.addSubType(new Coding.Core.StringWithLength('state'));
    this.addSubType(new Coding.Core.StringWithLength('name', 1));
    this.addSubType(new Coding.Core.Int16('type', true, Endian.LITTLE_ENDIAN));

    const decissiveCoder = new Coding.Decissive('is_listed_account', 'state', (state) => {
      if (state === 'listed') {
        let comp = new CompositeType('listing_data');

        comp.addSubType(new Coding.Core.Int32('locked_until_block', true, Endian.LITTLE_ENDIAN));
        comp.addSubType(new Coding.Core.Int64('price', true, Endian.LITTLE_ENDIAN));
        comp.addSubType(new Coding.Core.Int32('seller_account', true, Endian.LITTLE_ENDIAN));
        comp.addSubType(new Coding.Core.Int8('private_sale', true));
        comp.addSubType(new Coding.Core.StringWithLength('new_enc_pubkey'));

        return comp;
      }
      return new CompositeType('ignore');
    }, true);

    this.addSubType(decissiveCoder);
  }
}

/**
 * Coder for rpc object
 */
class AccountRichObjectCoder extends CompositeType {
  constructor() {
    super('account_rich_object');
    this.addSubType(new Coding.Pascal.AccountNumber('account'));
    this.addSubType(new Coding.Pascal.Keys.PublicKey('publicKey'));
    this.addSubType(new Coding.Pascal.Currency('balance'));
    this.addSubType(new Coding.Pascal.NOperation('nOperation'));
    this.addSubType(new Coding.Core.Int32('updatedB', true, Endian.LITTLE_ENDIAN));
    this.addSubType(new Coding.Core.StringWithLength('state'));
    this.addSubType(new Coding.Pascal.AccountName('name'));
    this.addSubType(new Coding.Core.Int16('type', true, Endian.LITTLE_ENDIAN));

    const decissiveCoder = new Coding.Decissive('is_listed_account', 'state', (state) => {
      if (state === 'listed') {
        let comp = new CompositeType('listing_data');

        comp.addSubType(new Coding.Core.Int32('lockedUntilBlock', true, Endian.LITTLE_ENDIAN));
        comp.addSubType(new Coding.Pascal.Currency('price', true, Endian.LITTLE_ENDIAN));
        comp.addSubType(new Coding.Pascal.AccountNumber('sellerAccount', true, Endian.LITTLE_ENDIAN));
        comp.addSubType(new Coding.Core.Int8('privateSale', true));
        comp.addSubType(new Coding.Pascal.Keys.PublicKey('newPublicKey'));

        return comp;
      }
      return new CompositeType('ignore');
    }, true);

    this.addSubType(decissiveCoder);
  }

  decodeFromBytes(bc, options = {
    toArray: false
  }, all = null) {
    return RpcTypes.Account.createFromSerialized(super.decodeFromBytes(bc, options, all));
  }
}

const rpcCoder = new AccountRPCCoder();
const richCoder = new AccountRichObjectCoder();

console.log('RPC JSON NORMAL size bytes:', JSON.stringify(rpcAccountNormal).length);
console.log('RPC JSON LISTED size bytes:', JSON.stringify(rpcAccountListed).length);
console.log('\n');

let tests = {
  normal: [rpcAccountNormal, richAccountNormal],
  listed: [rpcAccountListed, richAccountListed],
};

Object.keys(tests).forEach((testType) =>
{
  console.log('TESTING type: ' + testType);
  let rpcAccount = tests[testType][0];
  let richAccount = tests[testType][1];

  const rpcSerialized = rpcCoder.encodeToBytes(rpcAccount);
  const richSerialized = richCoder.encodeToBytes(richAccount);

  console.log('RPC');
  console.log('[' + rpcSerialized.length + ']: ' + rpcSerialized.toHex());
  console.log('-'.repeat(80));
  console.log('RICH');
  console.log('[' + richSerialized.length + ']: ' + richSerialized.toHex());

  const rpcDeserialized = rpcCoder.decodeFromBytes(rpcSerialized);
  const richDeserialized = richCoder.decodeFromBytes(richSerialized);


  console.log('-'.repeat(80));
  console.log('RPC Deserialized:');
  console.log(rpcDeserialized);
  console.log('-'.repeat(80));
  console.log('RICH Deserialized:');
  console.log(richDeserialized);
  console.log('-'.repeat(80));

  const ITERATIONS = 100000;

  const start_time_rich = Date.now();

  for (let i = 0; i < ITERATIONS; i++) {
    richCoder.decodeFromBytes(richCoder.encodeToBytes(richAccount));
  }
  const end_time_rich = Date.now();

  console.log(ITERATIONS, 'RICH iterations took', end_time_rich - start_time_rich, 'ms');

  const start_time_rpc = Date.now();

  for (let i = 0; i < ITERATIONS; i++) {
    rpcCoder.decodeFromBytes(rpcCoder.encodeToBytes(rpcAccount));
  }
  const end_time_rpc = Date.now();

  console.log(ITERATIONS, 'RPC iterations took', end_time_rpc - start_time_rpc, 'ms');

});

