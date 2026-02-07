/**
 * Forgot Password Page
 *
 * Page wrapper for the forgot password form.
 */

import React from 'react';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ForgotPasswordForm />
    </div>
  );
};
