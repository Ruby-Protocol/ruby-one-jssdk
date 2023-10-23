import { useCallback, useEffect, useState } from 'react'
import { utils, Contract } from 'ethers5'
import ERC20 from '../libs/ERC20.json'
import { eip1193, hooks } from './connector'

const RBT = '0xffFDFC767016f7a3Baa9895D70f895302f82Cfe9'
const DEAD = '0x000000000000000000000000000000000000dEaD'

export default function useWallet() {
  const account = hooks.useAccount()
  const chainId = hooks.useChainId()
  const provider = hooks.useProvider()
  const [ethBalance, setEthBalance] = useState(0)
  const [rbtBalance, setRbtBalance] = useState(0)

  const getData = useCallback(async () => {
    if (!account || !provider) return
    const contract = new Contract(RBT, ERC20, provider)
    const ethBalance = await provider.getBalance(account)
    const rbtBalance = await contract.balanceOf(account)
    const ethValue = Number(utils.formatUnits(ethBalance))
    const rbtValue = Number(utils.formatUnits(rbtBalance))
    setEthBalance(ethValue)
    setRbtBalance(rbtValue)
  }, [provider, account])

  const transferRBT = useCallback(async () => {
    if (!account) return
    const signer = provider?.getSigner()
    const contract = new Contract(RBT, ERC20, signer)
    const value = utils.parseUnits('10')
    const trans = await contract.transfer(DEAD, value)
    await trans.wait(1)
    getData()
    return trans.hash
  }, [provider, account, getData])

  const init = useCallback(async () =>{
    eip1193.connectEagerly()
  }, [])

  const connect = useCallback(async () => {
    eip1193.activate()
  }, [])

  useEffect(() => {
    getData()
  }, [getData])

  useEffect(() => {
    init()
  }, [init])

  return {
    chainId,
    account,
    ethBalance,
    rbtBalance,
    provider,
    connect,
    getData,
    transferRBT
  }
}
