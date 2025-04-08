'use client';

import SettingsForm from '@/components/SettingsForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import {
  useGetAuthUserQuery,
  useUpdateManagerSettingsMutation,
} from '@/state/api';
import React from 'react';

const ManagerSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateManager] = useUpdateManagerSettingsMutation();

  if (isLoading) return <>Loading...</>;

  const initialData = {
    name: authUser?.userInfo.name,
    email: authUser?.userInfo.email,
    phoneNumber: authUser?.userInfo.phoneNumber,
  };

  const handleSubmit = async (data: typeof initialData) => {
    await updateManager({
      cognitoId: authUser?.cognitoInfo?.userId,
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
