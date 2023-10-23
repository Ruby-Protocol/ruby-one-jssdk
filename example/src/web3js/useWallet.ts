import { useCallback, useEffect, useMemo, useState } from 'react'
import Web3 from 'web3'
import rubyOneProvider from '../libs/sdk'
import ERC20 from '../libs/ERC20.json'

const RBT = '0xffFDFC767016f7a3Baa9895D70f895302f82Cfe9'
const DEAD = '0x000000000000000000000000000000000000dEaD'

export default function useWallet() {
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState('')
  const [ethBalance, setEthBalance] = useState(0)
  const [rbtBalance, setRbtBalance] = useState(0)

  const web3 = useMemo(() => {
    return new Web3(rubyOneProvider)
  }, [])

  const getData = useCallback(async () => {
    if (!account) return
    const contract = new web3.eth.Contract(ERC20, RBT)
    const ethBalance = await web3.eth.getBalance(account)
    const balanceOf = contract.methods.balanceOf as any
    const rbtBalance = await balanceOf(account).call()
    const ethValue = Number(web3.utils.fromWei(ethBalance, 'ether'))
    const rbtValue = Number(web3.utils.fromWei(rbtBalance, 'ether'))
    setEthBalance(ethValue)
    setRbtBalance(rbtValue)
  }, [web3, account])

  const transferRBT = useCallback(async () => {
    if (!account) return
    const contract = new web3.eth.Contract(ERC20, RBT)
    const value = web3.utils.toWei('10', 'ether')
    const transfer = contract.methods.transfer as any
    await transfer(DEAD, value).send({
      from: account
    })
    getData()
  }, [web3, account, getData])

  const init = useCallback(async () => {
    rubyOneProvider.on('accountsChanged', (accounts: string[]) => {
      console.log(accounts)
      setAccount(accounts[0] || '')
    })
    rubyOneProvider.on('chainChanged', (chainId: string) => {
      setChainId(chainId)
    })
    rubyOneProvider.on('disconnect', () => {
      setAccount('')
    })
    const network = await web3.eth.getChainId()
    const accounts = await rubyOneProvider.request({
      method: 'eth_accounts',
      params: []
    })
    setChainId(network.toString())
    setAccount(accounts[0] || '')
  }, [web3])

  const connect = useCallback(async () => {
    const accounts = await rubyOneProvider.enable()
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
    web3,
    connect,
    getData,
    transferRBT
  }
}
