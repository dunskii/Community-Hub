/**
 * Enquiry API Service
 * Public business enquiry endpoints
 */

import { post, get } from './api-client';

export interface EnquiryInput {
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
}

export interface Enquiry {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string | null;
  category: string;
  subject: string;
  message: string;
  status: string;
  replyMessage: string | null;
  repliedAt: string | null;
  callCount: number;
  lastCalledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function submitEnquiry(input: EnquiryInput): Promise<Enquiry> {
  const response = await post<ApiResponse<{ enquiry: Enquiry }>>('/enquiries', input);
  return response.data.enquiry;
}

export async function getBusinessEnquiries(
  businessId: string,
  options?: { status?: string; page?: number; limit?: number }
): Promise<{ enquiries: Enquiry[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  const qs = params.toString();
  const response = await get<ApiResponse<{ enquiries: Enquiry[]; total: number }>>(
    `/businesses/${businessId}/enquiries${qs ? `?${qs}` : ''}`
  );
  return response.data;
}

export async function replyToEnquiry(
  businessId: string,
  enquiryId: string,
  message: string
): Promise<Enquiry> {
  const response = await post<ApiResponse<{ enquiry: Enquiry }>>(
    `/businesses/${businessId}/enquiries/${enquiryId}/reply`,
    { message }
  );
  return response.data.enquiry;
}

export async function recordCallClick(
  businessId: string,
  enquiryId: string,
): Promise<Enquiry> {
  const response = await post<ApiResponse<{ enquiry: Enquiry }>>(
    `/businesses/${businessId}/enquiries/${enquiryId}/call`,
    {}
  );
  return response.data.enquiry;
}
