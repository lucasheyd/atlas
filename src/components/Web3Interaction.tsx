"use client";

import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

// Conector Metamask
const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 1337], // Redes Ethereum
});

// Endereço e ABI do contrato
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const CONTRACT_ABI: any[] = [
  // ABI do seu contrato aqui
  {
    "inputs": [],
    "name": "suaFuncaoDeConsulta",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const Web3Interaction: React.FC = () => {
  const { 
    activate, 
    active, 
    library, 
    account, 
    deactivate 
  } = useWeb3React<Web3Provider>();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [dadosContrato, setDadosContrato] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Verificar se está no navegador
  const isClient = typeof window !== 'undefined';

  // Conectar carteira
  const conectarCarteira = async () => {
    if (!isClient) return;

    try {
      await activate(injected);
    } catch (error) {
      console.error('Erro na conexão', error);
      setErro('Falha ao conectar carteira');
    }
  };

  // Inicializar contrato
  useEffect(() => {
    if (!isClient) return;

    if (library && account) {
      try {
        const signer = library.getSigner();
        const instanciaContrato = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(instanciaContrato);
      } catch (error) {
        console.error('Erro ao inicializar contrato', error);
        setErro('Falha ao inicializar contrato');
      }
    }
  }, [library, account, isClient]);

  // Ler dados do contrato
  const lerDadosContrato = async () => {
    if (!isClient) return;

    if (contract) {
      try {
        const dados = await contract.suaFuncaoDeConsulta();
        setDadosContrato(dados.toString());
        setErro(null);
      } catch (error) {
        console.error('Erro ao ler contrato', error);
        setErro('Falha ao ler dados do contrato');
      }
    }
  };

  // Renderização condicional para evitar erros no servidor
  if (!isClient) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Interação Web3
      </h2>

      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {erro}
        </div>
      )}

      {!active ? (
        <button 
          onClick={conectarCarteira}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Conectar Carteira
        </button>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Conta Conectada:
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md overflow-hidden text-ellipsis">
              {account}
            </div>
          </div>

          <button 
            onClick={lerDadosContrato}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition mb-4"
          >
            Ler Dados do Contrato
          </button>

          {dadosContrato && (
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md mb-4">
              Dados do Contrato: {dadosContrato}
            </div>
          )}

          <button 
            onClick={() => {
              deactivate();
              setErro(null);
            }}
            className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
          >
            Desconectar Carteira
          </button>
        </div>
      )}
    </div>
  );
};