'use client';

import Card from '@/components/Card';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useGetPropertiesQuery, useGetTenantQuery } from '@/state/api';
import { useAppSelector } from '@/state/redux';
import React from 'react';

const Favorites = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  // ✅ Use tenantId instead of user.id
  const tenantId = user?.supabaseId;

  const {
    data: tenant,
    isLoading: isTenantLoading,
    error: tenantError,
  } = useGetTenantQuery(tenantId || '', {
    skip: !isAuthenticated || !tenantId,
  });

  const {
    data: favoriteProperties,
    isLoading: isFavoritesLoading,
    error: favoritesError,
  } = useGetPropertiesQuery(
    { favoriteIds: tenant?.favorites?.map((fav: { id: number }) => fav.id) },
    { skip: !tenant?.favorites || tenant?.favorites.length === 0 }
  );

  if (isTenantLoading || isFavoritesLoading) return <Loading />;
  if (tenantError || favoritesError) return <div>Error loading favorites</div>;

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/tenants/favorites' },
    { label: 'Favorites', href: '/tenants/favorites' },
  ];

  return (
    <div className="dashboard-container">
      <Breadcrumbs items={breadcrumbItems} />
      <Header
        title="Favorited Properties"
        subtitle="Browse and manage your saved property listings"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favoriteProperties?.map((property) => (
          <Card
            key={property.id}
            property={property}
            isFavorite={true}
            onFavoriteToggle={() => {}}
            showFavoriteButton={false}
            propertyLink={`/tenants/residences/${property.id}`}
          />
        ))}
      </div>
      {(!favoriteProperties || favoriteProperties.length === 0) && (
        <p>You don&apos;t have any favorited properties</p>
      )}
    </div>
  );
};

export default Favorites;
