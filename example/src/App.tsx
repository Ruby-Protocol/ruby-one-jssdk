import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import EthersV6 from './ethers-v6'
import EthersV5 from './ethers-v5'
import Web3js from './web3js'
import Web3React from './web3-react'

function Main() {
  return (
    <div className="flex flex-col items-start gap-2 p-6">
      <Link to="/ethers-v6" className="my-link">
        ethers v6
      </Link>
      <Link to="/ethers-v5" className="my-link">
        ethers v5
      </Link>
      <Link to="/web3js" className="my-link">
        web3.js
      </Link>
      <Link to="/web3-react-v8" className="my-link">
        Web3 React v8
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/ethers-v6" element={<EthersV6 />} />
        <Route path="/ethers-v5" element={<EthersV5 />} />
        <Route path="/web3js" element={<Web3js />} />
        <Route path="/web3-react-v8" element={<Web3React />} />
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        pauseOnFocusLoss={false}
      />
    </BrowserRouter>
  )
}
