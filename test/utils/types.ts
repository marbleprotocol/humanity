import { BigNumber } from '@0x/utils';

export enum Result {
  Pending,
  Yes,
  No
}

export interface Proposal {
  result: Result;
  target: string;
  data: string;
  proposer: string;
  fee: BigNumber;
  startTime: BigNumber;
  yesCount: BigNumber;
  noCount: BigNumber;
}
