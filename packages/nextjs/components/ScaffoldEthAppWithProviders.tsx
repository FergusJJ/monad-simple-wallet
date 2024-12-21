"use client";

import { useEffect, useState } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import dynamic from 'next/dynamic';

// Create a client-side only version of RainbowKitProvider
const ClientOnlyRainbowKitProvider = dynamic(
  () => import('@rainbow-me/rainbowkit').then((mod) => {
    const { RainbowKitProvider } = mod;
    return ({ children, ...props }: any) => <RainbowKitProvider {...props}>{children}</RainbowKitProvider>;
  }),
  { ssr: false }
);

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const ClientSideBlockieAvatar = dynamic(
  () => Promise.resolve(BlockieAvatar),
  { ssr: false }
);

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ProgressBar height="3px" color="#2299dd" />
        <ClientOnlyRainbowKitProvider
          avatar={ClientSideBlockieAvatar}
          theme={isDarkMode ? darkTheme() : lightTheme()}
        >
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </ClientOnlyRainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};