'use client';

import StoreProvider from '@/state/redux';
import Auth from './(auth)/authProvider';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <Auth>{children}</Auth>
    </StoreProvider>
  );
};

export default Providers;
