import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ganacheProvider, BlockchainLifecycle } from '@marbleprotocol/dev-utils';
import { AbiCoder } from 'web3-eth-abi';

import {
  HumanityGovernanceContract,
  MockERC20Contract,
  MockTargetContract
} from '../build/wrappers';

import { chai } from './utils/chai_setup';
import { TX_DEFAULTS } from './utils/constants';
import { Result, Proposal } from './utils/types';

const { expect } = chai;
const abi = new AbiCoder();

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

describe('HumanityGovernance', () => {
  let humanity: MockERC20Contract;
  let governance: HumanityGovernanceContract;
  let target: MockTargetContract;
  let voter: string;
  let data: string;
  let OPEN_VOTE_PERIOD = 7 * 24 * 60 * 60;
  let TOTAL_VOTE_PERIOD = 14 * 24 * 60 * 60;
  const ISSUE_AMOUNT = new BigNumber('100e18');
  const DEPOSIT_AMOUNT = new BigNumber('5e18');
  const WITHDRAW_AMOUNT = new BigNumber('3e18');
  const PROPOSAL_ID = new BigNumber('0');
  const PROPOSAL_FEE = new BigNumber('1e18');

  before(async function() {
    [voter] = await web3Wrapper.getAvailableAddressesAsync();
    humanity = await MockERC20Contract.deployAsync(provider, TX_DEFAULTS);
    governance = await HumanityGovernanceContract.deployAsync(
      provider,
      TX_DEFAULTS,
      humanity.address,
      new BigNumber('1e18')
    );
    OPEN_VOTE_PERIOD = (await governance.OPEN_VOTE_PERIOD.callAsync()).toNumber();
    TOTAL_VOTE_PERIOD = (await governance.TOTAL_VOTE_PERIOD.callAsync()).toNumber();
    target = await MockTargetContract.deployAsync(provider, TX_DEFAULTS);
    data = await target.data.callAsync();
    await humanity.mint.sendTransactionAsync(voter, ISSUE_AMOUNT);
    await humanity.approve.sendTransactionAsync(governance.address, ISSUE_AMOUNT);
  });

  beforeEach(async function() {
    await blockchainLifecycle.startAsync();
  });

  afterEach(async function() {
    await blockchainLifecycle.revertAsync();
  });

  describe('deposit', async () => {
    snapshot();

    let voterHumanityBefore: BigNumber;
    let voterDepositsBefore: BigNumber;

    before(async () => {
      voterHumanityBefore = await humanity.balanceOf.callAsync(voter);
      voterDepositsBefore = await governance.deposits.callAsync(voter);
      await governance.deposit.sendTransactionAsync(DEPOSIT_AMOUNT);
    });

    it('should pull deposit amount from sender', async () => {
      const voterHumanityAfter = await humanity.balanceOf.callAsync(voter);
      const expected = voterHumanityBefore.minus(DEPOSIT_AMOUNT);
      expect(voterHumanityAfter).to.be.bignumber.equal(expected);
    });

    it('should increase sender deposits', async () => {
      const voterDepositsAfter = await governance.deposits.callAsync(voter);
      const expected = voterDepositsBefore.plus(DEPOSIT_AMOUNT);
      expect(voterDepositsAfter).to.be.bignumber.equal(expected);
    });
  });

  describe('withdraw', async () => {
    snapshot();

    let voterHumanityBefore: BigNumber;
    let voterDepositsBefore: BigNumber;

    before(async () => {
      await governance.deposit.sendTransactionAsync(DEPOSIT_AMOUNT);
      voterHumanityBefore = await humanity.balanceOf.callAsync(voter);
      voterDepositsBefore = await governance.deposits.callAsync(voter);
      await governance.withdraw.sendTransactionAsync(WITHDRAW_AMOUNT);
    });

    it('should push withdraw amount to sender', async () => {
      const voterHumanityAfter = await humanity.balanceOf.callAsync(voter);
      const expected = voterHumanityBefore.plus(WITHDRAW_AMOUNT);
      expect(voterHumanityAfter).to.be.bignumber.equal(expected);
    });

    it('should decrease sender deposits', async () => {
      const voterDepositsAfter = await governance.deposits.callAsync(voter);
      const expected = voterDepositsBefore.minus(WITHDRAW_AMOUNT);
      expect(voterDepositsAfter).to.be.bignumber.equal(expected);
    });

    it('should fail if sender has participated in an active proposal', async () => {
      await governance.propose.sendTransactionAsync(target.address, data);
      await governance.voteYes.sendTransactionAsync(PROPOSAL_ID);
      return expect(governance.withdraw.sendTransactionAsync(WITHDRAW_AMOUNT)).to.be.rejectedWith(
        'Governance::withdraw: Voters with an active proposal cannot withdraw'
      );
    });
  });

  describe('propose', async () => {
    snapshot();

    let proposal: Proposal;

    before(async () => {
      await governance.propose.sendTransactionAsync(target.address, data);
      proposal = await governance.getProposal.callAsync(PROPOSAL_ID);
    });

    it('proposal should not be finalized', async () => {
      expect(proposal.result).to.equal(Result.Pending);
    });

    it('proposal should have the correct target', async () => {
      expect(proposal.target).to.equal(target.address);
    });

    it('proposal should have the correct data', async () => {
      expect(proposal.data).to.equal(data);
    });

    it('proposal should have the correct proposer', async () => {
      expect(proposal.proposer).to.equal(voter);
    });

    it('proposal should have the correct fee', async () => {
      expect(proposal.fee).to.be.bignumber.equal(PROPOSAL_FEE);
    });

    it('proposal should have the correct start time', async () => {
      const expected = await web3Wrapper.getBlockTimestampAsync('latest');
      expect(proposal.startTime).to.be.bignumber.equal(expected);
    });

    it('proposal should have yes count equal to proposal fee', async () => {
      expect(proposal.yesCount).to.be.bignumber.equal(PROPOSAL_FEE);
    });

    it('proposal should have no count of zero', async () => {
      expect(proposal.noCount).to.be.bignumber.equal(new BigNumber('0'));
    });
  });

  describe('voteYes', async () => {
    snapshot();

    let yesCountBefore: BigNumber;

    before(async () => {
      await governance.propose.sendTransactionAsync(target.address, data);
      await governance.deposit.sendTransactionAsync(DEPOSIT_AMOUNT);
      yesCountBefore = (await governance.getProposal.callAsync(PROPOSAL_ID)).yesCount;
      await governance.voteYes.sendTransactionAsync(PROPOSAL_ID);
    });

    it('should increase yes count of proposal if voter has not already voted yes', async () => {
      const yesCountAfter = (await governance.getProposal.callAsync(PROPOSAL_ID)).yesCount;
      const expected = yesCountBefore.plus(DEPOSIT_AMOUNT);
      expect(yesCountAfter).to.be.bignumber.equal(expected);
    });

    it('should have no effect if voter has already voted yes', async () => {
      await governance.voteYes.sendTransactionAsync(PROPOSAL_ID);
      const yesCountAfter = (await governance.getProposal.callAsync(PROPOSAL_ID)).yesCount;
      const expected = yesCountBefore.plus(DEPOSIT_AMOUNT);
      expect(yesCountAfter).to.be.bignumber.equal(expected);
    });

    it('should revert if after yes period', async () => {
      await web3Wrapper.increaseTimeAsync(OPEN_VOTE_PERIOD + 1);
      await web3Wrapper.mineBlockAsync();
      return expect(governance.voteYes.sendTransactionAsync(PROPOSAL_ID)).to.be.rejectedWith(
        'Governance::voteYes: Proposal is no longer accepting yes votes'
      );
    });
  });

  describe('voteNo', async () => {
    snapshot();

    let noCountBefore: BigNumber;

    before(async () => {
      await governance.propose.sendTransactionAsync(target.address, data);
      await governance.deposit.sendTransactionAsync(DEPOSIT_AMOUNT);
      noCountBefore = (await governance.getProposal.callAsync(PROPOSAL_ID)).noCount;
    });

    it('should increase no count of proposal if voter has not already voted no', async () => {
      await governance.voteNo.sendTransactionAsync(PROPOSAL_ID);
      const noCountAfter = (await governance.getProposal.callAsync(PROPOSAL_ID)).noCount;
      const expected = noCountBefore.plus(DEPOSIT_AMOUNT);
      expect(noCountAfter).to.be.bignumber.equal(expected);
    });

    it('should have no effect if voter has already voted no', async () => {
      await governance.voteNo.sendTransactionAsync(PROPOSAL_ID);
      await governance.voteNo.sendTransactionAsync(PROPOSAL_ID);
      const noCountAfter = (await governance.getProposal.callAsync(PROPOSAL_ID)).noCount;
      const expected = noCountBefore.plus(DEPOSIT_AMOUNT);
      expect(noCountAfter).to.be.bignumber.equal(expected);
    });

    it('should not terminate if in yes voting period', async () => {
      await governance.voteNo.sendTransactionAsync(PROPOSAL_ID);
      const result = (await governance.getProposal.callAsync(PROPOSAL_ID)).result;
      expect(result).to.equal(Result.Pending);
    });

    it('should not terminate if yes outnumbers no and yes period is over', async () => {
      await governance.voteYes.sendTransactionAsync(PROPOSAL_ID);
      await web3Wrapper.increaseTimeAsync(OPEN_VOTE_PERIOD + 1);
      await web3Wrapper.mineBlockAsync();
      const [, randomVoter] = await web3Wrapper.getAvailableAddressesAsync();
      await governance.voteNo.sendTransactionAsync(PROPOSAL_ID, { from: randomVoter });
      const result = (await governance.getProposal.callAsync(PROPOSAL_ID)).result;
      expect(result).to.equal(Result.Pending);
    });

    it('should terminate if no votes outnumber yes votes and yes period is over', async () => {
      await web3Wrapper.increaseTimeAsync(OPEN_VOTE_PERIOD + 1);
      await web3Wrapper.mineBlockAsync();
      await governance.voteNo.sendTransactionAsync(PROPOSAL_ID);
      const result = (await governance.getProposal.callAsync(PROPOSAL_ID)).result;
      expect(result).to.equal(Result.No);
    });

    it('should revert if proposal is not pending', async () => {
      await web3Wrapper.increaseTimeAsync(OPEN_VOTE_PERIOD + 1);
      await web3Wrapper.mineBlockAsync();
      await governance.voteNo.sendTransactionAsync(PROPOSAL_ID);
      return expect(governance.voteNo.sendTransactionAsync(PROPOSAL_ID)).to.be.rejectedWith(
        'Governance::voteNo: Proposal is already finalized'
      );
    });
  });

  describe('removeVote', async () => {
    snapshot();

    let yesCountBefore: BigNumber;
    let noCountBefore: BigNumber;

    before(async () => {
      await governance.propose.sendTransactionAsync(target.address, data);
      await governance.deposit.sendTransactionAsync(DEPOSIT_AMOUNT);
      await governance.voteYes.sendTransactionAsync(PROPOSAL_ID);
      await governance.voteNo.sendTransactionAsync(PROPOSAL_ID);
      const proposal = await governance.getProposal.callAsync(PROPOSAL_ID);
      yesCountBefore = proposal.yesCount;
      noCountBefore = proposal.noCount;
      await governance.removeVote.sendTransactionAsync(PROPOSAL_ID);
    });

    it('should decrease yes count if voter has voted yes', async () => {
      const yesCountAfter = (await governance.getProposal.callAsync(PROPOSAL_ID)).yesCount;
      const expected = yesCountBefore.minus(DEPOSIT_AMOUNT);
      expect(yesCountAfter).to.be.bignumber.equal(expected);
    });

    it('should decrease no count if voter has voted no', async () => {
      const noCountAfter = (await governance.getProposal.callAsync(PROPOSAL_ID)).noCount;
      const expected = noCountBefore.minus(DEPOSIT_AMOUNT);
      expect(noCountAfter).to.be.bignumber.equal(expected);
    });

    it('should have no effect if voter has not voted', async () => {
      await governance.removeVote.sendTransactionAsync(PROPOSAL_ID);
      const proposal = await governance.getProposal.callAsync(PROPOSAL_ID);
      expect(proposal.yesCount).to.be.bignumber.equal(PROPOSAL_FEE);
      expect(proposal.noCount).to.be.bignumber.equal(new BigNumber('0'));
    });
  });

  describe('finalize', async () => {
    snapshot();

    before(async () => {
      await governance.deposit.sendTransactionAsync(DEPOSIT_AMOUNT);
    });

    it('should execute the proposal if yes votes outnumber no votes', async () => {
      await governance.propose.sendTransactionAsync(target.address, data);
      await web3Wrapper.increaseTimeAsync(TOTAL_VOTE_PERIOD + 1);
      await web3Wrapper.mineBlockAsync();
      await governance.finalize.sendTransactionAsync(PROPOSAL_ID);
      const proposal = await governance.getProposal.callAsync(PROPOSAL_ID);
      expect(proposal.result).to.equal(Result.Yes);
      const value = await target.value.callAsync();
      expect(value).to.be.bignumber.equal(new BigNumber('4')); // The value has been set
    });

    it('should terminate proposal if no votes outnumber yes votes', async () => {
      await governance.propose.sendTransactionAsync(target.address, data);
      await governance.voteNo.sendTransactionAsync(PROPOSAL_ID);
      await web3Wrapper.increaseTimeAsync(TOTAL_VOTE_PERIOD + 1);
      await web3Wrapper.mineBlockAsync();
      await governance.finalize.sendTransactionAsync(PROPOSAL_ID);
      const proposal = await governance.getProposal.callAsync(PROPOSAL_ID);
      expect(proposal.result).to.equal(Result.No);
      const value = await target.value.callAsync();
      expect(value).to.be.bignumber.equal(new BigNumber('0')); // The value has not been set
    });

    it('should revert if proposal is still active', async () => {
      await governance.propose.sendTransactionAsync(target.address, data);
      return expect(governance.finalize.sendTransactionAsync(PROPOSAL_ID)).to.be.rejectedWith(
        'Governance::finalize: Proposal cannot be executed until end of veto period'
      );
    });
  });

  describe('setProposalFee', async () => {
    it('should change the proposal fee if called by governance', async () => {
      const proposedFee = '3000000000000000000';
      const feeData = abi.encodeFunctionCall(
        {
          name: 'setProposalFee',
          type: 'function',
          inputs: [
            {
              type: 'uint256',
              name: 'fee'
            }
          ]
        },
        [proposedFee]
      );
      await governance.propose.sendTransactionAsync(governance.address, feeData);
      await web3Wrapper.increaseTimeAsync(TOTAL_VOTE_PERIOD + 1);
      await web3Wrapper.mineBlockAsync();
      await governance.finalize.sendTransactionAsync(PROPOSAL_ID);
      const fee = await governance.proposalFee.callAsync();
      expect(fee.toString()).to.equal(proposedFee);
    });

    it('should revert if not called by governance', async () => {
      const proposedFee = new BigNumber('3000000000000000000');
      return expect(governance.setProposalFee.sendTransactionAsync(proposedFee)).to.be.rejectedWith(
        'Governance::setProposalFee: Proposal fee can only be set via governance'
      );
    });
  });
});
