'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import Papa from 'papaparse';
import { NetworkSelector } from '@/components/NetworkSelector';
import { NETWORKS, NetworkKey } from '@/utils/networks';
import { Container } from "@/components/Container";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  AlertCircle, 
  Check, 
  Info, 
  Upload, 
  Settings, 
  Network, 
  Layers, 
  Zap 
} from 'lucide-react';

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

interface Wallet {
  address: string;
  privateKey: string;
}

interface PendingTx {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  wallet: string;
  timestamp: number;
}

interface BotConfig {
  contractAddress: string;
  seaDropAddress: string;
  feeRecipient: string;
  functionName: string;
  mintPrice: string;
  maxMintsPerWallet: number;
  totalMintsPerWallet: number;
  gasPrice: string;
  maxGasPrice: string;
  gasLimit: string;
  priorityFee: string;
  batchSize: number;
  batchInterval: number;
  mintInterval: number;
  randomizeTiming: boolean;
  randomWindow: number;
}

const BotComponent = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey>('base');
  const [contractType, setContractType] = useState('seadrop');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [currentTab, setCurrentTab] = useState('contract');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [pendingTxs, setPendingTxs] = useState<PendingTx[]>([]);
  const providerRef = useRef<ethers.providers.JsonRpcProvider | null>(null);

  const [config, setConfig] = useState<BotConfig>({
    contractAddress: '',
    seaDropAddress: '0x00005EA00Ac477B1030CE78506496e8C2dE24bf5',
    feeRecipient: '0x0000a26b00c1F0DF003000390027140000fAa719',
    functionName: 'mintPublic',
    mintPrice: '0',
    maxMintsPerWallet: 1,
    totalMintsPerWallet: 1,
    gasPrice: '0.05',
    maxGasPrice: '0.05',
    gasLimit: '400000',
    priorityFee: '0.05',
    batchSize: 5,
    batchInterval: 10,
    mintInterval: 0,
    randomizeTiming: false,
    randomWindow: 0,
  });

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    const logsElement = document.querySelector('.logs-container');
    if (logsElement) {
      logsElement.scrollTop = logsElement.scrollHeight;
    }
  }, []);


  // Automatically update function name when contract type changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      functionName: contractType === 'seadrop' ? 'mintPublic' : 'mintBatch'
    }));
  }, [contractType]);

  // Initialize provider
  useEffect(() => {
    const initProvider = async () => {
      try {
        const network = NETWORKS[selectedNetwork];
        const newProvider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
        
        // Verify network connection
        const networkInfo = await newProvider.getNetwork();
        if (networkInfo.chainId !== network.chainIdNumber) {
          throw new Error(`Chain ID mismatch. Expected ${network.chainIdNumber}, got ${networkInfo.chainId}`);
        }
        
        providerRef.current = newProvider;
        addLog(`Network provider initialized for ${network.name}`);
        
        // Check gas prices
        const feeData = await newProvider.getFeeData();
        if (feeData.maxFeePerGas) {
          const maxFee = ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei');
          const priorityFee = ethers.utils.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei');
          setConfig(prev => ({
            ...prev,
            gasPrice: maxFee,
            priorityFee: priorityFee
          }));
        }
      } catch (error: any) {
        const errorMessage = error.reason || error.message || 'Unknown error';
        addLog(`Failed to initialize provider: ${errorMessage}`);
        setStatus({ type: 'error', message: 'Failed to connect to network' });
      }
    };
    
    initProvider();
  }, [selectedNetwork, addLog]);

  // Monitor pending transactions
  useEffect(() => {
    if (!providerRef.current || pendingTxs.length === 0) return;

    const checkTransactions = async () => {
      const updatedTxs = [...pendingTxs];
      let changed = false;

      for (let i = 0; i < updatedTxs.length; i++) {
        const tx = updatedTxs[i];
        if (tx.status === 'pending') {
          try {
            const receipt = await providerRef.current?.getTransactionReceipt(tx.hash);
            if (receipt) {
              updatedTxs[i] = {
                ...tx,
                status: receipt.status === 1 ? 'success' : 'failed',
              };
              addLog(`Transaction ${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)} ${receipt.status === 1 ? 'succeeded' : 'failed'}`);
              changed = true;
            }
          } catch (error) {
            console.error(`Error checking transaction ${tx.hash}:`, error);
          }
        }
      }

      if (changed) {
        setPendingTxs(updatedTxs);
      }
    };

    const interval = setInterval(checkTransactions, 5000);
    return () => clearInterval(interval);
  }, [pendingTxs, addLog]);

  const handleConfigChange = (field: keyof BotConfig, value: string | number | boolean) => {
    let parsedValue = value;
    
    if (field === 'mintPrice' || field === 'gasPrice' || field === 'maxGasPrice' || 
        field === 'gasLimit' || field === 'priorityFee') {
      parsedValue = value === '' ? '0' : value.toString();
    } else if (field === 'maxMintsPerWallet' || field === 'totalMintsPerWallet' || 
               field === 'batchSize' || field === 'batchInterval' || 
               field === 'mintInterval' || field === 'randomWindow') {
      const numValue = parseInt(value.toString());
      parsedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
    }

    setConfig(prev => ({ ...prev, [field]: parsedValue }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addLog('Starting to parse CSV file...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          const validWallets = results.data
            .filter((row: any) => row.Address?.trim() && row.PrivateKey?.trim())
            .map((row: any) => ({
              address: row.Address.trim(),
              privateKey: row.PrivateKey.trim()
            }));

          if (validWallets.length === 0) {
            throw new Error('No valid wallets found in CSV');
          }

          setWallets(validWallets);
          addLog(`Successfully loaded ${validWallets.length} wallets`);
          setStatus({
            type: 'success',
            message: `Successfully loaded ${validWallets.length} wallets`
          });
        } catch (error: any) {
          const errorMsg = `Error processing wallets: ${error.message}`;
          addLog(errorMsg);
          setStatus({
            type: 'error',
            message: errorMsg
          });
        }
      }
    });
  };

