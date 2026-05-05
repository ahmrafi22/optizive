'use client';

import { useState } from 'react';
import type { SerializedUser } from '@/backend/user/user';
import { ProfileHeader } from './profile-header';
import { ProfileStats } from './profile-stats';
import { ProfileInfoGrid } from './profile-info-grid';
import { ProfileBuyerPreferences } from './profile-buyer-preferences';
import { ProfileSupplierDetails } from './profile-supplier-details';
import { ProfileTrustOps } from './profile-trust-ops';
import { ProfileEditModal } from './profile-edit-modal';

type ProfileUser = SerializedUser;

export default function ProfileView({ user }: { user: ProfileUser }) {
  const [isEditing, setIsEditing] = useState(false);

  const isBuyer = user.role === 'STORE_OWNER' || user.role === 'BOTH';
  const isSupplier = user.role === 'SUPPLIER' || user.role === 'BOTH';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ProfileHeader user={user} onEdit={() => setIsEditing(true)} />
      <ProfileStats user={user} />
      <ProfileInfoGrid user={user} />
      {isBuyer && <ProfileBuyerPreferences user={user} />}
      {isSupplier && <ProfileSupplierDetails user={user} />}
      <ProfileTrustOps user={user} />
      <ProfileEditModal user={user} isOpen={isEditing} onClose={() => setIsEditing(false)} />
    </div>
  );
}
