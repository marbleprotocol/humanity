[![CircleCI](https://circleci.com/gh/marbleprotocol/polaris/tree/master.svg?style=svg)](https://circleci.com/gh/marbleprotocol/humanity/tree/master)

# Humanity

Humanity is a Decentralized Autonomous Organization (DAO) that governs a registry of unique humans.

## Deployed Addresses (Ethereum Mainnet)

```
Humanity (ERC20): 0xbbd1706d16418bb136e1497a73d3af4164586da0

HumanityGovernance: 0xdd806c4fdad2949a97fda79036cfbb8750181b37

HumanityRegistry: 0x4ee46dc4962c2c2f6bcd4c098a0e2b28f66a5e90

Faucet: 0x2fe5e394a312acf9d18e8836f04ba92af29ad6d4

TwitterHumanityApplicant: 0x9d661f7773be14439b4223f5b516bc7ef67b0369

UniversalBasicIncome: 0x762d141b8d9600bde64138762e6fb38efc56dcba
```

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
