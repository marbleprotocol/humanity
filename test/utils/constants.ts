import { devConstants } from '@marbleprotocol/dev-utils';

export const GAS_LIMIT = 8000000;
export const TX_DEFAULTS = {
  from: devConstants.TESTRPC_FIRST_ADDRESS,
  gas: GAS_LIMIT
};
