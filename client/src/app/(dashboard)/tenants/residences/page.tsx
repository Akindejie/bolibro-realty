'use client';

import Card from '@/components/Card';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useGetCurrentResidencesQuery, useGetTenantQuery } from '@/state/api';
import { useAppSelector } from '@/state/redux';
import React from 'react';

const Residences = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const { data: tenant } = useGetTenantQuery(user?.id || '', {
    skip: !isAuthenticated || !user?.id,
  });

  const {
    data: currentResidences,
    isLoading,
    error,
  } = useGetCurrentResidencesQuery(user?.id || '', {
    skip: !isAuthenticated || !user?.id,
  });

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading current residences</div>;

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/tenants/favorites' },
    { label: 'Residences', href: '/tenants/residences' },
  ];

  return (
    <div className="dashboard-container">
      <Breadcrumbs items={breadcrumbItems} />
      <Header
        title="Current Residences"
        subtitle="View and manage your current living spaces"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentResidences?.map((property) => (
          <Card
            key={property.id}
            property={property}
            isFavorite={tenant?.favorites.includes(property.id) || false}
            onFavoriteToggle={() => {}}
            showFavoriteButton={false}
            propertyLink={`/tenants/residences/${property.id}`}
          />
        ))}
      </div>
      {(!currentResidences || currentResidences.length === 0) && (
        <p>You don&apos;t have any current residences</p>
      )}
    </div>
  );
};

export default Residences;
