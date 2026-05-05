import { StatCard } from './profile-primitives';
import { ORDER_CAPACITY_LABELS } from './profile-helpers';
import { LuTrendingUp, LuStar, LuCalendar, LuPackage } from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';

export function ProfileStats({ user }: { user: SerializedUser }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={LuTrendingUp}
        label="Transactions"
        value={user.totalTransactions.toLocaleString()}
      />
      <StatCard
        icon={LuStar}
        label="Avg. Rating"
        value={user.avgRating.toFixed(1)}
        subValue="out of 5.0"
      />
      <StatCard
        icon={LuCalendar}
        label="Years in Business"
        value={user.yearsInBusiness?.toString() ?? '—'}
      />
      <StatCard
        icon={LuPackage}
        label="Order Capacity"
        value={
          user.orderCapacity
            ? (ORDER_CAPACITY_LABELS.get(user.orderCapacity) ?? user.orderCapacity)
            : '—'
        }
      />
    </div>
  );
}
