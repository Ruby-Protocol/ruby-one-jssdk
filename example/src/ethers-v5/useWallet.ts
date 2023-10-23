import { useCallback, useEffect, useMemo, useState } from 'react'
import { providers, utils, Contract } from 'ethers5'
import rubyOneProvider from '../libs/sdk'
import ERC20 from '../libs/ERC20.json'

const RBT = '0xffFDFC767016f7a3Baa9895D70f895302f82Cfe9'
const DEAD = '0x000000000000000000000000000000000000dEaD'

export default function useWallet() {
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState('')
  const [ethBalance, setEthBalance] = useState(0)
  const [rbtBalance, setRbtBalance] = useState(0)

  const provider = useMemo(() => {
    return new providers.Web3Provider(rubyOneProvider)
  }, [])

  const getData = useCallback(async () => {
    if (!account) return
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
    const signer = provider.getSigner()
    const contract = new Contract(RBT, ERC20, signer)
    const value = utils.parseUnits('10')
    const trans = await contract.transfer(DEAD, value)
    await trans.wait(1)
    getData()
    return trans.hash
  }, [provider, account, getData])

  const init = useCallback(async () =>{
    rubyOneProvider.on('accountsChanged', (accounts: string[]) => {
      setAccount(accounts[0] || '')
    })
    rubyOneProvider.on('chainChanged', (chainId: string) => {
      setChainId(chainId)
    })
    rubyOneProvider.on('disconnect', () => {
      setAccount('')
    })
    const network = await provider.getNetwork()
    const accounts = await rubyOneProvider.request({
      method: 'eth_accounts',
      params: []
    })
    setChainId(network.chainId.toString())
    setAccount(accounts[0] || '')
  }, [provider])

  const connect = useCallback(async () => {
    const accounts = await rubyOneProvider.request({
      method: 'eth_requestAccounts',
      params: []
    })
    setAccount(accounts[0] || '')
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
