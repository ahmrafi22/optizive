# User matching fields (schema)

This document explains how each field is used for matching, ranking, or filtering in the supplier recommender.

## Core identity
- id: internal identifier for joins and relationships.
- createdAt, updatedAt: audit fields for history and freshness.

## Basic info
- name: human contact name for trust and verification.
- phone: primary login and contact, helps prevent duplicates.
- email: optional contact and recovery.
- username: optional public handle.
- password: auth credential (store hashed).
- businessName: shown in matching results and profiles.

## Role and business profile
- role: decides which matching pipeline to use (seller, supplier, both).
- businessType: pairs retailer to wholesaler/distributor/manufacturer.
- businessSize: ensures scale compatibility and capacity fit.

## Location
- district: main geo filter for matching.
- area: local optimization inside a district.
- latitude, longitude: optional distance scoring and radius filtering.

## Category
- primaryCategory: primary matching key for supplier-seller pairing.
- subCategories: fine-grain tags for similarity scoring and search.

## Seller-specific fields
- monthlyPurchaseRange: estimates demand and buying power.
- pricingPreference: aligns to supplier pricing type.
- negotiationPreference: matches suppliers that allow negotiation.
- maxDeliveryTime: filters suppliers too slow for restock needs.
- preferredDistance: limits matching scope (local vs nationwide).
- buyingPriority: ranking signal (cheap vs fast vs quality).
- restockFrequency: future prediction for alerts and timing.

## Supplier-specific fields
- serviceArea: where the supplier delivers.
- serviceRadiusKm: distance cutoff for local delivery.
- deliveryMethod: logistics compatibility (self, courier, both).
- deliveryTimeRange: used to match seller urgency.
- pricingType: matches seller budget preference.
- bulkDiscountAvailable: promotes suppliers with bulk deals.
- orderCapacity: ensures supplier can satisfy demand size.
- supplierTags: quick scoring signals (fast, cheap, premium).

## Trust and quality signals
- isVerified: trust boost in ranking.
- yearsInBusiness: experience signal.
- avgRating: ranking factor.
- totalTransactions: reliability signal.

## Operational signals
- businessRegistrationId: verification and compliance checks.
- paymentTerms: filtering by seller payment ability.
- minOrderValue: filters sellers below supplier minimum.
- maxOrderValue: avoids over-commitment beyond supplier capacity.
- isActive: exclude inactive users from matching.
- lastActiveAt: freshness scoring and activity-based ranking.