const startBot = async () => {
    if (!wallets.length || !config.contractAddress || !providerRef.current) {
      addLog('Please load wallets and set contract address');
      return;
    }

    setIsRunning(true);
    const provider = providerRef.current;
    
    // Remove async log, replace with instant log
    console.log(`Starting bot on ${NETWORKS[selectedNetwork].name} network...`);

    try {
      const abi = contractType === 'seadrop' ? SEADROP_ABI : CUSTOM_ABI;
      const targetAddress = contractType === 'seadrop' ? config.seaDropAddress : config.contractAddress;
      
      // Prepare signers and nonces synchronously
      const walletSigners = wallets.map(wallet => 
        new ethers.Wallet(wallet.privateKey, provider)
      );

      // Use cached nonces to avoid async calls
      const noncesPromises = walletSigners.map(signer => 
        provider.getTransactionCount(signer.address, 'latest')
      );
      const nonces = await Promise.all(noncesPromises);

      // Prepare contracts with signers
      const contractsWithSigners = walletSigners.map(signer => 
        new ethers.Contract(targetAddress, abi, signer)
      );

      // Instant transaction preparation and sending
      const sendTransactions = () => {
        const mintAmount = config.maxMintsPerWallet;
        const valuePerMint = ethers.utils.parseEther(config.mintPrice);
        const totalValue = valuePerMint.mul(mintAmount);

        const txPromises = contractsWithSigners.map((contractWithSigner, index) => {
          const txParams = {
            nonce: nonces[index],
            gasLimit: ethers.BigNumber.from(config.gasLimit),
            maxFeePerGas: ethers.utils.parseUnits(config.gasPrice, 'gwei'),
            maxPriorityFeePerGas: ethers.utils.parseUnits(config.priorityFee, 'gwei'),
            value: totalValue,
            type: 2
          };

          return contractType === 'seadrop'
            ? contractWithSigner.mintPublic(
                config.contractAddress,
                config.feeRecipient,
                walletSigners[index].address,
                mintAmount,
                txParams
              )
            : contractWithSigner[config.functionName](
                mintAmount,
                txParams
              );
        });

        return Promise.all(txPromises);
      };

      // Execute transactions with minimal overhead
      const txs = await sendTransactions();

      // Update pending transactions
      setPendingTxs(prev => [
        ...prev, 
        ...txs.map((tx, index) => ({
          hash: tx.hash,
          status: 'pending',
          wallet: walletSigners[index].address,
          timestamp: Date.now()
        }))
      ]);

      // Instant logging
      txs.forEach((tx, index) => {
        console.log(`Transaction sent: ${tx.hash} for ${walletSigners[index].address}`);
      });

    } catch (error: any) {
      const errorMessage = error.reason || error.message || 'Unknown error';
      console.error(`Bot error: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

 return (
  <div className="bg-white dark:bg-gray-900 min-h-screen py-12">
    <Container>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            NFT Minting Bot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
            Automate your NFT minting process with our advanced, secure, and flexible bot.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
            <Network className="mx-auto mb-4 text-indigo-600 dark:text-indigo-400" size={48} />
            <h3 className="text-xl font-semibold text-center text-gray-800 dark:text-white mb-3">
              Network Configuration
            </h3>
            <p className="text-sm text-center text-gray-600 dark:text-gray-300">
              Seamless integration with multiple blockchain networks
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
            <Layers className="mx-auto mb-4 text-green-600 dark:text-green-400" size={48} />
            <h3 className="text-xl font-semibold text-center text-gray-800 dark:text-white mb-3">
              Multi-Wallet Support
            </h3>
            <p className="text-sm text-center text-gray-600 dark:text-gray-300">
              Manage and mint across multiple wallets simultaneously
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
            <Zap className="mx-auto mb-4 text-blue-600 dark:text-blue-400" size={48} />
            <h3 className="text-xl font-semibold text-center text-gray-800 dark:text-white mb-3">
              Advanced Customization
            </h3>
            <p className="text-sm text-center text-gray-600 dark:text-gray-300">
              Fine-tune minting parameters with granular controls
            </p>
          </div>
        </div>

        <Card className="w-full shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center">
              <Settings className="mr-3 text-indigo-600 dark:text-indigo-400" size={24} />
              NFT Minting Bot Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs 
              value={currentTab} 
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsList className="w-full rounded-none border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <TabsTrigger 
                  value="contract" 
                  className="data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-gray-800 flex-1"
                >
                  Contract
                </TabsTrigger>
                <TabsTrigger 
                  value="mint" 
                  className="data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-gray-800 flex-1"
                >
                  Mint Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="gas" 
                  className="data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-gray-800 flex-1"
                >
                  Gas Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="batch" 
                  className="data-[state=active]:bg-gray-100 data-[state=active]:dark:bg-gray-800 flex-1"
                >
                  Batch Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent 
                value="contract" 
                className="p-6 bg-white dark:bg-gray-900"
              >
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Button
                      onClick={() => setContractType('seadrop')}
                      variant={contractType === 'seadrop' ? 'default' : 'outline'}
                    >
                      SeaDrop
                    </Button>
                    <Button
                      onClick={() => setContractType('custom')}
                      variant={contractType === 'custom' ? 'default' : 'outline'}
                    >
                      Custom Contract
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <Label>Network</Label>
                      <NetworkSelector
                        selectedNetwork={selectedNetwork}
                        onNetworkChange={setSelectedNetwork}
                      />
                    </div>

                    {contractType === 'seadrop' ? (
                      <>
                        <div>
                          <Label>NFT Contract</Label>
                          <Input
                            value={config.contractAddress}
                            onChange={(e) => handleConfigChange('contractAddress', e.target.value)}
                            placeholder="0x..."
                          />
                        </div>
                        <div>
                          <Label>Fee Recipient</Label>
                          <Input
                            value={config.feeRecipient}
                            onChange={(e) => handleConfigChange('feeRecipient', e.target.value)}
                            placeholder="0x..."
                          />
                        </div>
                      </>
                    ) : (
                      <>
                       <div>
                          <Label>Contract Address</Label>
                          <Input
                            value={config.contractAddress}
                            onChange={(e) => handleConfigChange('contractAddress', e.target.value)}
                            placeholder="0x..."
                          />
                        </div>
                        <div>
                          <Label>Function Name</Label>
                          <Input
                            value={config.functionName}
                            onChange={(e) => handleConfigChange('functionName', e.target.value)}
                            placeholder="mint"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent 
                value="mint" 
                className="p-6 bg-white dark:bg-gray-900"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Mint Price ({NETWORKS[selectedNetwork].currency})</Label>
                      <Input
                        type="number"
                        value={config.mintPrice || '0'}
                        onChange={(e) => handleConfigChange('mintPrice', e.target.value)}
                        step="0.000000000000000001"
                        min="0"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label>Max Mints Per Wallet</Label>
                      <Input
                        type="number"
                        value={config.maxMintsPerWallet}
                        onChange={(e) => handleConfigChange('maxMintsPerWallet', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Total Mints Per Wallet</Label>
                      <Input
                        type="number"
                        value={config.totalMintsPerWallet}
                        onChange={(e) => handleConfigChange('totalMintsPerWallet', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent 
                value="gas" 
                className="p-6 bg-white dark:bg-gray-900"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Gas Price (gwei)</Label>
                      <Input
                        type="number"
                        value={config.gasPrice || '0'}
                        onChange={(e) => handleConfigChange('gasPrice', e.target.value)}
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Priority Fee (gwei)</Label>
                      <Input
                        type="number"
                        value={config.priorityFee || '0'}
                        onChange={(e) => handleConfigChange('priorityFee', e.target.value)}
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Gas Limit</Label>
                      <Input
                        type="number"
                        value={config.gasLimit}
                        onChange={(e) => handleConfigChange('gasLimit', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Max Gas Price (gwei)</Label>
                      <Input
                        type="number"
                        value={config.maxGasPrice || '0'}
                        onChange={(e) => handleConfigChange('maxGasPrice', e.target.value)}
                        step="0.1"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent 
                value="batch" 
                className="p-6 bg-white dark:bg-gray-900"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Batch Size</Label>
                      <Input
                        type="number"
                        value={config.batchSize}
                        onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Batch Interval (ms)</Label>
                      <Input
                        type="number"
                        value={config.batchInterval}
                        onChange={(e) => handleConfigChange('batchInterval', parseInt(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Mint Interval (ms)</Label>
                      <Input
                        type="number"
                        value={config.mintInterval}
                        onChange={(e) => handleConfigChange('mintInterval', parseInt(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Random Window (ms)</Label>
                      <Input
                        type="number"
                        value={config.randomWindow}
                        onChange={(e) => handleConfigChange('randomWindow', parseInt(e.target.value))}
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.randomizeTiming}
                      onCheckedChange={(checked) => handleConfigChange('randomizeTiming', checked)}
                    />
                    <Label>Randomize Timing</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Upload className="text-indigo-600 dark:text-indigo-400" size={24} />
                  <Label className="text-lg font-semibold">Upload Wallets (CSV)</Label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Wallets Loaded: {wallets.length}
                </p>
              </div>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-4 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-indigo-100"
              />
            </div>
          </CardContent>
        </Card>

        {status.message && (
          <Alert
            className={`mt-6 ${
              status.type === 'error' ? 'border-red-500' :
              status.type === 'success' ? 'border-green-500' :
              'border-blue-500'
            }`}
          >
            {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {status.type === 'success' && <Check className="h-4 w-4" />}
            {status.type === 'info' && <Info className="h-4 w-4" />}
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        <Card className="mt-6 shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center">
              <Info className="mr-3 text-blue-600 dark:text-blue-400" size={24} />
              Bot Logs
            </CardTitle>
          </CardHeader>
          <CardContent 
            className="p-6 bg-white dark:bg-gray-900 max-h-96 overflow-y-auto logs-container"
          >
            {logs.map((log, index) => (
              <div 
                key={index} 
                className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm"
              >
                {log}
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg"
          disabled={isRunning || !wallets.length || !config.contractAddress}
          onClick={startBot}
        >
          {isRunning ? 'Bot Running...' : 'Start Minting Bot'}
        </Button>

        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <AlertCircle className="mr-3 text-amber-500" size={24} />
            Important Disclaimers and Warnings
          </h3>
          <ul className="space-y-3 text-gray-600 dark:text-gray-300 list-disc list-inside">
            <li>
              Always verify contract details before starting the bot.
            </li>
            <li>
              Ensure you have sufficient funds in your wallets to cover gas fees.
            </li>
            <li>
              Start with small transactions to understand the bot's mechanics.
            </li>
            <li>
              Be aware of potential network congestion and fluctuating gas prices.
            </li>
            <li>
              The bot does not guarantee successful mints due to blockchain network conditions.
            </li>
            <li>
              Use at your own risk. We are not responsible for any financial losses.
            </li>
          </ul>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
              <Settings className="mr-3 text-indigo-600 dark:text-indigo-400" size={24} />
              Transaction History
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
            {pendingTxs.length > 0 ? (
              pendingTxs.map((tx, index) => (
                <div 
                  key={index} 
                  className="p-4 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      tx.status === 'pending' ? 'bg-yellow-500' :
                      tx.status === 'success' ? 'bg-green-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tx.wallet.slice(0, 6)}...{tx.wallet.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a 
                      href={`${NETWORKS[selectedNetwork].blockExplorer}/tx/${tx.hash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                    </a>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No transactions yet. Start the bot to begin minting.
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  </div>
 );
}

export default BotComponent;