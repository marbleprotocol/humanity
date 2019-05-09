[![CircleCI](https://circleci.com/gh/marbleprotocol/polaris/tree/master.svg?style=svg)](https://circleci.com/gh/marbleprotocol/humanity/tree/master)

# Humanity

Humanity is a Decentralized Autonomous Organization (DAO) that governs a registry of unique humans.

## Query the Registry

Create Sybil-resistant smart contract protocols by restricting permission to Ethereum addresses that are on the registry.

**HumanityRegistry.sol**
```
function isHuman(address who) public view returns (bool)
```

See **UniversalBasicIncome.sol** for an example.

## Apply to the Registry

First, submit social verification in the form of a Twitter post with your Ethereum address. Then, apply to the registry with your Twitter username and a refundable proposal fee.

**TwitterHumanityApplicant.sol**
```
function applyWithTwitter(string memory username) public returns (uint)
```

## Vote on Applicants

Vote on applicants to the registry using Humanity tokens.

**Governance.sol**
```
function voteYes(uint proposalId) public
```

```
function voteNo(uint proposalId) public
```
