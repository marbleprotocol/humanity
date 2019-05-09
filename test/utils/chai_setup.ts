import * as _chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import ChaiBigNumber = require('chai-bignumber');
import * as dirtyChai from 'dirty-chai';

_chai.config.includeStack = true;
_chai.use(ChaiBigNumber());
_chai.use(dirtyChai);
_chai.use(chaiAsPromised);

export const chai = _chai;
