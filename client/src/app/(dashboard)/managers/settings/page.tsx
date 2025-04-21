'use client';

import SettingsForm from '@/components/SettingsForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import Loading from '@/components/Loading';
import { useUpdateManagerSettingsMutation } from '@/state/api';
import { useAppSelector } from '@/state/redux';
import React from 'react';

const ManagerSettings = () => {
  const { user, isAuthenticated, loading } = useAppSelector(
    (state) => state.user
  );
  const [updateManager] = useUpdateManagerSettingsMutation();

  if (loading) return <Loading />;

  const initialData = {
    name: user?.name,
    email: user?.email,
    phoneNumber: user?.phoneNumber,
  };

  const handleSubmit = async (data: typeof initialData) => {
    if (!user?.supabaseId) {
      console.error('User Supabase ID is missing');
      return;
    }

    await updateManager({
      id: user?.supabaseId,
      ...data,
    });
  };

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/managers/properties' },
    { label: 'Settings', href: '/managers/settings' },
  ];

  return (
    <div className="dashboard-container">
      <Breadcrumbs items={breadcrumbItems} />
      <SettingsForm
        initialData={initialData}
        onSubmit={handleSubmit}
        userType="manager"
      />
    </div>
  );
};

export default ManagerSettings;
