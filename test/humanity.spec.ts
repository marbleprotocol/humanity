import { Web3Wrapper } from '@0x/web3-wrapper';
import {
  ganacheProvider,
  BlockchainLifecycle
} from '@marbleprotocol/dev-utils';

import { chai } from './utils/chai_setup';
import { TX_DEFAULTS } from './utils/constants';

import { HumanityContract } from '../build/wrappers';
import { BigNumber } from '@0x/utils';

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

describe('Humanity', () => {
  let humanity: HumanityContract;
  let deployer: string;
  let registry: string;
  let human: string;
  let initialSupply: BigNumber;
  let finalSupply: BigNumber;
  let remainingSupply: BigNumber;

  before(async function() {
    [
      deployer,
      registry,
      human
    ] = await web3Wrapper.getAvailableAddressesAsync();
    // Mine a block to test non-zero deploy block
    await web3Wrapper.mineBlockAsync();
    humanity = await HumanityContract.deployAsync(
      provider,
      TX_DEFAULTS,
      registry
    );

    initialSupply = await humanity.INITIAL_SUPPLY.callAsync();
    finalSupply = await humanity.FINAL_SUPPLY.callAsync();
    remainingSupply = finalSupply.minus(initialSupply);
  });

  beforeEach(async function() {
    await blockchainLifecycle.startAsync();
  });

  afterEach(async function() {
    await blockchainLifecycle.revertAsync();
  });

  describe('initialize', async () => {
    snapshot();

    it('total supply should equal initial supply', async () => {
      const totalSupply = await humanity.totalSupply.callAsync();
      expect(totalSupply).to.be.bignumber.equal(initialSupply);
    });

    it('deployer should own initial supply', async () => {
      const deployerBalance = await humanity.balanceOf.callAsync(deployer);
      expect(deployerBalance).to.be.bignumber.equal(initialSupply);
    });
  });

  describe('mint', async () => {
    const mintAmount = new BigNumber('30000e18');

    describe('succeeds', async () => {
      snapshot();

      before(async () => {
        await humanity.mint.sendTransactionAsync(human, mintAmount, {
          from: registry
        });
      });

      it('should mint amount to address', async () => {
        const actualBalance = await humanity.balanceOf.callAsync(human);
        expect(actualBalance).to.be.bignumber.equal(mintAmount);
      });
    });

    describe('rejects', async () => {
      it('should reject if mint not called by registry', async () => {
        return expect(
          humanity.mint.sendTransactionAsync(human, mintAmount, {
            from: human
          })
        ).to.be.eventually.rejectedWith(
          'Humanity::mint: Only the registry can mint new tokens'
        );
      });

      it('should reject if mint amount exceeds total supply', async () => {
        const initialMintAmount = remainingSupply.minus(mintAmount.minus(1));
        await humanity.mint.sendTransactionAsync(human, initialMintAmount, {
          from: registry
        });

        return expect(
          humanity.mint.sendTransactionAsync(human, mintAmount, {
            from: registry
          })
        ).to.be.eventually.rejectedWith('Humanity::mint: Exceeds final supply');
      });

      it('should reject if total supply is already met', async () => {
        await humanity.mint.sendTransactionAsync(human, remainingSupply, {
          from: registry
        });

        return expect(
          humanity.mint.sendTransactionAsync(human, mintAmount, {
            from: registry
          })
        ).to.be.eventually.rejectedWith('Humanity::mint: Exceeds final supply');
      });
    });
  });
});
