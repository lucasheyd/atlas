"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Papa from 'papaparse';
import { NetworkSelector } from '@/components/NetworkSelector';
import { NETWORKS, NetworkKey } from '@/utils/networks';
import { Container } from "@/components/Container";
import { useRouter } from 'next/navigation';
import { connectWallet, getProvider } from '@/utils/wallet';

const SEADROP_ABI = [
  "function mintPublic(address,address,address,uint256) payable",
  "function mintBatch(uint256) payable",
  "function getPublicDrop(address) view returns (uint80,uint48,uint48,uint16,uint16,bool)",
  "function mintPrice() view returns (uint256)",
  "function maxMintPerTx() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

const CUSTOM_ABI = [
  "function mintBatch(uint256) payable",
  "function mint(uint256) payable",
  "function mintPublic(uint256) payable",
  "function mintPrice() view returns (uint256)",
  "function maxMintPerTx() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

const TokenGate = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);
  const requiredBalance = 50;

  useEffect(() => {
    const checkTokenBalance = async () => {
      try {
        await connectWallet();
        const provider = getProvider();
        const signer = provider.getSigner();
        const tokenAddress = '0xcfc07303a4e916663259c3283a191b3c92a4af2c';
        const tokenAbi = ['function balanceOf(address) view returns (uint256)'];
        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
        const userAddress = await signer.getAddress();
        const balance = await tokenContract.balanceOf(userAddress);
        const tokenBalance = ethers.utils.formatUnits(balance, 0);
        setUserBalance(parseFloat(tokenBalance));
        setHasAccess(balance.gte(ethers.utils.parseUnits(requiredBalance.toString(),0)));
      } catch (error) {
        console.error('Token balance check failed', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTokenBalance();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    const tokensToBuy = requiredBalance - userBalance;
    return (
      <div className="text-center mt-8">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-lg">
          You don't have the required token balance to access this page.
        </p>
        <p className="text-lg mt-2">
          Your current balance: {userBalance.toFixed(0)} tokens
        </p>
        <p className="text-lg mt-2">
          Required balance: {requiredBalance} tokens
        </p>
        {tokensToBuy > 0 && (
          <p className="text-lg mt-2">
            You need to acquire {tokensToBuy.toFixed(0)} more tokens to gain access.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

	
export default function BotPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey>('ethereum');
  const [wallets, setWallets] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [contractType, setContractType] = useState('seadrop');
  const [pendingTxs, setPendingTxs] = useState<ethers.ContractTransaction[]>([]);
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);

  const [config, setConfig] = useState({
    contractAddress: '',
    seaDropAddress: '0x00005EA00Ac477B1030CE78506496e8C2dE24bf5',
    feeRecipient: '0x0000a26b00c1F0DF003000390027140000fAa719',
    functionName: 'mintBatch',
    mintPrice: '0',
    maxMintsPerWallet: 1,
    totalMintsPerWallet: 1,
    gasPrice: '0.5',
    maxGasPrice: '1.0', 
    gasLimit: '800000',
    priorityFee: '0.5',
    batchSize: 5,
    batchInterval: 3000,
    mintInterval: 1000,
    randomizeTiming: true,
    randomWindow: 300,
  });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const handleConfigChange = (field: string, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addLog('Starting to parse CSV file...');

      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          try {
            addLog(`Found ${results.data.length} rows in CSV`);
            
            const validWallets = results.data
              .filter((row: any) => {
                if (!row.Address?.trim() || !row.PrivateKey?.trim()) {
                  addLog(`Invalid row found: ${JSON.stringify(row)}`);
                  return false;
                }
                return true;
              })
              .map((row: any) => {
                const addr = row.Address.trim();
                const pk = row.PrivateKey.trim();
                addLog(`Processing wallet: ${addr}`);
                return { address: addr, privateKey: pk };
              });

            setWallets(validWallets);
            addLog(`Successfully loaded ${validWallets.length} wallets`);
            
            // Log all addresses found (without private keys for security)
            const addresses = validWallets.map(w => w.address);
            addLog(`Loaded addresses: ${addresses.join(', ')}`);

          } catch (error) {
            addLog(`Error processing wallets: ${error.message}`);
            console.error('Error details:', error);
          }
        },
        error: (error) => {
          addLog(`CSV parsing error: ${error.message}`);
        }
      });
    }
  };

  useEffect(() => {
    setProvider(new ethers.providers.JsonRpcProvider(NETWORKS[selectedNetwork].rpcUrl));
  }, [selectedNetwork]);

  useEffect(() => {
    if (!provider) return;

    const checkPendingTransactions = async () => {
      const updatedTxs: ethers.ContractTransaction[] = [];
      
      for (const tx of pendingTxs) {
        const receipt = await provider.getTransactionReceipt(tx.hash);
        
        if (receipt) {
          if (receipt.status === 1) {
            addLog(`Transaction succeeded: ${tx.hash}`);
          } else {
            addLog(`Transaction failed: ${tx.hash}`);
          }
        } else {
          updatedTxs.push(tx);
        }
      }

      setPendingTxs(updatedTxs);
    };

    const interval = setInterval(checkPendingTransactions, 5000);
    return () => clearInterval(interval);
  }, [pendingTxs, provider]);

  const startBot = async () => {
    if (!wallets.length) {
      addLog('Please load wallets first');
      return;
    }

    setIsRunning(true);
    addLog(`Starting bot on ${NETWORKS[selectedNetwork].name} network...`);

    try {
      if (!provider) {
        throw new Error('Provider not initialized');
      }

      const abi = contractType === 'seadrop' ? SEADROP_ABI : CUSTOM_ABI;
      const targetAddress = contractType === 'seadrop' ? config.seaDropAddress : config.contractAddress;
      const contract = new ethers.Contract(targetAddress, abi, provider);

      for (let i = 0; i < wallets.length; i += config.batchSize) {
        const batch = wallets.slice(i, i + config.batchSize);
        addLog(`Processing batch ${Math.floor(i/config.batchSize) + 1}...`);

        const txPromises = batch.map(async (wallet) => {
          try {
            const signer = new ethers.Wallet(wallet.privateKey, provider);
            const contractWithSigner = contract.connect(signer);

            const mintAmount = config.maxMintsPerWallet;
            const valuePerMint = ethers.utils.parseEther(config.mintPrice);
            const totalValue = valuePerMint.mul(mintAmount);

            const txParams = {
              gasLimit: ethers.BigNumber.from(config.gasLimit),
              maxFeePerGas: ethers.utils.parseUnits(config.gasPrice, 'gwei'),
              maxPriorityFeePerGas: ethers.utils.parseUnits(config.priorityFee, 'gwei'),
              value: totalValue
            };

            let tx;
            if (contractType === 'seadrop') {
              tx = await contractWithSigner.mintPublic(
                config.contractAddress,
                config.feeRecipient,
                wallet.address, 
                mintAmount,
                txParams
              );
            } else {
              tx = await contractWithSigner[config.functionName](
                mintAmount,
                txParams  
              );
            }

            addLog(`Transaction sent: ${tx.hash}`);
            return tx;

          } catch (error: any) {
            addLog(`Failed to send transaction for ${wallet.address}: ${error.message}`);
            return null;
          }
        });

        const txResults = await Promise.all(txPromises);
        const validTxs = txResults.filter((tx): tx is ethers.ContractTransaction => tx !== null);
        setPendingTxs(prev => [...prev, ...validTxs]);

        await new Promise(resolve => setTimeout(resolve, config.batchInterval));
      }
    } catch (error: any) {
      addLog(`Bot error: ${error.message}`);
    } finally {
      setIsRunning(false);
      addLog('Bot finished');
    }
  };

  return (
    <TokenGate>
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">NFT Minting Bot</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Select Network</h3>
                <NetworkSelector
                  selectedNetwork={selectedNetwork}
                  onNetworkChange={setSelectedNetwork}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contract Type</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setContractType('seadrop')}
                    className={`px-4 py-2 rounded-lg ${
                      contractType === 'seadrop' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    SeaDrop
                  </button>
                  <button
                    onClick={() => setContractType('custom')}
                    className={`px-4 py-2 rounded-lg ${
                      contractType === 'custom' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Custom Contract
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contract Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contractType === 'seadrop' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">NFT Contract</label>
                        <input
                          type="text"
                          value={config.contractAddress}
                          onChange={(e) => handleConfigChange('contractAddress', e.target.value)}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          placeholder="0x..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Fee Recipient</label>
                        <input
                          type="text"
                          value={config.feeRecipient}
                          onChange={(e) => handleConfigChange('feeRecipient', e.target.value)}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          placeholder="0x..."
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Contract Address</label>
                        <input
                          type="text"
                          value={config.contractAddress}
                          onChange={(e) => handleConfigChange('contractAddress', e.target.value)}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          placeholder="0x..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Function Name</label>
                        <input
                          type="text"
                          value={config.functionName}
                          onChange={(e) => handleConfigChange('functionName', e.target.value)}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          placeholder="mint"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Mint Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mint Price ({NETWORKS[selectedNetwork].currency})</label>
                    <input
                      type="number"
                      value={config.mintPrice}
                      onChange={(e) => handleConfigChange('mintPrice', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      step="0.000000000000000001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Mints Per Wallet</label>
                    <input
                      type="number"
                      value={config.maxMintsPerWallet}
                      onChange={(e) => handleConfigChange('maxMintsPerWallet', parseInt(e.target.value))}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Mints Per Wallet</label>
                    <input
                      type="number"
                      value={config.totalMintsPerWallet}
                      onChange={(e) => handleConfigChange('totalMintsPerWallet', parseInt(e.target.value))}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Gas Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Gas Price (gwei)</label>
                    <input
                      type="number"
                      value={config.gasPrice}
                      onChange={(e) => handleConfigChange('gasPrice', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority Fee (gwei)</label>
                    <input
                      type="number"
                      value={config.priorityFee}
                      onChange={(e) => handleConfigChange('priorityFee', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gas Limit</label>
                    <input
                      type="number"
                      value={config.gasLimit}
                      onChange={(e) => handleConfigChange('gasLimit', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Gas Price (gwei)</label>
                    <input
                      type="number"
                      value={config.maxGasPrice}
                      onChange={(e) => handleConfigChange('maxGasPrice', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Batch Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Batch Size</label>
                    <input
                      type="number"
                      value={config.batchSize}
                      onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Batch Interval (ms)</label>
                    <input
                      type="number"
                      value={config.batchInterval}
                      onChange={(e) => handleConfigChange('batchInterval', parseInt(e.target.value))}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mint Interval (ms)</label>
                    <input
                      type="number"
                      value={config.mintInterval}
                      onChange={(e) => handleConfigChange('mintInterval', parseInt(e.target.value))}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Random Window (ms)</label>
                    <input
                      type="number"
                      value={config.randomWindow}
                      onChange={(e) => handleConfigChange('randomWindow', parseInt(e.target.value))}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.randomizeTiming}
                    onChange={(e) => handleConfigChange('randomizeTiming', e.target.checked)}
                    className="rounded dark:bg-gray-700"
                  />
                  <label className="text-sm font-medium">Randomize Timing</label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Upload Wallets</h3>
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    CSV Format Requirements:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                    <li>First row must be header: Address,PrivateKey</li>
                    <li>Each following row: wallet_address,private_key</li>
                    <li>No spaces or quotes needed</li>
                    <li>Example:<br/>
                      Address,PrivateKey<br/>
                      0x123...,abcd...<br/>
                      0x456...,efgh...
                    </li>
                  </ul>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Bot Logs</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-60 overflow-y-auto space-y-1 font-mono">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm">
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium dark:text-gray-300">
                  Wallets Loaded: {wallets.length}
                </p>
                {wallets.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    First wallet: {wallets[0]?.address.slice(0, 6)}...{wallets[0]?.address.slice(-4)}
                  </p>
                )}
              </div>

              <button
                onClick={startBot}
                disabled={isRunning || !wallets.length || !config.contractAddress}
                className={`w-full py-3 rounded-lg font-medium ${
                  isRunning || !wallets.length || !config.contractAddress
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isRunning ? 'Bot Running...' : 'Start Bot'}
              </button>
            </div>
          </div>
        </div>
      </Container>
    </TokenGate>
  );
}