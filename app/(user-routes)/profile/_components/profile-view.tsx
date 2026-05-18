'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import type { SerializedUser } from '@/backend/user/user';
import { ProfileHeader } from './profile-header';
import { ProfileStats } from './profile-stats';
import { ProfileInfoGrid } from './profile-info-grid';
import { ProfileBuyerPreferences } from './profile-buyer-preferences';
import { ProfileSupplierDetails } from './profile-supplier-details';
import { ProfileTrustOps } from './profile-trust-ops';
import { ProfileEditModal } from './profile-edit-modal';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type ProfileUser = SerializedUser;

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.56, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

export default function ProfileView({ user }: { user: ProfileUser }) {
  const [isEditing, setIsEditing] = useState(false);

  const isBuyer = user.role === 'STORE_OWNER' || user.role === 'BOTH';
  const isSupplier = user.role === 'SUPPLIER' || user.role === 'BOTH';

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-4">
      <FadeUp delay={0}>
        <ProfileHeader user={user} onEdit={() => setIsEditing(true)} />
      </FadeUp>
      <FadeUp delay={0.08}>
        <ProfileStats user={user} />
      </FadeUp>
      <FadeUp delay={0.16}>
        <ProfileInfoGrid user={user} />
      </FadeUp>
      {isBuyer && (
        <FadeUp delay={0.24}>
          <ProfileBuyerPreferences user={user} />
        </FadeUp>
      )}
      {isSupplier && (
        <FadeUp delay={0.32}>
          <ProfileSupplierDetails user={user} />
        </FadeUp>
      )}
      <FadeUp delay={0.4}>
        <ProfileTrustOps user={user} />
      </FadeUp>
      <ProfileEditModal user={user} isOpen={isEditing} onClose={() => setIsEditing(false)} />
    </div>
  );
}
