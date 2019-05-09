import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import {
  ganacheProvider,
  BlockchainLifecycle
} from '@marbleprotocol/dev-utils';

import { chai } from './utils/chai_setup';
import { TX_DEFAULTS } from './utils/constants';
import { getAddress, getNonce } from './utils/utils';

import { FaucetContract, MockERC20Contract } from '../build/wrappers';

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

describe('Faucet', () => {
  const exchange: string = '0xcafecafecafecafecafecafecafecafecafecafe';
  const initialSupply = new BigNumber('5000000e18');

  let faucet: FaucetContract;
  let humanity: MockERC20Contract;
  let deployer: string;
  let deployBlock: number;
  let blockReward: BigNumber;

  before(async function() {
    [deployer] = await web3Wrapper.getAvailableAddressesAsync();
    // Mine a block to test non-zero deploy block
    await web3Wrapper.mineBlockAsync();
    humanity = await MockERC20Contract.deployAsync(provider, TX_DEFAULTS);
    const nonce = await getNonce(web3Wrapper, TX_DEFAULTS.from);
    const faucetAddress = getAddress(TX_DEFAULTS.from, nonce + 1);
    await humanity.mint.sendTransactionAsync(faucetAddress, initialSupply);
    faucet = await FaucetContract.deployAsync(
      provider,
      TX_DEFAULTS,
      humanity.address,
      exchange
    );
    deployBlock = await web3Wrapper.getBlockNumberAsync();
    blockReward = await faucet.BLOCK_REWARD.callAsync();
  });

  beforeEach(async function() {
    await blockchainLifecycle.startAsync();
  });

  afterEach(async function() {
    await blockchainLifecycle.revertAsync();
  });

  describe('mine', async () => {
    snapshot();

    before(async () => {
      await faucet.mine.sendTransactionAsync();
    });

    it('should advance one block', async () => {
      const block = await web3Wrapper.getBlockNumberAsync();
      expect(block).to.be.equal(deployBlock + 1);
    });

    it('should mine correct amount after one block', async () => {
      const exchangeBalance = await humanity.balanceOf.callAsync(exchange);
      expect(exchangeBalance).to.be.bignumber.equal(blockReward);
    });

    it('last mined block should update', async () => {
      const lastMined = await faucet.lastMined.callAsync();
      expect(lastMined.toNumber()).to.equal(deployBlock + 1);
    });
  });
});
