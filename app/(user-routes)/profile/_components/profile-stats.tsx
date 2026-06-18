import { MetricCard, ProgressBar } from './profile-primitives';
import { ORDER_CAPACITY_LABELS } from './profile-helpers';
import { LuTrendingUp, LuStar, LuCalendar, LuPackage } from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';

export function ProfileStats({ user, onRatingClick }: { user: SerializedUser; onRatingClick?: () => void }) {
  const ratingPct = Math.min((user.avgRating / 5) * 100, 100);
  const experiencePct = Math.min(((user.yearsInBusiness ?? 0) / 20) * 100, 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={LuTrendingUp}
        label="Transactions"
        value={user.totalTransactions.toLocaleString()}
        subValue={user.totalTransactions > 0 ? 'Completed deals' : 'No transactions yet'}
        accent="yellow"
      />
      <MetricCard
        icon={LuStar}
        label="Avg. Rating"
        value={user.avgRating.toFixed(1)}
        subValue={`${ratingPct.toFixed(0)}% of 5.0`}
        accent="green"
        onClick={onRatingClick}
      />
      <MetricCard
        icon={LuCalendar}
        label="Experience"
        value={user.yearsInBusiness ? `${user.yearsInBusiness} yrs` : '—'}
        subValue={user.yearsInBusiness ? `${experiencePct.toFixed(0)}% toward max` : 'Not set'}
        accent="blue"
      />
      <MetricCard
        icon={LuPackage}
        label="Capacity"
        value={
          user.orderCapacity
            ? (ORDER_CAPACITY_LABELS.get(user.orderCapacity) ?? user.orderCapacity)
            : '—'
        }
        subValue={user.orderCapacity ? 'Order handling size' : 'Not set'}
        accent="purple"
      />

      {/* Visual bars row */}
      <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bento-card bento-card-no-hover p-5 flex flex-col justify-center">
          <ProgressBar label="Rating Score" value={user.avgRating} max={5} color="#4ade80" />
        </div>
        <div className="bento-card bento-card-no-hover p-5 flex flex-col justify-center">
          <ProgressBar
            label="Business Maturity"
            value={user.yearsInBusiness ?? 0}
            max={20}
            color="#60a5fa"
          />
        </div>
      </div>
    </div>
  );
}
