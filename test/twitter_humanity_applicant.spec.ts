import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ganacheProvider, BlockchainLifecycle } from '@marbleprotocol/dev-utils';

import { chai } from './utils/chai_setup';
import { TX_DEFAULTS } from './utils/constants';

import {
  HumanityContract,
  HumanityGovernanceContract,
  HumanityRegistryContract,
  MockERC20Contract,
  MockUniswapContract,
  TwitterHumanityApplicantContract
} from '../build/wrappers';

const { expect } = chai;

const provider = ganacheProvider();
const blockchainLifecycle = new BlockchainLifecycle(provider);
const web3Wrapper = new Web3Wrapper(provider);

let human: string;
let jack: string;

const snapshot = () => {
  before(async function() {
    await blockchainLifecycle.startAsync();
  });

  after(async function() {
    await blockchainLifecycle.revertAsync();
  });
};

describe('TwitterHumanityApplicant', () => {
  snapshot();

  let humanity: MockERC20Contract;
  let governance: HumanityGovernanceContract;
  let registry: HumanityRegistryContract;
  let twitterApplicant: TwitterHumanityApplicantContract;
  let exchange: MockUniswapContract;

  const proposalId: BigNumber = new BigNumber('0');
  const TOTAL_VOTE_PERIOD = 14 * 24 * 60 * 60;
  const PROPOSAL_FEE = new BigNumber('1e18');

  before(async function() {
    [human, jack] = await web3Wrapper.getAvailableAddressesAsync();

    humanity = await MockERC20Contract.deployAsync(provider, TX_DEFAULTS);
    governance = await HumanityGovernanceContract.deployAsync(
      provider,
      TX_DEFAULTS,
      humanity.address,
      PROPOSAL_FEE
    );
    registry = await HumanityRegistryContract.deployAsync(
      provider,
      TX_DEFAULTS,
      humanity.address,
      governance.address
    );
    exchange = await MockUniswapContract.deployAsync(provider, TX_DEFAULTS, humanity.address);
    twitterApplicant = await TwitterHumanityApplicantContract.deployAsync(
      provider,
      TX_DEFAULTS,
      governance.address,
      registry.address,
      humanity.address,
      exchange.address
    );
    await humanity.mint.sendTransactionAsync(human, PROPOSAL_FEE);
    await humanity.approve.sendTransactionAsync(twitterApplicant.address, PROPOSAL_FEE);
  });

  beforeEach(async function() {
    await blockchainLifecycle.startAsync();
  });

  afterEach(async function() {
    await blockchainLifecycle.revertAsync();
  });

  describe('applyWithTwitter', async () => {
    snapshot();

    before(async () => {
      await twitterApplicant.applyWithTwitter.sendTransactionAsync('human');
    });

    it('should propose on governance to add sender to registry', async () => {
      const proposal = await governance.getProposal.callAsync(proposalId);
      expect(proposal.target).to.equal(registry.address);
    });

    it('should add user to the registry if proposal is successful', async () => {
      await web3Wrapper.increaseTimeAsync(TOTAL_VOTE_PERIOD + 1);
      await governance.finalize.sendTransactionAsync(proposalId);

      const result = await registry.isHuman.callAsync(human);
      expect(result).to.equal(true);
    });
  });

  describe('applyWithTwitterFor', async () => {
    snapshot();

    before(async () => {
      await twitterApplicant.applyWithTwitterFor.sendTransactionAsync(jack, 'jack');
    });

    it('should propose on governance to add sender to registry', async () => {
      const proposal = await governance.getProposal.callAsync(proposalId);
      expect(proposal.target).to.equal(registry.address);
    });

    it('should add user to the registry if proposal is successful', async () => {
      await web3Wrapper.increaseTimeAsync(TOTAL_VOTE_PERIOD + 1);
      await governance.finalize.sendTransactionAsync(proposalId);

      const result = await registry.isHuman.callAsync(jack);
      expect(result).to.equal(true);
    });
  });

  describe('applyWithTwitterUsingEther', async () => {
    snapshot();

    before(async () => {
      await humanity.mint.sendTransactionAsync(exchange.address, PROPOSAL_FEE);
      await twitterApplicant.applyWithTwitterUsingEther.sendTransactionAsync('human', {
        ...TX_DEFAULTS,
        value: new BigNumber('2000000000000000000')
      });
    });

    it('should propose on governance to add sender to registry', async () => {
      const proposal = await governance.getProposal.callAsync(proposalId);
      expect(proposal.target).to.equal(registry.address);
    });
  });

  describe('applyWithTwitterUsingEtherFor', async () => {
    snapshot();

    before(async () => {
      await humanity.mint.sendTransactionAsync(exchange.address, PROPOSAL_FEE);
      await twitterApplicant.applyWithTwitterUsingEtherFor.sendTransactionAsync(jack, 'jack', {
        ...TX_DEFAULTS,
        value: new BigNumber('2000000000000000000')
      });
    });

    it('should propose on governance to add sender to registry', async () => {
      const proposal = await governance.getProposal.callAsync(proposalId);
      expect(proposal.target).to.equal(registry.address);
    });
  });
});
