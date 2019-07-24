pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";

import { HumanityRegistry } from "./HumanityRegistry.sol";
import { Void } from "./Void.sol";

/**
 * @title Governance
 * @dev Plutocratic voting system.
 */
contract Governance {
    using SafeMath for uint;

    event Execute(uint indexed proposalId);
    event Propose(uint indexed proposalId, address indexed proposer, address indexed target, bytes data);
    event RemoveVote(uint indexed proposalId, address indexed voter);
    event Terminate(uint indexed proposalId);
    event Vote(uint indexed proposalId, address indexed voter, bool approve, uint weight);

    enum Result { Pending, Yes, No }

    struct Proposal {
        Result result;
        address target;
        bytes data;
        address proposer;
        address feeRecipient;
        uint fee;
        uint startTime;
        uint yesCount;
        uint noCount;
    }

    uint public constant OPEN_VOTE_PERIOD = 2 days;
    uint public constant VETO_PERIOD = 2 days;
    uint public constant TOTAL_VOTE_PERIOD = OPEN_VOTE_PERIOD + VETO_PERIOD;

    uint public proposalFee;
    IERC20 public token;
    HumanityRegistry public HumanityRegistry;
    Void public void;

    Proposal[] public proposals;

    // Proposal Id => Voter => Yes Votes
    mapping(uint => mapping(address => uint)) public yesVotes;

    // Proposal Id => Voter => No Votes
    mapping(uint => mapping(address => uint)) public noVotes;

    // Voter => Deposit
    mapping (address => uint) public deposits;

    // Voter => Withdraw timestamp
    mapping (address => uint) public withdrawTimes;

    constructor(IERC20 _token, uint _initialProposalFee, HumanityRegistry _humanityRegistry) public {
        token = _token;
        proposalFee = _initialProposalFee;
        HumanityRegistry = _humanityRegistry;
        void = new Void();
    }

    function deposit(uint amount) public {
        require(HumanityRegistry.isHuman(msg.sender), "Governance::deposit: You must be a Human to make deposits to Governance");
        require(token.transferFrom(msg.sender, address(this), amount), "Governance::deposit: Transfer failed");
        deposits[msg.sender] = deposits[msg.sender].add(amount);
    }

    function withdraw(uint amount) public {
        require(time() > withdrawTimes[msg.sender], "Governance::withdraw: Voters with an active proposal cannot withdraw");
        deposits[msg.sender] = deposits[msg.sender].sub(amount);
        require(token.transfer(msg.sender, amount), "Governance::withdraw: Transfer failed");
    }

    function propose(address target, bytes memory data) public returns (uint) {
        require(HumanityRegistry.isHuman(msg.sender), "Governance::propose: You must be a Human to make a Governance proposal");
        return proposeWithFeeRecipient(msg.sender, target, data);
    }

    function proposeWithFeeRecipient(address feeRecipient, address target, bytes memory data) public returns (uint) {
        require(HumanityRegistry.isHuman(msg.sender), "Governance::proposeWithFeeRecipient: You must be a Human to make a Governance proposal");
        require(msg.sender != address(this) && target != address(token), "Governance::proposeWithFeeRecipient: Invalid proposal");
        require(token.transferFrom(msg.sender, address(this), proposalFee), "Governance::proposeWithFeeRecipient: Transfer failed");

        uint proposalId = proposals.length;

        // Create a new proposal and vote yes
        Proposal memory proposal;
        proposal.target = target;
        proposal.data = data;
        proposal.proposer = msg.sender;
        proposal.feeRecipient = feeRecipient;
        proposal.fee = proposalFee;
        proposal.startTime = time();
        proposal.yesCount = proposalFee;

        proposals.push(proposal);

        emit Propose(proposalId, msg.sender, target, data);

        return proposalId;
    }

    function voteYes(uint proposalId) public {
        require(HumanityRegistry.isHuman(msg.sender), "Governance::voteYes: You must be a Human to vote");
        Proposal storage proposal = proposals[proposalId];
        require(time() <= proposal.startTime.add(OPEN_VOTE_PERIOD), "Governance::voteYes: Proposal is no longer accepting yes votes");
        require(noVotes[proposalId][msg.sender] == 0, "Governance::voteYes: Human has already voted on the opposite position");

        uint proposalEndTime = proposal.startTime.add(TOTAL_VOTE_PERIOD);
        if (proposalEndTime > withdrawTimes[msg.sender]) withdrawTimes[msg.sender] = proposalEndTime;

        uint weight = deposits[msg.sender].sub(yesVotes[proposalId][msg.sender]);
        proposal.yesCount = proposal.yesCount.add(weight);
        yesVotes[proposalId][msg.sender] = deposits[msg.sender];

        emit Vote(proposalId, msg.sender, true, weight);
    }

    function voteNo(uint proposalId) public {
        require(HumanityRegistry.isHuman(msg.sender), "Governance::voteNo: You must be a Human to vote");
        Proposal storage proposal = proposals[proposalId];
        require(proposal.result == Result.Pending, "Governance::voteNo: Proposal is already finalized");
        require(yesVotes[proposalId][msg.sender] == 0, "Governance::voteNo: Human has already voted on the opposite position");

        uint proposalEndTime = proposal.startTime.add(TOTAL_VOTE_PERIOD);
        uint _time = time();
        require(_time <= proposalEndTime, "Governance::voteNo: Proposal is no longer in voting period");

        uint _deposit = deposits[msg.sender];
        uint weight = _deposit.sub(noVotes[proposalId][msg.sender]);
        proposal.noCount = proposal.noCount.add(weight);
        noVotes[proposalId][msg.sender] = _deposit;

        emit Vote(proposalId, msg.sender, false, weight);

        // Finalize the vote and burn the proposal fee if no votes outnumber yes votes and open voting has ended
        if (_time > proposal.startTime.add(OPEN_VOTE_PERIOD) && proposal.noCount >= proposal.yesCount) {
            proposal.result = Result.No;
            require(token.transfer(address(void), proposal.fee), "Governance::voteNo: Transfer to void failed");
            emit Terminate(proposalId);
        } else if (proposalEndTime > withdrawTimes[msg.sender]) {
            withdrawTimes[msg.sender] = proposalEndTime;
        }

    }

    function removeVote(uint proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.result == Result.Pending, "Governance::removeVote: Proposal is already finalized");
        require(time() <= proposal.startTime.add(TOTAL_VOTE_PERIOD), "Governance::removeVote: Proposal is no longer in voting period");

        proposal.yesCount = proposal.yesCount.sub(yesVotes[proposalId][msg.sender]);
        proposal.noCount = proposal.noCount.sub(noVotes[proposalId][msg.sender]);
        delete yesVotes[proposalId][msg.sender];
        delete noVotes[proposalId][msg.sender];

        emit RemoveVote(proposalId, msg.sender);
    }

    function finalize(uint proposalId) public {
        require(HumanityRegistry.isHuman(msg.sender), "Governance::vote: You need to be a Human to finalise a proposal");
        Proposal storage proposal = proposals[proposalId];
        require(proposal.result == Result.Pending, "Governance::finalize: Proposal is already finalized");
        uint _time = time();

        if (proposal.yesCount > proposal.noCount) {
            require(_time > proposal.startTime.add(TOTAL_VOTE_PERIOD), "Governance::finalize: Proposal cannot be executed until end of veto period");

            proposal.result = Result.Yes;
            require(token.transfer(proposal.feeRecipient, proposal.fee), "Governance::finalize: Return proposal fee failed");
            proposal.target.call(proposal.data);

            emit Execute(proposalId);
        } else {
            require(_time > proposal.startTime.add(OPEN_VOTE_PERIOD), "Governance::finalize: Proposal cannot be terminated until end of yes vote period");

            proposal.result = Result.No;
            require(token.transfer(address(void), proposal.fee), "Governance::finalize: Transfer to void failed");

            emit Terminate(proposalId);
        }
    }

    function setProposalFee(uint fee) public {
        require(msg.sender == address(this), "Governance::setProposalFee: Proposal fee can only be set via governance");
        proposalFee = fee;
    }

    function time() public view returns (uint) {
        return block.timestamp;
    }

    function getProposal(uint proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getProposalsCount() external view returns (uint) {
        return proposals.length;
    }

}