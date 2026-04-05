/**
 * Google Places Service
 *
 * Enriches business data using the Google Places API (New).
 * Used during CSV bulk import to prefill business profiles.
 *
 * Uses the Places API (New) Text Search endpoint to find businesses
 * by name + address, then fetches details for enrichment.
 */

import { logger } from '../../utils/logger.js';
import { getPlatformConfig } from '../../config/platform-loader.js';

const PLACES_API_BASE = 'https://places.googleapis.com/v1/places';

// ─── Types ──────────────────────────────────────────────────

export interface PlacesSearchInput {
  name: string;
  address?: string;
  phone?: string;
}

export interface PlacesEnrichedData {
  name: string;
  formattedAddress: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  googleMapsUri: string;
  googlePlaceId: string;
  operatingHours: Record<string, { open: string; close: string }> | null;
  rating: number | null;
  userRatingCount: number | null;
  businessType: string | null;
}

interface PlacesTextSearchResponse {
  places?: PlaceResult[];
}

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  location?: { latitude: number; longitude: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  regularOpeningHours?: {
    periods?: OpeningPeriod[];
    weekdayDescriptions?: string[];
  };
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  primaryTypeDisplayName?: { text: string };
}

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

interface OpeningPeriod {
  open: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
}

// ─── Day mapping ────────────────────────────────────────────

const DAY_NAMES: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

// ─── Service ────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_BUSINESS_API_KEY;
  if (!key) {
    throw new Error('GOOGLE_PLACES_API_KEY or GOOGLE_BUSINESS_API_KEY environment variable is required');
  }
  return key;
}

/**
 * Search for a business using Google Places Text Search (New) API
 * and return enriched data.
 */
export async function searchAndEnrichBusiness(
  input: PlacesSearchInput,
): Promise<PlacesEnrichedData | null> {
  const apiKey = getApiKey();

  // Build search query from name + address
  const queryParts = [input.name];
  if (input.address) queryParts.push(input.address);
  const textQuery = queryParts.join(', ');

  try {
    // Step 1: Text Search to find the place
    const searchResponse = await fetch(`${PLACES_API_BASE}:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.addressComponents',
          'places.location',
          'places.nationalPhoneNumber',
          'places.internationalPhoneNumber',
          'places.websiteUri',
          'places.googleMapsUri',
          'places.regularOpeningHours',
          'places.rating',
          'places.userRatingCount',
          'places.primaryType',
          'places.primaryTypeDisplayName',
        ].join(','),
      },
      body: JSON.stringify({ textQuery }),
    });

    if (!searchResponse.ok) {
      const errorBody = await searchResponse.text();
      logger.warn(
        { status: searchResponse.status, body: errorBody, query: textQuery },
        'Google Places search failed',
      );
      return null;
    }

    const searchData = (await searchResponse.json()) as PlacesTextSearchResponse;
    const place = searchData.places?.[0];

    if (!place) {
      logger.info({ query: textQuery }, 'No Google Places result found');
      return null;
    }

    // Step 2: Extract and map data
    return mapPlaceToEnrichedData(place);
  } catch (error) {
    logger.error({ error, query: textQuery }, 'Google Places enrichment error');
    return null;
  }
}

export interface BatchEnrichResult {
  data: PlacesEnrichedData | null;
  error?: string;
}

/**
 * Batch enrich multiple businesses.
 * Processes sequentially with a small delay to respect rate limits.
 * Returns richer results so callers can distinguish "not found" from "API error".
 */
export async function batchEnrichBusinesses(
  inputs: PlacesSearchInput[],
): Promise<BatchEnrichResult[]> {
  const results: BatchEnrichResult[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]!;
    try {
      const data = await searchAndEnrichBusiness(input);
      results.push({ data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Enrichment failed';
      logger.warn({ error, name: input.name }, 'Batch enrichment item error');
      results.push({ data: null, error: message });
    }

    // Small delay between requests to respect rate limits (100ms)
    if (i < inputs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

// ─── Helpers ────────────────────────────────────────────────

function mapPlaceToEnrichedData(place: PlaceResult): PlacesEnrichedData {
  const components = place.addressComponents || [];

  const street = extractAddressComponent(components, 'street_number', 'route');
  const suburb = extractComponent(components, 'locality') ||
    extractComponent(components, 'sublocality_level_1') || '';
  const state = extractComponent(components, 'administrative_area_level_1') || '';
  const postcode = extractComponent(components, 'postal_code') || '';
  const config = getPlatformConfig();
  const country = extractComponent(components, 'country') || config.location.country;

  return {
    name: place.displayName?.text || '',
    formattedAddress: place.formattedAddress || '',
    street,
    suburb,
    state,
    postcode,
    country,
    latitude: place.location?.latitude || 0,
    longitude: place.location?.longitude || 0,
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
    website: place.websiteUri || '',
    googleMapsUri: place.googleMapsUri || '',
    googlePlaceId: place.id || '',
    operatingHours: parseOpeningHours(place.regularOpeningHours?.periods),
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    businessType: place.primaryTypeDisplayName?.text || place.primaryType || null,
  };
}

function extractComponent(components: AddressComponent[], type: string): string | null {
  const comp = components.find((c) => c.types.includes(type));
  return comp?.longText || null;
}

function extractAddressComponent(components: AddressComponent[], ...types: string[]): string {
  const parts: string[] = [];
  for (const type of types) {
    const value = extractComponent(components, type);
    if (value) parts.push(value);
  }
  return parts.join(' ');
}

function parseOpeningHours(
  periods?: OpeningPeriod[],
): Record<string, { open: string; close: string }> | null {
  if (!periods || periods.length === 0) return null;

  const hours: Record<string, { open: string; close: string }> = {};

  for (const period of periods) {
    const dayName = DAY_NAMES[period.open.day];
    if (!dayName) continue;

    const openTime = `${String(period.open.hour).padStart(2, '0')}:${String(period.open.minute).padStart(2, '0')}`;
    const closeTime = period.close
      ? `${String(period.close.hour).padStart(2, '0')}:${String(period.close.minute).padStart(2, '0')}`
      : '23:59';

    hours[dayName] = { open: openTime, close: closeTime };
  }

  return Object.keys(hours).length > 0 ? hours : null;
}
