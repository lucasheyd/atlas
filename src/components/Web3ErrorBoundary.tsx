"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class Web3ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Web3 errors podem incluir padrões específicos
    const isWeb3Error = [
      'web3', 'ethereum', 'metamask', 'wallet', 'transaction',
      'contract', 'blockchain', 'ether', 'rpc', 'provider',
      'nonce', 'gas', 'insufficient funds', 'rejected'
    ].some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );

    // Se for um erro de web3, não renderize o estado de erro
    // Em vez disso, apenas registre e suprima
    if (isWeb3Error) {
      console.debug('Web3 error suppressed by boundary:', error.message);
      return { hasError: false, error: null };
    }
    
    // Para outros erros, renderize o fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Você pode registrar o erro em um serviço, se necessário
    console.debug('Error caught by Web3ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Renderiza um fallback personalizado ou o padrão
      return this.props.fallback || (
        <div className="p-4 bg-amber-50 text-amber-800 rounded-md">
          <h3 className="font-medium">Algo deu errado</h3>
          <p className="text-sm">A interface foi carregada, mas ocorreu um problema com a conexão da carteira.</p>
          <button 
            className="mt-2 px-3 py-1 bg-amber-100 hover:bg-amber-200 rounded-md text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default Web3ErrorBoundary;