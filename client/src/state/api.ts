import { cleanParams, createNewUserInDatabase, withToast } from '@/lib/utils';
import {
  Application,
  Lease,
  Manager,
  Payment,
  Property,
  Tenant,
} from '@/types/prismaTypes';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { FiltersState } from '.';
import { toast } from 'react-hot-toast';
import { userLogout } from './authSlice';

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};
      if (idToken) {
        headers.set('Authorization', `Bearer ${idToken}`);
      }
      return headers;
    },
  }),
  reducerPath: 'api',
  tagTypes: [
    'Managers',
    'Tenants',
    'Properties',
    'PropertyDetails',
    'Leases',
    'Payments',
    'Applications',
  ],
  endpoints: (build) => ({
    getAuthUser: build.query<User, void>({
      queryFn: async (_, _queryApi, _extraoptions, fetchWithBQ) => {
        try {
          const session = await fetchAuthSession();
          const { idToken } = session.tokens ?? {};
          const user = await getCurrentUser();
          const userRole = idToken?.payload['custom:role'] as string;

          const endpoint =
            userRole === 'manager'
              ? `/managers/${user.userId}`
              : `/tenants/${user.userId}`;

          let userDetailsResponse = await fetchWithBQ(endpoint);

          // if user doesn't exist, create new user
          if (
            userDetailsResponse.error &&
            userDetailsResponse.error.status === 404
          ) {
            userDetailsResponse = await createNewUserInDatabase(
              user,
              idToken,
              userRole,
              fetchWithBQ
            );
          }
          return {
            data: {
              cognitoInfo: { ...user },
              userInfo: userDetailsResponse.data as Tenant | Manager,
              userRole,
            },
          };
        } catch (error: any) {
          return { error: error.message || 'Could not fetch user data' };
        }
      },
    }),

    // property related endpoints
    getProperties: build.query<
      Property[],
      Partial<FiltersState> & { favoriteIds?: number[] }
    >({
      query: (filters) => {
        const params = cleanParams({
          location: filters.location,
          priceMin: filters.priceRange?.[0],
          priceMax: filters.priceRange?.[1],
          beds: filters.beds,
          baths: filters.baths,
          propertyType: filters.propertyType,
          squareFeetMin: filters.squareFeet?.[0],
          squareFeetMax: filters.squareFeet?.[1],
          amenities: filters.amenities?.join(','),
          availableFrom: filters.availableFrom,
          favoriteIds: filters.favoriteIds?.join(','),
          latitude: filters.coordinates?.[1] || null,
          longitude: filters.coordinates?.[0] || null,
        });

        return { url: 'properties', params };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Properties' as const, id })),
              { type: 'Properties', id: 'LIST' },
            ]
          : [{ type: 'Properties', id: 'LIST' }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: 'Failed to fetch properties.',
        });
      },
    }),

    getProperty: build.query<Property, number>({
      query: (id) => `properties/${id}`,
      providesTags: (result, error, id) => [{ type: 'PropertyDetails', id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: 'Failed to load property details.',
        });
      },
    }),

    deleteProperty: build.mutation<{ message: string }, number>({
      query: (propertyId) => ({
        url: `properties/${propertyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Properties'],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Property deleted successfully!',
          error: 'Failed to delete property.',
        });
      },
    }),

    // tenant related endpoints
    getTenant: build.query<Tenant, string>({
      query: (cognitoId) => `tenants/${cognitoId}`,
      providesTags: (result) => [{ type: 'Tenants', id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: 'Failed to load tenant profile.',
        });
      },
    }),

    getCurrentResidences: build.query<Property[], string>({
      query: (cognitoId) => `tenants/${cognitoId}/current-residences`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Properties' as const, id })),
              { type: 'Properties', id: 'LIST' },
            ]
          : [{ type: 'Properties', id: 'LIST' }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: 'Failed to fetch current residences.',
        });
      },
    }),

    updateTenantSettings: build.mutation<
      Tenant,
      { cognitoId: string } & Partial<Tenant>
    >({
      query: ({ cognitoId, ...updatedTenant }) => ({
        url: `tenants/${cognitoId}`,
        method: 'PUT',
        body: updatedTenant,
      }),
      invalidatesTags: (result) => [{ type: 'Tenants', id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Settings updated successfully!',
          error: 'Failed to update settings.',
        });
      },
    }),

    addFavoriteProperty: build.mutation<
      Tenant,
      { cognitoId: string; propertyId: number }
    >({
      query: ({ cognitoId, propertyId }) => ({
        url: `tenants/${cognitoId}/favorites/${propertyId}`,
        method: 'POST',
      }),
      invalidatesTags: (result) => [
        { type: 'Tenants', id: result?.id },
        { type: 'Properties', id: 'LIST' },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Added to favorites!!',
          error: 'Failed to add to favorites',
        });
      },
    }),

    removeFavoriteProperty: build.mutation<
      Tenant,
      { cognitoId: string; propertyId: number }
    >({
      query: ({ cognitoId, propertyId }) => ({
        url: `tenants/${cognitoId}/favorites/${propertyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result) => [
        { type: 'Tenants', id: result?.id },
        { type: 'Properties', id: 'LIST' },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Removed from favorites!',
          error: 'Failed to remove from favorites.',
        });
      },
    }),

    // manager related endpoints
    getManagerProperties: build.query<Property[], string>({
      query: (cognitoId) => `managers/${cognitoId}/properties`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Properties' as const, id })),
              { type: 'Properties', id: 'LIST' },
            ]
          : [{ type: 'Properties', id: 'LIST' }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: 'Failed to load manager properties.',
        });
      },
    }),

    updateManagerSettings: build.mutation<
      Manager,
      { cognitoId: string } & Partial<Manager>
    >({
      query: ({ cognitoId, ...updatedManager }) => ({
        url: `managers/${cognitoId}`,
        method: 'PUT',
        body: updatedManager,
      }),
      invalidatesTags: (result) => [{ type: 'Managers', id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Settings updated successfully!',
          error: 'Failed to update settings.',
        });
      },
    }),

    createProperty: build.mutation<Property, FormData>({
      query: (data) => ({
        url: 'properties',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Properties', id: 'LIST' }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Property created successfully!',
          error: 'Failed to create property.',
        });
      },
    }),

    updateProperty: build.mutation<Property, { id: number; data: FormData }>({
      query: ({ id, data }) => ({
        url: `properties/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Properties', id },
        { type: 'Properties', id: 'LIST' },
        { type: 'PropertyDetails', id },
      ],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          toast.loading('Updating property...', { id: 'updateProperty' });
          await queryFulfilled;
          toast.success('Property updated successfully!', {
            id: 'updateProperty',
          });
        } catch (error: any) {
          console.error('Update property error:', error);
          const errorMessage =
            error?.error?.data?.message || 'Failed to update property.';
          toast.error(errorMessage, { id: 'updateProperty' });
        }
      },
    }),

    updatePropertyStatus: build.mutation<
      Property,
      { id: number; status: PropertyStatus }
    >({
      query: ({ id, status }) => ({
        url: `properties/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Properties', id },
        { type: 'Properties', id: 'LIST' },
        { type: 'PropertyDetails', id },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Property status updated successfully!',
          error: 'Failed to update property status.',
        });
      },
    }),

    updateBulkPropertyStatus: build.mutation<
      { message: string; properties: Property[] },
      { propertyIds: number[]; status: PropertyStatus }
    >({
      query: (data) => ({
        url: 'properties/bulk-status-update',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Properties'],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Properties updated successfully!',
          error: 'Failed to update properties.',
        });
      },
    }),

    removeProperty: build.mutation<void, number>({
      query: (id) => ({
        url: `properties/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Properties', id: 'LIST' }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Property deleted successfully!',
          error: 'Failed to delete property.',
        });
      },
    }),

    // lease related endpoints
    getLeases: build.query<Lease[], number>({
      query: () => 'leases',
      providesTags: ['Leases'],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: 'Failed to fetch leases.',
        });
      },
    }),

    getPropertyLeases: build.query<Lease[], number>({
      query: (propertyId) => `properties/${propertyId}/leases`,
      providesTags: ['Leases'],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: 'Failed to fetch property leases.',
        });
      },
    }),

    getPayments: build.query<Payment[], number>({
      query: (leaseId) => `leases/${leaseId}/payments`,
      providesTags: ['Payments'],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: 'Failed to fetch payment info.',
        });
      },
    }),

    // application related endpoints
    getApplications: build.query<
      Application[],
      { userId?: string; userType?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.userId) {
          queryParams.append('userId', params.userId.toString());
        }
        if (params.userType) {
          queryParams.append('userType', params.userType);
        }

        return `applications?${queryParams.toString()}`;
      },
      providesTags: ['Applications'],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: 'Failed to fetch applications.',
        });
      },
    }),

    updateApplicationStatus: build.mutation<
      Application & { lease?: Lease },
      { id: number; status: string }
    >({
      query: ({ id, status }) => ({
        url: `applications/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Applications', 'Leases'],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Application status updated successfully!',
          error: 'Failed to update application settings.',
        });
      },
    }),

    createApplication: build.mutation<Application, Partial<Application>>({
      query: (body) => ({
        url: `applications`,
        method: 'POST',
        body: body,
      }),
      invalidatesTags: ['Applications'],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: 'Application created successfully!',
          error: 'Failed to create applications.',
        });
      },
    }),

    uploadPropertyImages: build.mutation<
      { imageUrls: string[] },
      { propertyId: string; images: File[] }
    >({
      query: ({ propertyId, images }) => {
        const formData = new FormData();
        images.forEach((image) => {
          formData.append('images', image);
        });

        return {
          url: `properties/${propertyId}/images`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: (result, error, { propertyId }) => [
        { type: 'Properties', id: Number(propertyId) },
        { type: 'PropertyDetails', id: Number(propertyId) },
        { type: 'Properties', id: 'LIST' },
      ],
      async onQueryStarted({ propertyId }, { dispatch, queryFulfilled }) {
        const toastId = `upload-images-${propertyId}-${Date.now()}`;
        toast.loading('Uploading images...', { id: toastId });

        try {
          const result = await queryFulfilled;
          console.log('Image upload success:', result.data);
          toast.success('Images uploaded successfully', { id: toastId });
        } catch (error: any) {
          console.error('Image upload error:', error);

          // More detailed error message
          let errorMessage = 'Failed to upload images.';

          if (error?.error?.data?.message) {
            errorMessage = `Server error: ${error.error.data.message}`;
          } else if (error?.error?.status === 404) {
            errorMessage = 'Upload failed: Storage bucket not found';
          } else if (error?.error?.status >= 500) {
            errorMessage =
              'Server error processing images. Please try again later.';
          }

          console.log('Detailed error message:', errorMessage);
          toast.error(errorMessage, { id: toastId });
        }
      },
    }),

    updatePropertyImages: build.mutation<
      { success: boolean; message: string },
      { propertyId: string; images: string[] }
    >({
      query: ({ propertyId, images }) => ({
        url: `properties/${propertyId}/images`,
        method: 'PUT',
        body: { images },
      }),
      invalidatesTags: (result, error, { propertyId }) => [
        { type: 'Properties', id: Number(propertyId) },
        { type: 'PropertyDetails', id: Number(propertyId) },
        { type: 'Properties', id: 'LIST' },
      ],
      onQueryStarted: async ({ propertyId, images }, { queryFulfilled }) => {
        const toastId = toast.loading('Updating images...');

        try {
          // Check if we're offline
          if (!navigator.onLine) {
            // Save the images to localStorage as backup
            localStorage.setItem(
              `property_${propertyId}_images`,
              JSON.stringify(images)
            );
            toast.error('You are offline. Changes saved locally.', {
              id: toastId,
            });
            throw new Error('You are offline');
          }

          // If online, proceed with the request
          const result = await queryFulfilled;
          console.log('Image update success:', result.data);
          toast.success('Images updated successfully', { id: toastId });
        } catch (err) {
          if (!navigator.onLine) {
            // Already handled above
            return;
          }

          console.error('Failed to update images:', err);
          toast.error('Failed to update images. Please try again.', {
            id: toastId,
          });
        }
      },
    }),

    // Upload a document for a lease
    uploadLeaseDocument: build.mutation<
      { message: string; documentUrl: string },
      { leaseId: number; documentType: string; file: File }
    >({
      query: ({ leaseId, documentType, file }) => {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentType', documentType);

        return {
          url: `/leases/${leaseId}/documents`,
          method: 'POST',
          body: formData,
          // Don't set Content-Type header manually - browser sets it with boundary
        };
      },
      // Invalidate the lease cache when a document is uploaded
      invalidatesTags: (result, error, { leaseId }) => [
        { type: 'Leases', id: leaseId.toString() },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (err: any) {
          let errorMessage = 'Failed to upload document';

          // Extract more specific error from the response
          if (err?.error?.data?.message) {
            errorMessage = err.error.data.message;
          } else if (err?.error?.status === 404) {
            errorMessage =
              'Document storage bucket not found. Please contact support.';
          } else if (err?.error?.status >= 500) {
            errorMessage =
              'Server error uploading document. Please try again later.';
          }

          console.error('Error uploading document:', err, errorMessage);
          toast.error(errorMessage);
        }
      },
    }),
  }),
});

export const {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,
  useUpdateManagerSettingsMutation,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useGetCurrentResidencesQuery,
  useGetManagerPropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useGetTenantQuery,
  useAddFavoritePropertyMutation,
  useRemoveFavoritePropertyMutation,
  useGetLeasesQuery,
  useGetPropertyLeasesQuery,
  useGetPaymentsQuery,
  useGetApplicationsQuery,
  useUpdateApplicationStatusMutation,
  useCreateApplicationMutation,
  useDeletePropertyMutation,
  useUpdatePropertyStatusMutation,
  useUpdateBulkPropertyStatusMutation,
  useUploadPropertyImagesMutation,
  useUpdatePropertyImagesMutation,
  useUploadLeaseDocumentMutation,
} = api;
