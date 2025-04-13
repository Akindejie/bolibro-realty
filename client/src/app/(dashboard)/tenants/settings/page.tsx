'use client';

import SettingsForm from '@/components/SettingsForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useUpdateTenantSettingsMutation } from '@/state/api';
import { useAppSelector } from '@/state/redux';
import React from 'react';

const TenantSettings = () => {
  const { user, isAuthenticated, loading } = useAppSelector(
    (state) => state.user
  );
  const [updateTenant] = useUpdateTenantSettingsMutation();

  if (loading) return <>Loading...</>;

  const initialData = {
    name: user?.name,
    email: user?.email,
    phoneNumber: user?.phoneNumber,
  };

  const handleSubmit = async (data: typeof initialData) => {
    await updateTenant({
      id: user?.id,
      ...data,
    });
  };

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/tenants/favorites' },
    { label: 'Settings', href: '/tenants/settings' },
  ];

  return (
    <div className="dashboard-container">
      <Breadcrumbs items={breadcrumbItems} />
      <SettingsForm
        initialData={initialData}
        onSubmit={handleSubmit}
        userType="tenant"
      />
    </div>
  );
};

export default TenantSettings;
