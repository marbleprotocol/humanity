declare module '*.json' {
  const json: any;
  /* tslint:disable */
  export default json;
  /* tslint:enable */
}

declare module 'web3-eth-abi' {
  import { AbiInput, AbiItem } from 'web3-utils';

  export class AbiCoder {
    encodeFunctionSignature(functionName: string | AbiItem): string;
    encodeEventSignature(functionName: string | AbiItem): string;
    encodeParameter(type: string | {}, parameter: any): string;
    encodeParameters(types: Array<string | {}>, paramaters: any[]): string;
    encodeFunctionCall(abiItem: AbiItem, params: string[]): string;
    decodeParameter(type: string | {}, hex: string): { [key: string]: any };
    decodeParameters(
      types: Array<string | {}>,
      hex: string
    ): { [key: string]: any };
    decodeLog(
      inputs: AbiInput[],
      hex: string,
      topics: string[]
    ): { [key: string]: string };
  }
}
