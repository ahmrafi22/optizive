'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, uploadProfileImage, deleteProfileImage } from '@/backend/user/user';
import type { SerializedUser, ProfileUpdatePayload } from '@/backend/user/user';
import { Field, OptionPill } from './profile-primitives';
import {
  BUSINESS_SIZES,
  BUSINESS_TYPES,
  BULK_DISCOUNT_OPTIONS,
  BUYING_PRIORITIES,
  CATEGORIES,
  DELIVERY_METHODS,
  DELIVERY_TIMES,
  DISTANCE_PREFERENCES,
  MONTHLY_PURCHASE_RANGES,
  NEGOTIATION_PREFERENCES,
  PRICING_TYPES,
  RESTOCK_FREQUENCIES,
  SERVICE_AREAS,
  SUPPLIER_TAGS,
} from '@/app/onboarding/_components/constants';
import {
  LuX,
  LuSave,
  LuUpload,
  LuTrash2,
  LuCircleAlert,
  LuUser,
  LuCamera,
} from 'react-icons/lu';

export interface ProfileFormState {
  name: string;
  phone: string;
  email: string;
  username: string;
  businessName: string;
  businessType: string;
  businessSize: string;
  district: string;
  area: string;
  primaryCategory: string;
  subCategoriesInput: string;
  yearsInBusiness: string;
  businessRegistrationId: string;
  paymentTerms: string;
  minOrderValue: string;
  maxOrderValue: string;
  monthlyPurchaseRange: string;
  pricingPreference: string;
  negotiationPreference: string;
  maxDeliveryTime: string;
  preferredDistance: string;
  buyingPriority: string;
  restockFrequency: string;
  serviceArea: string;
  serviceRadiusKm: string;
  deliveryMethod: string;
  deliveryTimeRange: string;
  pricingType: string;
  bulkDiscountAvailable: string;
  orderCapacity: string;
  supplierTags: string[];
}

