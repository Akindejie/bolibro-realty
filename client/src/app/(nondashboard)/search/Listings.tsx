import React from 'react';
import {
  useAddFavoritePropertyMutation,
  useGetPropertiesQuery,
  useGetTenantQuery,
  useRemoveFavoritePropertyMutation,
} from '@/state/api';
import { useAppSelector } from '@/state/redux';
import { Property } from '@/types/prismaTypes';
import Card from '@/components/Card';
import CardCompact from '@/components/CardCompact';
import Loading from '@/components/Loading';
import { toast } from 'sonner';

const Listings = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const { data: tenant } = useGetTenantQuery(user?.supabaseId || '', {
    skip: !isAuthenticated || !user?.supabaseId,
  });
  const [addFavorite] = useAddFavoritePropertyMutation();
  const [removeFavorite] = useRemoveFavoritePropertyMutation();
  const viewMode = useAppSelector((state) => state.global.viewMode);
  const filters = useAppSelector((state) => state.global.filters);

  const {
    data: properties,
    isLoading,
    isError,
  } = useGetPropertiesQuery(filters);

  const handleFavoriteToggle = async (propertyId: number) => {
    if (!isAuthenticated || !user || !user.supabaseId) return;

    const isFavorite = tenant?.favorites?.some(
      (fav: Property) => fav.id === propertyId
    );

    try {
      if (isFavorite) {
        await removeFavorite({
          id: user.supabaseId,
          propertyId,
        });
        toast.success('Removed from favorites!');
      } else {
        await addFavorite({
          id: user.supabaseId,
          propertyId,
        });
        toast.success('Added to favorites!');
      }
    } catch (error) {
      toast.error('Failed to update favorites.');
    }
  };

  if (isLoading) return <Loading />;
  if (isError || !properties) return <>Failed to fetch properties</>;

  return (
    <div className="w-full">
      <h3 className="text-sm px-4 font-bold">
        {properties.length}{' '}
        <span className="text-gray-700 font-normal">
          {filters.location
            ? `Places in ${filters.location}`
            : 'Places available'}
        </span>
      </h3>
      <div className="flex">
        <div className="p-4 w-full">
          {properties?.map((property) =>
            viewMode === 'grid' ? (
              <Card
                key={property.id}
                property={property}
                isFavorite={
                  tenant?.favorites?.some(
                    (fav: Property) => fav.id === property.id
                  ) || false
                }
                onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                showFavoriteButton={!!user}
                propertyLink={`/search/${property.id}`}
              />
            ) : (
              <CardCompact
                key={property.id}
                property={property}
                isFavorite={
                  tenant?.favorites?.some(
                    (fav: Property) => fav.id === property.id
                  ) || false
                }
                onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                showFavoriteButton={!!user}
                propertyLink={`/search/${property.id}`}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Listings;
