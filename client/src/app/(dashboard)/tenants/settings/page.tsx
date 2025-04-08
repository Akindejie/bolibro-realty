'use client';

import SettingsForm from '@/components/SettingsForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,
} from '@/state/api';
import React from 'react';

const TenantSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateTenant] = useUpdateTenantSettingsMutation();

  if (isLoading) return <>Loading...</>;

  const initialData = {
    name: authUser?.userInfo.name,
    email: authUser?.userInfo.email,
    phoneNumber: authUser?.userInfo.phoneNumber,
  };

  const handleSubmit = async (data: typeof initialData) => {
    await updateTenant({
      cognitoId: authUser?.cognitoInfo?.userId,
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
