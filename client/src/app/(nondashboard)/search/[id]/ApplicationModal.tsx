import { CustomFormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { ApplicationFormData, applicationSchema } from '@/lib/schemas';
import { useCreateApplicationMutation } from '@/state/api';
import { useAppSelector } from '@/state/redux';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
const { useState } = React;
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const ApplicationModal = ({
  isOpen,
  onClose,
  propertyId,
}: ApplicationModalProps) => {
  const [createApplication] = useCreateApplicationMutation();
  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // i want to add id upload to the application later
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      occupation: '',
      annualIncome: 0,
      message: '',
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    if (!isAuthenticated || !user || user?.role !== 'tenant') {
      setError('You must be logged in as a tenant to submit an application');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Log the data being sent
      console.log('Submitting application data:', {
        ...data,
        propertyId: Number(propertyId),
        tenantId: user.id,
        applicationDate: new Date().toISOString(),
        status: 'Pending',
      });

      await createApplication({
        ...data,
        applicationDate: new Date().toISOString(),
        status: 'Pending',
        propertyId: Number(propertyId),
        tenantId: user.id,
      });

      toast.success('Application submitted successfully!');
      onClose();
    } catch (error: any) {
      console.error('Failed to submit application:', error);

      // Extract error message from response if available
      const errorMessage =
        error?.data?.message ||
        error?.error?.data?.message ||
        'Failed to submit application. Please try again.';

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader className="mb-4">
          <DialogTitle>Submit Application for this Property</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 mb-4 text-sm border border-red-300 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <CustomFormField
              name="name"
              label="Name"
              type="text"
              placeholder="Enter your full name"
            />
            <CustomFormField
              name="email"
              label="Email"
              type="email"
              placeholder="Enter your email address"
            />
            <CustomFormField
              name="phoneNumber"
              label="Phone Number"
              type="text"
              placeholder="Enter your phone number"
            />
            <CustomFormField
              name="occupation"
              label="Occupation"
              type="text"
              placeholder="Enter your occupation"
            />
            <CustomFormField
              name="annualIncome"
              label="Annual Income"
              type="number"
              placeholder="Enter your annual income"
            />
            <CustomFormField
              name="message"
              label="Message (Optional)"
              type="textarea"
              placeholder="Enter any additional information"
            />
            <Button
              type="submit"
              className="bg-primary-700 text-white w-full"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationModal;
