import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ganacheProvider, BlockchainLifecycle } from '@marbleprotocol/dev-utils';

import { chai } from './utils/chai_setup';
import { TX_DEFAULTS } from './utils/constants';

import {
  MockERC20Contract,
  MockHumanityRegistryContract,
  UniversalBasicIncomeContract
} from '../build/wrappers';

const { expect } = chai;

const provider = ganacheProvider();
const blockchainLifecycle = new BlockchainLifecycle(provider);
const web3Wrapper = new Web3Wrapper(provider);

const snapshot = () => {
  before(async function() {
    await blockchainLifecycle.startAsync();
  });

  after(async function() {
    await blockchainLifecycle.revertAsync();
  });
};

describe('UniversalBasicIncome', () => {
  snapshot();

  let dai: MockERC20Contract;
  let registry: MockHumanityRegistryContract;
  let ubi: UniversalBasicIncomeContract;
  let human: string;

  const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

  before(async function() {
    [human] = await web3Wrapper.getAvailableAddressesAsync();
    dai = await MockERC20Contract.deployAsync(provider, TX_DEFAULTS);
    registry = await MockHumanityRegistryContract.deployAsync(provider, TX_DEFAULTS);
    ubi = await UniversalBasicIncomeContract.deployAsync(
      provider,
      TX_DEFAULTS,
      registry.address,
      dai.address
    );
    await dai.mint.sendTransactionAsync(ubi.address, new BigNumber('10000e18'));
  });

  beforeEach(async function() {
    await blockchainLifecycle.startAsync();
  });

  afterEach(async function() {
    await blockchainLifecycle.revertAsync();
  });

  it('an account on the registry should be able to initially claim one month of UBI', async () => {
    await ubi.claim.sendTransactionAsync();
    const balance = await dai.balanceOf.callAsync(human);
    expect(balance).to.be.bignumber.equal(new BigNumber('1e18'));
  });

  it('an account on the registry should be able to claim UBI at any time', async () => {
    await ubi.claim.sendTransactionAsync();
    await web3Wrapper.increaseTimeAsync(ONE_DAY_IN_SECONDS);
    await web3Wrapper.mineBlockAsync();
    await ubi.claim.sendTransactionAsync();
    const incomePerSecond = await ubi.INCOME_PER_SECOND.callAsync();
    // Expect initial 1 Dai plus 1 day of UBI at 12 Dai / year rate
    const expected = new BigNumber('1e18').plus(incomePerSecond.times(ONE_DAY_IN_SECONDS));
    const balance = await dai.balanceOf.callAsync(human);
    expect(balance).to.be.bignumber.equal(expected);
  });

  it('an account NOT on the registry should NOT be able to claim UBI', async () => {
    await registry.setResult.sendTransactionAsync(false);
    return expect(ubi.claim.sendTransactionAsync()).to.be.rejectedWith(
      'UniversalBasicIncome::claim: You must be on the Humanity registry to claim income'
    );
  });
});
