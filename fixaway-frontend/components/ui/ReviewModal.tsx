import { useState } from 'react';
import { reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from './ToastProvider';

interface ReviewModalProps {
  orderId: string;
  technicianName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ orderId, technicianName, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { accessToken } = useAuthStore();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    
    setIsSubmitting(true);
    try {
      await reviewsApi.submit(accessToken, orderId, rating, comment);
      showToast('Thank you for your review!', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">star</span>
          </div>
          <h2 className="text-2xl font-bold text-primary">Job Completed!</h2>
          <p className="text-on-surface-variant text-sm mt-1">How was your experience with {technicianName}?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
              >
                <span 
                  className={`material-symbols-outlined text-4xl ${star <= rating ? 'text-yellow-400' : 'text-outline-variant/50'}`}
                  style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Leave a comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you liked..."
              className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-surface-container-low text-on-surface font-semibold py-3 rounded-xl hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
