import {
  FakeGasEstimateSubprovider,
  RPCSubprovider,
  PrivateKeyWalletSubprovider,
  Web3ProviderEngine
} from '@0x/subproviders';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { BigNumber, providerUtils } from '@0x/utils';
import { config } from 'dotenv';

import { getNonce, getAddress } from '../test/utils/utils';

import {
  HumanityContract,
  HumanityGovernanceContract,
  HumanityRegistryContract,
  TwitterHumanityApplicantContract
} from '../build/wrappers';

config();

(async () => {
  try {
    const rpcUrl = 'https://mainnet.infura.io/';

    const provider = new Web3ProviderEngine();
    const privateKey = process.env.PRIVATE_KEY as string;
    provider.addProvider(new PrivateKeyWalletSubprovider(privateKey));
    provider.addProvider(new RPCSubprovider(rpcUrl));
    provider.addProvider(new FakeGasEstimateSubprovider(8000000));
    providerUtils.startProviderEngine(provider);

    const web3Wrapper = new Web3Wrapper(provider);

    const deployer = '0x9CAD5Bd771717146B2309F7A5dd0224ddfF359f0'.toLowerCase();
    const nonce = await getNonce(web3Wrapper, deployer);
    const registryAddress = getAddress(deployer, nonce + 2);
    console.log(registryAddress);

    // const txDefaults = { from: deployer, gas: 6500000 };

    // const uniswapFactoryAddr = '0xc0a47dfe034b400b47bdad5fecda2621de6c4d95';

    // const humanity = await HumanityContract.deployAsync(provider, txDefaults, uniswapFactoryAddr);

    // const humanityGovernance = await HumanityGovernanceContract.deployAsync(
    //   provider,
    //   txDefaults,
    //   humanity.address,
    //   new BigNumber('1e18')
    // );

    // const humanityRegistry = await HumanityRegistryContract.deployAsync(
    //   provider,
    //   txDefaults,
    //   humanity.address,
    //   humanityGovernance.address
    // );

    // const twitterHumanityApplicant = await TwitterHumanityApplicantContract.deployAsync(
    //   provider,
    //   txDefaults,
    //   humanityGovernance.address,
    //   humanityRegistry.address,
    //   humanity.address,
    //   '0x0000000000000000000000000000000000000000' // Uniswap
    // );

    // const HUM_AMOUNT = new BigNumber('200e18');

    // await humanity.approve.sendTransactionAsync(twitterHumanityApplicant.address, HUM_AMOUNT);

    // await humanity.approve.sendTransactionAsync(humanityGovernance.address, HUM_AMOUNT);

    // await humanityGovernance.deposit.sendTransactionAsync(HUM_AMOUNT);
  } catch (e) {
    console.log(e);
  }
  process.exit();
})();
