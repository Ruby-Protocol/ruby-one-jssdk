import { useState } from 'react'
import { toast } from 'react-toastify'
import useWallet from './useWallet'

export default function EthersV5() {
  const [loading, setLoading] = useState(false)
  const { ethBalance, rbtBalance, account, chainId, connect, transferRBT } =
    useWallet()

  const onTransfer = async () => {
    try {
      setLoading(true)
      await toast.promise(transferRBT, {
        pending: 'Sending...',
        success: 'Transaction successful',
        error: 'Transaction failed'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5">
      {!account ? (
        <button className="my-btn" onClick={connect}>
          Connect Wallet
        </button>
      ) : (
        <div className="grid gap-3">
          <div>Chain ID: {chainId}</div>
          <div>Account: {account}</div>
          <div>ETH Balance: {ethBalance}</div>
          <div>RBT Balance: {rbtBalance}</div>
          <div>
            <button
              className="my-btn"
              disabled={rbtBalance <= 0 || loading}
              onClick={onTransfer}
            >
              Transfer 10 RBT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
