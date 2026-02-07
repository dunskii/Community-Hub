/**
 * Reset Password Page
 *
 * Page wrapper for the reset password form.
 */

import React from 'react';
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm';

export const ResetPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ResetPasswordForm />
    </div>
  );
};
