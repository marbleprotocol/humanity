import { solidityKeccak256 } from 'ethers/utils';
import * as rlp from 'rlp';

export const getAddress = (_deployer: string, _nonce: number): string => {
  return (
    '0x' +
    solidityKeccak256(['bytes'], [rlp.encode([_deployer, _nonce])])
      .slice(12)
      .substring(14)
  );
};

export const getNonce = async (_web3Wrapper: any, _account: string): Promise<number> => {
  const txCount = await _web3Wrapper.sendRawPayloadAsync({
    method: 'eth_getTransactionCount',
    params: [_account, 'latest']
  });
  const nonce = +(txCount as string);
  return nonce;
};
