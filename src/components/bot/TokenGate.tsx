'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Container } from "@/components/Container";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { connectWallet, getProvider } from '@/utils/wallet';


interface TokenGateProps {
  children: React.ReactNode;
}

const TokenGate = ({ children }: TokenGateProps) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);
  const requiredBalance = 25;

  useEffect(() => {
    const checkTokenBalance = async () => {
      try {
        await connectWallet();
        const provider = getProvider();
        const signer = provider.getSigner();
        const tokenAddress = '0xcfc07303a4e916663259c3283A191B3c92a4af2C';
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          signer
        );
        const userAddress = await signer.getAddress();
        const balance = await tokenContract.balanceOf(userAddress);
        const tokenBalance = ethers.utils.formatUnits(balance, 0);
        setUserBalance(parseFloat(tokenBalance));
        setHasAccess(parseFloat(tokenBalance) >= requiredBalance);
      } catch (error) {
        console.error('Token balance check failed:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTokenBalance();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Container>
        <Card className="max-w-lg mx-auto mt-8">
          <CardHeader>
            <CardTitle>Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-amber-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need {requiredBalance} tokens to access this feature.
                Current balance: {userBalance} tokens
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return children;
};

export default TokenGate;