function toFormState(user: SerializedUser): ProfileFormState {
  return {
    name: user.name ?? '',
    phone: user.phone ?? '',
    email: user.email ?? '',
    username: user.username ?? '',
    businessName: user.businessName ?? '',
    businessType: user.businessType ?? '',
    businessSize: user.businessSize ?? '',
    district: user.district ?? '',
    area: user.area ?? '',
    primaryCategory: user.primaryCategory ?? '',
    subCategoriesInput: user.subCategories.join(', '),
    yearsInBusiness: user.yearsInBusiness?.toString() ?? '',
    businessRegistrationId: user.businessRegistrationId ?? '',
    paymentTerms: user.paymentTerms ?? '',
    minOrderValue: user.minOrderValue?.toString() ?? '',
    maxOrderValue: user.maxOrderValue?.toString() ?? '',
    monthlyPurchaseRange: user.monthlyPurchaseRange ?? '',
    pricingPreference: user.pricingPreference ?? '',
    negotiationPreference: user.negotiationPreference ?? '',
    maxDeliveryTime: user.maxDeliveryTime ?? '',
    preferredDistance: user.preferredDistance ?? '',
    buyingPriority: user.buyingPriority ?? '',
    restockFrequency: user.restockFrequency ?? '',
    serviceArea: user.serviceArea ?? '',
    serviceRadiusKm: user.serviceRadiusKm?.toString() ?? '',
    deliveryMethod: user.deliveryMethod ?? '',
    deliveryTimeRange: user.deliveryTimeRange ?? '',
    pricingType: user.pricingType ?? '',
    bulkDiscountAvailable:
      user.bulkDiscountAvailable === null || user.bulkDiscountAvailable === undefined
        ? ''
        : user.bulkDiscountAvailable
          ? 'true'
          : 'false',
    orderCapacity: user.orderCapacity ?? '',
    supplierTags: user.supplierTags ?? [],
  };
}

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringArray(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProfileEditModal({
  user,
  isOpen,
  onClose,
}: {
  user: SerializedUser;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProfileFormState>(() => toFormState(user));
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [show, setShow] = useState(isOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  const isBuyer = user.role === 'STORE_OWNER' || user.role === 'BOTH';
  const isSupplier = user.role === 'SUPPLIER' || user.role === 'BOTH';

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setDraft(toFormState(user));
      setErrorMessage(null);
    } else {
      const t = setTimeout(() => setShow(false), 280);
      return () => clearTimeout(t);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!isSaving) onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isOpen, isSaving]);

  const handleSave = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const name = draft.name.trim();
      if (!name) {
        setErrorMessage('Name is required.');
        return;
      }

      const payload: ProfileUpdatePayload = {
        name,
        phone: toNullableString(draft.phone),
        email: toNullableString(draft.email),
        username: toNullableString(draft.username),
        businessName: toNullableString(draft.businessName),
        businessType: draft.businessType || null,
        businessSize: draft.businessSize || null,
        district: toNullableString(draft.district),
        area: toNullableString(draft.area),
        primaryCategory: draft.primaryCategory || null,
        subCategories: toStringArray(draft.subCategoriesInput),
        yearsInBusiness: toNullableNumber(draft.yearsInBusiness),
        businessRegistrationId: toNullableString(draft.businessRegistrationId),
        paymentTerms: toNullableString(draft.paymentTerms),
        minOrderValue: toNullableNumber(draft.minOrderValue),
        maxOrderValue: toNullableNumber(draft.maxOrderValue),
        monthlyPurchaseRange: draft.monthlyPurchaseRange || null,
        pricingPreference: draft.pricingPreference || null,
        negotiationPreference: draft.negotiationPreference || null,
        maxDeliveryTime: draft.maxDeliveryTime || null,
        preferredDistance: draft.preferredDistance || null,
        buyingPriority: draft.buyingPriority || null,
        restockFrequency: draft.restockFrequency || null,
        serviceArea: draft.serviceArea || null,
        serviceRadiusKm: toNullableNumber(draft.serviceRadiusKm),
        deliveryMethod: draft.deliveryMethod || null,
        deliveryTimeRange: draft.deliveryTimeRange || null,
        pricingType: draft.pricingType || null,
        bulkDiscountAvailable:
          draft.bulkDiscountAvailable === ''
            ? null
            : draft.bulkDiscountAvailable === 'true',
        orderCapacity: draft.orderCapacity || null,
        supplierTags: draft.supplierTags,
      };

      setIsSaving(true);
      setErrorMessage(null);

      try {
        const result = await updateProfile(payload);

        if (!result.ok) {
          setErrorMessage(result.message ?? 'Unable to update profile.');
          setIsSaving(false);
          return;
        }

        onClose();
        router.refresh();
      } catch (error) {
        console.error('Profile update failed', error);
        setErrorMessage('Unable to update profile.');
      } finally {
        setIsSaving(false);
      }
    },
    [draft, onClose, router]
  );

  const supplierTagOptions = useMemo(
    () => SUPPLIER_TAGS.map((tag) => ({ value: tag.value, label: tag.label ?? tag.value })),
    []
  );

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setImageError('Image must be under 5MB');
        return;
      }

      setIsUploadingImage(true);
      setImageError(null);

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await uploadProfileImage(base64);

        if (!result.ok) {
          throw new Error(result.message || 'Upload failed');
        }

        router.refresh();
      } catch (error) {
        console.error('Image upload failed', error);
        setImageError('Failed to upload image');
      } finally {
        setIsUploadingImage(false);
        event.target.value = '';
      }
    },
    [router]
  );

  const handleImageDelete = useCallback(async () => {
    setIsUploadingImage(true);
    setImageError(null);

    try {
      const result = await deleteProfileImage();

      if (!result.ok) {
        throw new Error(result.message || 'Delete failed');
      }

      router.refresh();
    } catch (error) {
      console.error('Image delete failed', error);
      setImageError('Failed to delete image');
    } finally {
      setIsUploadingImage(false);
    }
  }, [router]);

  if (!show) return null;

  const roleAccentColor = user.role === 'SUPPLIER' ? '#4ecdc4' : user.role === 'STORE_OWNER' ? '#60a5fa' : '#fff44f';
  const inputBase = 'w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all';
  const selectBase = 'w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all appearance-none';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'pointer-events-none'}`}
    >
      {/* Backdrop — no blur for performance */}
      <div
        className="absolute inset-0 bg-black/70 transition-opacity duration-300 ease-out"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={isSaving ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal panel — GPU-accelerated scale+opacity */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
        className="relative mx-4 max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface2) shadow-2xl transition-all duration-300 ease-out will-change-transform"
        style={{
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(12px)',
        }}
        onClick={(event) => event.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between border-b border-(--clr-border) px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(255,244,79,0.12)] flex items-center justify-center">
              <LuUser className="w-4 h-4 text-(--clr-yellow)" />
            </div>
            <div>
              <h2 id="profile-edit-title" className="text-base font-bold text-(--clr-fg)">
                Edit Profile
              </h2>
              <p className="text-[11px] text-(--clr-fg-muted)">
                Update your info and matching preferences
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={isSaving ? undefined : onClose}
            className="btn-press inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface) text-(--clr-fg-dim) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors"
            aria-label="Close profile editor"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="max-h-[calc(92vh-72px)] overflow-y-auto"
        >
          <div className="px-6 py-6 space-y-6">
            {/* Profile Picture */}
            <div className="relative overflow-hidden rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-5">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-(--clr-yellow) to-transparent opacity-50" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim) mb-4">
                Profile Picture
              </p>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-(--clr-yellow) flex items-center justify-center text-(--clr-charcoal) text-2xl font-bold overflow-hidden ring-4 ring-(--clr-surface2) shadow-lg">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                  <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-(--clr-surface2) border border-(--clr-border) flex items-center justify-center cursor-pointer hover:border-(--clr-border-hover) transition-colors shadow-sm">
                    <LuCamera className="w-3.5 h-3.5 text-(--clr-fg)" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="btn-press inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-(--clr-fg) hover:border-(--clr-border-hover) cursor-pointer disabled:opacity-60">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                    <LuUpload className="h-3.5 w-3.5" />
                    {isUploadingImage ? 'Uploading...' : 'Upload New'}
                  </label>
                  {user.profileImage && (
                    <button
                      type="button"
                      onClick={handleImageDelete}
                      disabled={isUploadingImage}
                      className="btn-press inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-red-400 hover:border-red-400/50 hover:text-red-300 disabled:opacity-60 transition-colors"
                    >
                      <LuTrash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {imageError && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
                  <LuCircleAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{imageError}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Identity & Contact */}
              <div className="relative overflow-hidden rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-5 space-y-4">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-(--clr-yellow) to-transparent opacity-40 rounded-l-2xl" />
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
                  Identity & Contact
                </p>
                <Field label="Full name" htmlFor="name">
                  <input
                    id="name"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className={inputBase}
                  />
                </Field>
                <Field label="Business name" htmlFor="businessName">
                  <input
                    id="businessName"
                    value={draft.businessName}
                    onChange={(e) => setDraft({ ...draft, businessName: e.target.value })}
                    className={inputBase}
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Email" htmlFor="email">
                    <input
                      id="email"
                      type="email"
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      className={inputBase}
                    />
                  </Field>
                  <Field label="Phone" htmlFor="phone">
                    <input
                      id="phone"
                      value={draft.phone}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      className={inputBase}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Username" htmlFor="username">
                    <input
                      id="username"
                      value={draft.username}
                      onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                      className={inputBase}
                    />
                  </Field>
                  <Field label="Years in business" htmlFor="yearsInBusiness">
                    <input
                      id="yearsInBusiness"
                      type="number"
                      value={draft.yearsInBusiness}
                      onChange={(e) => setDraft({ ...draft, yearsInBusiness: e.target.value })}
                      className={inputBase}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Registration ID" htmlFor="businessRegistrationId">
                    <input
                      id="businessRegistrationId"
                      value={draft.businessRegistrationId}
                      onChange={(e) =>
                        setDraft({ ...draft, businessRegistrationId: e.target.value })
                      }
                      className={inputBase}
                    />
                  </Field>
                  <Field label="Payment terms" htmlFor="paymentTerms">
                    <input
                      id="paymentTerms"
                      value={draft.paymentTerms}
                      onChange={(e) => setDraft({ ...draft, paymentTerms: e.target.value })}
                      className={inputBase}
                    />
                  </Field>
                </div>
              </div>

              {/* Business Context */}
              <div className="relative overflow-hidden rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-5 space-y-4">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-(--clr-teal) to-transparent opacity-40 rounded-l-2xl" />
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
                  Business Context
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Business type" htmlFor="businessType">
                    <select
                      id="businessType"
                      value={draft.businessType}
                      onChange={(e) => setDraft({ ...draft, businessType: e.target.value })}
                      className={selectBase}
                    >
                      <option value="">Select type</option>
                      {BUSINESS_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Business size" htmlFor="businessSize">
                    <select
                      id="businessSize"
                      value={draft.businessSize}
                      onChange={(e) => setDraft({ ...draft, businessSize: e.target.value })}
                      className={selectBase}
                    >
                      <option value="">Select size</option>
                      {BUSINESS_SIZES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Primary category" htmlFor="primaryCategory">
                  <select
                    id="primaryCategory"
                    value={draft.primaryCategory}
                    onChange={(e) => setDraft({ ...draft, primaryCategory: e.target.value })}
                    className={selectBase}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Sub categories" htmlFor="subCategories" hint="Comma-separated tags for secondary categories.">
                  <input
                    id="subCategories"
                    value={draft.subCategoriesInput}
                    onChange={(e) => setDraft({ ...draft, subCategoriesInput: e.target.value })}
                    className={inputBase}
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="District" htmlFor="district">
                    <input
                      id="district"
                      value={draft.district}
                      onChange={(e) => setDraft({ ...draft, district: e.target.value })}
                      className={inputBase}
                    />
                  </Field>
                  <Field label="Area" htmlFor="area">
                    <input
                      id="area"
                      value={draft.area}
                      onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                      className={inputBase}
                    />
                  </Field>
                </div>
              </div>

              {/* Buyer Preferences */}
              {isBuyer && (
                <div className="relative overflow-hidden rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-5 space-y-4">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-blue-400 to-transparent opacity-40 rounded-l-2xl" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
                    Buyer Preferences
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Monthly purchase" htmlFor="monthlyPurchaseRange">
                      <select
                        id="monthlyPurchaseRange"
                        value={draft.monthlyPurchaseRange}
                        onChange={(e) =>
                          setDraft({ ...draft, monthlyPurchaseRange: e.target.value })
                        }
                        className={selectBase}
                      >
                        <option value="">Select range</option>
                        {MONTHLY_PURCHASE_RANGES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Pricing preference" htmlFor="pricingPreference">
                      <select
                        id="pricingPreference"
                        value={draft.pricingPreference}
                        onChange={(e) =>
                          setDraft({ ...draft, pricingPreference: e.target.value })
                        }
                        className={selectBase}
                      >
                        <option value="">Select preference</option>
                        {PRICING_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Negotiation" htmlFor="negotiationPreference">
                      <select
                        id="negotiationPreference"
                        value={draft.negotiationPreference}
                        onChange={(e) =>
                          setDraft({ ...draft, negotiationPreference: e.target.value })
                        }
                        className={selectBase}
                      >
                        <option value="">Select preference</option>
                        {NEGOTIATION_PREFERENCES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Max delivery time" htmlFor="maxDeliveryTime">
                      <select
                        id="maxDeliveryTime"
                        value={draft.maxDeliveryTime}
                        onChange={(e) => setDraft({ ...draft, maxDeliveryTime: e.target.value })}
                        className={selectBase}
                      >
                        <option value="">Select time</option>
                        {DELIVERY_TIMES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Preferred distance" htmlFor="preferredDistance">
                      <select
                        id="preferredDistance"
                        value={draft.preferredDistance}
                        onChange={(e) =>
                          setDraft({ ...draft, preferredDistance: e.target.value })
                        }
                        className={selectBase}
                      >
                        <option value="">Select distance</option>
                        {DISTANCE_PREFERENCES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Buying priority" htmlFor="buyingPriority">
                      <select
                        id="buyingPriority"
                        value={draft.buyingPriority}
                        onChange={(e) => setDraft({ ...draft, buyingPriority: e.target.value })}
                        className={selectBase}
                      >
                        <option value="">Select priority</option>
                        {BUYING_PRIORITIES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label="Restock frequency" htmlFor="restockFrequency">
                    <select
                      id="restockFrequency"
                      value={draft.restockFrequency}
                      onChange={(e) => setDraft({ ...draft, restockFrequency: e.target.value })}
                      className={selectBase}
                    >
                      <option value="">Select frequency</option>
                      {RESTOCK_FREQUENCIES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}

              {/* Supplier Capabilities */}
              {isSupplier && (
                <div className="relative overflow-hidden rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-5 space-y-4">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-(--clr-teal) to-transparent opacity-40 rounded-l-2xl" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
                    Supplier Capabilities
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Service area" htmlFor="serviceArea">
                      <select
                        id="serviceArea"
                        value={draft.serviceArea}
                        onChange={(e) => setDraft({ ...draft, serviceArea: e.target.value })}
                        className={selectBase}
                      >
                        <option value="">Select area</option>
                        {SERVICE_AREAS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Service radius (km)" htmlFor="serviceRadiusKm">
                      <input
                        id="serviceRadiusKm"
                        type="number"
                        value={draft.serviceRadiusKm}
                        onChange={(e) => setDraft({ ...draft, serviceRadiusKm: e.target.value })}
                        className={inputBase}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Delivery method" htmlFor="deliveryMethod">
                      <select
                        id="deliveryMethod"
                        value={draft.deliveryMethod}
                        onChange={(e) => setDraft({ ...draft, deliveryMethod: e.target.value })}
                        className={selectBase}
                      >
                        <option value="">Select method</option>
                        {DELIVERY_METHODS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Delivery time range" htmlFor="deliveryTimeRange">
                      <select
                        id="deliveryTimeRange"
                        value={draft.deliveryTimeRange}
                        onChange={(e) =>
                          setDraft({ ...draft, deliveryTimeRange: e.target.value })
                        }
                        className={selectBase}
                      >
                        <option value="">Select time</option>
                        {DELIVERY_TIMES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Pricing type" htmlFor="pricingType">
                      <select
                        id="pricingType"
                        value={draft.pricingType}
                        onChange={(e) => setDraft({ ...draft, pricingType: e.target.value })}
                        className={selectBase}
                      >
                        <option value="">Select type</option>
                        {PRICING_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Bulk discount" htmlFor="bulkDiscountAvailable">
                      <select
                        id="bulkDiscountAvailable"
                        value={draft.bulkDiscountAvailable}
                        onChange={(e) =>
                          setDraft({ ...draft, bulkDiscountAvailable: e.target.value })
                        }
                        className={selectBase}
                      >
                        <option value="">Select status</option>
                        {BULK_DISCOUNT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Order capacity" htmlFor="orderCapacity">
                      <select
                        id="orderCapacity"
                        value={draft.orderCapacity}
                        onChange={(e) => setDraft({ ...draft, orderCapacity: e.target.value })}
                        className={selectBase}
                      >
                        <option value="">Select capacity</option>
                        {BUSINESS_SIZES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Min order value" htmlFor="minOrderValue">
                        <input
                          id="minOrderValue"
                          type="number"
                          value={draft.minOrderValue}
                          onChange={(e) =>
                            setDraft({ ...draft, minOrderValue: e.target.value })
                          }
                          className={inputBase}
                        />
                      </Field>
                      <Field label="Max order value" htmlFor="maxOrderValue">
                        <input
                          id="maxOrderValue"
                          type="number"
                          value={draft.maxOrderValue}
                          onChange={(e) =>
                            setDraft({ ...draft, maxOrderValue: e.target.value })
                          }
                          className={inputBase}
                        />
                      </Field>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
                      Supplier tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {supplierTagOptions.map((option) => (
                        <OptionPill
                          key={option.value}
                          label={option.label}
                          checked={draft.supplierTags.includes(option.value)}
                          onChange={() => {
                            if (draft.supplierTags.includes(option.value)) {
                              setDraft({
                                ...draft,
                                supplierTags: draft.supplierTags.filter(
                                  (tag) => tag !== option.value
                                ),
                              });
                            } else {
                              setDraft({
                                ...draft,
                                supplierTags: [...draft.supplierTags, option.value],
                              });
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <LuCircleAlert className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-200">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 border-t border-(--clr-border) bg-(--clr-surface2) px-6 py-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn-press inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface) px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors"
            >
              <LuX className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-press inline-flex items-center gap-2 rounded-full border border-(--clr-yellow) bg-(--clr-yellow) px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-(--clr-charcoal) hover:brightness-105 disabled:opacity-60 transition-all shadow-[0_0_20px_rgba(255,244,79,0.15)]"
            >
              <LuSave className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
