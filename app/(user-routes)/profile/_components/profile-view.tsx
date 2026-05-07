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
    <div className="space-y-5 max-w-6xl mx-auto py-4">
      <div className="fade-up" style={{ animationDelay: '0ms' }}>
        <ProfileHeader user={user} onEdit={() => setIsEditing(true)} />
      </div>
      <div className="fade-up" style={{ animationDelay: '80ms' }}>
        <ProfileStats user={user} />
      </div>
      <div className="fade-up" style={{ animationDelay: '160ms' }}>
        <ProfileInfoGrid user={user} />
      </div>
      {isBuyer && (
        <div className="fade-up" style={{ animationDelay: '240ms' }}>
          <ProfileBuyerPreferences user={user} />
        </div>
      )}
      {isSupplier && (
        <div className="fade-up" style={{ animationDelay: '320ms' }}>
          <ProfileSupplierDetails user={user} />
        </div>
      )}
      <div className="fade-up" style={{ animationDelay: '400ms' }}>
        <ProfileTrustOps user={user} />
      </div>
      <ProfileEditModal user={user} isOpen={isEditing} onClose={() => setIsEditing(false)} />
    </div>
  );
}
