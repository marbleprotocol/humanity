import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ganacheProvider, BlockchainLifecycle } from '@marbleprotocol/dev-utils';
import { randomHex } from 'web3-utils';

import { chai } from './utils/chai_setup';
import { TX_DEFAULTS } from './utils/constants';

import { HumanityRegistryContract, MockERC20Contract } from '../build/wrappers';

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

describe('HumanityRegistry', () => {
  let registry: HumanityRegistryContract;
  let humanity: MockERC20Contract;
  let human: string;
  let governance: string;
  let random: string;
  let user50: string;
  let user500: string;
  let user5000: string;

  before(async function() {
    [
      human,
      governance,
      random,
      user50,
      user500,
      user5000
    ] = await web3Wrapper.getAvailableAddressesAsync();

    humanity = await MockERC20Contract.deployAsync(provider, TX_DEFAULTS);
    registry = await HumanityRegistryContract.deployAsync(
      provider,
      TX_DEFAULTS,
      humanity.address,
      governance
    );
  });

  beforeEach(async function() {
    await blockchainLifecycle.startAsync();
  });

  afterEach(async function() {
    await blockchainLifecycle.revertAsync();
  });

  describe('add', async () => {
    describe('succeeds', async () => {
      let humanHUMBalanceBefore: BigNumber;

      describe('first 100', async () => {
        const humanityTotalSupplyBefore = new BigNumber(0);
        const supplyIncrease = new BigNumber('30000e18');

        snapshot();

        before(async () => {
          humanHUMBalanceBefore = await humanity.balanceOf.callAsync(human);
          await registry.add.sendTransactionAsync(human, { from: governance });
        });

        it('should add an identity to the registry', async () => {
          const isHuman = await registry.isHuman.callAsync(human);
          expect(isHuman).to.equal(true);
        });

        it('should increase human HUM balance by 30000e18', async () => {
          const expectedHumanHumBalance = humanHUMBalanceBefore.plus(supplyIncrease);
          const actualBalance = await humanity.balanceOf.callAsync(human);
          expect(actualBalance).to.bignumber.equal(expectedHumanHumBalance);
        });

        it('should increase total supply by 30000e18', async () => {
          const expectedTotalSupply = humanityTotalSupplyBefore.plus(supplyIncrease);
          const actualTotalSupply = await humanity.totalSupply.callAsync();
          expect(actualTotalSupply).to.bignumber.equal(expectedTotalSupply);
        });
      });

      describe('first 1000', async () => {
        const humanityTotalSupplyBefore = new BigNumber('28000000e18');
        const supplyIncrease = new BigNumber('20000e18');

        snapshot();

        before(async () => {
          await humanity.mint.sendTransactionAsync(random, humanityTotalSupplyBefore);
          humanHUMBalanceBefore = await humanity.balanceOf.callAsync(human);
          await registry.add.sendTransactionAsync(human, { from: governance });
        });

        it('should add an identity to the registry', async () => {
          const isHuman = await registry.isHuman.callAsync(human);
          expect(isHuman).to.equal(true);
        });

        it('should increase human HUM balance by 20000e18', async () => {
          const expectedHumanHumBalance = humanHUMBalanceBefore.plus(supplyIncrease);
          const actualBalance = await humanity.balanceOf.callAsync(human);
          expect(actualBalance).to.bignumber.equal(expectedHumanHumBalance);
        });

        it('should increase total supply by 20000e18', async () => {
          const expectedTotalSupply = humanityTotalSupplyBefore.plus(supplyIncrease);
          const actualTotalSupply = await humanity.totalSupply.callAsync();
          expect(actualTotalSupply).to.bignumber.equal(expectedTotalSupply);
        });
      });

      describe('first 10000', async () => {
        const humanityTotalSupplyBefore = new BigNumber('46000000e18');
        const supplyIncrease = new BigNumber('6000e18');

        snapshot();

        before(async () => {
          await humanity.mint.sendTransactionAsync(random, humanityTotalSupplyBefore);
          humanHUMBalanceBefore = await humanity.balanceOf.callAsync(human);
          await registry.add.sendTransactionAsync(human, { from: governance });
        });

        it('should add an identity to the registry', async () => {
          const isHuman = await registry.isHuman.callAsync(human);
          expect(isHuman).to.equal(true);
        });

        it('should increase human HUM balance by 6000e18', async () => {
          const expectedHumanHumBalance = humanHUMBalanceBefore.plus(supplyIncrease);
          const actualBalance = await humanity.balanceOf.callAsync(human);
          expect(actualBalance).to.bignumber.equal(expectedHumanHumBalance);
        });

        it('should increase total supply by 6000e18', async () => {
          const expectedTotalSupply = humanityTotalSupplyBefore.plus(supplyIncrease);
          const actualTotalSupply = await humanity.totalSupply.callAsync();
          expect(actualTotalSupply).to.bignumber.equal(expectedTotalSupply);
        });
      });

      describe('after 10000', async () => {
        const humanityTotalSupplyBefore = new BigNumber('100000000e18');

        snapshot();

        before(async () => {
          await humanity.mint.sendTransactionAsync(random, humanityTotalSupplyBefore);
          humanHUMBalanceBefore = await humanity.balanceOf.callAsync(human);
          await registry.add.sendTransactionAsync(human, { from: governance });
        });

        it('should add an identity to the registry', async () => {
          const isHuman = await registry.isHuman.callAsync(human);
          expect(isHuman).to.equal(true);
        });

        it('should not increase human HUM balance', async () => {
          const actualBalance = await humanity.balanceOf.callAsync(human);
          expect(actualBalance).to.bignumber.equal(humanHUMBalanceBefore);
        });

        it('should not increase total supply', async () => {
          const actualTotalSupply = await humanity.totalSupply.callAsync();
          expect(actualTotalSupply).to.bignumber.equal(humanityTotalSupplyBefore);
        });
      });

      describe('with 10000 adds to registry', async () => {
        const humanityTotalSupplyBefore = new BigNumber('25000000e18');

        snapshot();

        before(async () => {
          await humanity.mint.sendTransactionAsync(random, humanityTotalSupplyBefore);
          for (let i = 0; i < 10000; i++) {
            let user: string;
            if (i == 49) {
              user = user50;
            } else if (i == 499) {
              user = user500;
            } else if (i == 4999) {
              user = user5000;
            } else {
              user = randomHex(20);
            }

            await registry.add.sendTransactionAsync(user, {
              from: governance
            });
          }
        });

        it('should set HUM Balance of 50th user to 30000e18', async () => {
          const expected = new BigNumber('30000e18');
          const actualBalance = await humanity.balanceOf.callAsync(user50);
          expect(actualBalance).to.bignumber.equal(expected);
        });

        it('should set HUM Balance of 500th user to 20000e18', async () => {
          const expected = new BigNumber('20000e18');
          const actualBalance = await humanity.balanceOf.callAsync(user500);
          expect(actualBalance).to.bignumber.equal(expected);
        });

        it('should set HUM Balance of 5000th user to 6000e18', async () => {
          const expected = new BigNumber('6000e18');
          const actualBalance = await humanity.balanceOf.callAsync(user5000);
          expect(actualBalance).to.bignumber.equal(expected);
        });

        it('should have 100000000e18 total supply', async () => {
          const expectedTotalSupply = new BigNumber('100000000e18');
          const actualTotalSupply = await humanity.totalSupply.callAsync();
          expect(actualTotalSupply).to.bignumber.equal(expectedTotalSupply);
        });
      });
    });

    describe('rejects', async () => {
      it('should revert if not called by governance', async () => {
        return expect(
          registry.add.sendTransactionAsync(human, { from: human })
        ).to.be.eventually.rejectedWith(
          'HumanityRegistry::add: Only governance can add an identity'
        );
      });
    });
  });

  describe('remove', async () => {
    snapshot();

    before(async () => {
      await registry.add.sendTransactionAsync(human, { from: governance });
    });

    it('should remove an identity if the sender is governance', async () => {
      await registry.remove.sendTransactionAsync(human, { from: governance });
      const isHuman = await registry.isHuman.callAsync(human);
      expect(isHuman).to.equal(false);
    });

    it('should remove an identity if the sender is the identity', async () => {
      await registry.remove.sendTransactionAsync(human, { from: human });
      const isHuman = await registry.isHuman.callAsync(human);
      expect(isHuman).to.equal(false);
    });

    it('should revert if not called by governance or the identity', async () => {
      return expect(
        registry.remove.sendTransactionAsync(human, { from: random })
      ).to.be.eventually.rejectedWith(
        'HumanityRegistry::remove: Only governance or the identity owner can remove an identity'
      );
    });
  });
});
