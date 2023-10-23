import { initializeConnector } from '@web3-react/core'
import { EIP1193 } from '@web3-react/eip1193'
import rubyOneProvider from '../libs/sdk'

export const [eip1193, hooks] = initializeConnector<EIP1193>(
  actions => new EIP1193({ actions, provider: rubyOneProvider })
)
