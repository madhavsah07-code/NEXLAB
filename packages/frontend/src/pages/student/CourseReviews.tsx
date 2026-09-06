// packages/frontend/src/pages/student/CourseReviews.tsx

import React, { useState, useEffect } from 'react';
import { Star, Calendar, Trash2, Edit2, X, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { StarRating } from '../../components/ui/StarRating';
import { useAuthStore } from '../../stores/authStore';
import { formatISTDate } from '../../utils/dateUtils';
import { sanitizeComment } from '../../lib/sanitize';
import { useConfirm } from '../../hooks/useConfirm';
import { addToast } from '../../components/ui/Toast';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CourseReviewsProps {
  courseId: string;
  onReviewChange?: () => void;
}

export const CourseReviews: React.FC<CourseReviewsProps> = ({
  courseId,
  onReviewChange,
}) => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [distribution, setDistribution] = useState<Record<number, number>>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { confirm, ConfirmDialogComponent } = useConfirm();

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reviews/course/${courseId}`);
      const data = response.data.data;
      
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.total || 0);
      setDistribution(data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      setUserReview(data.userReview || null);
      
      if (data.userReview) {
        setRating(data.userReview.rating);
        setComment(data.userReview.comment);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      addToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      addToast('Please write a comment', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const sanitizedComment = sanitizeComment(comment);
      
      if (isEditingReview && userReview) {
        await api.put(`/reviews/${userReview.id}`, { 
          rating, 
          comment: sanitizedComment 
        });
        setIsEditingReview(false);
        addToast('Review updated successfully!', 'success');
      } else {
        await api.post(`/reviews/course/${courseId}`, { 
          rating, 
          comment: sanitizedComment 
        });
        setIsWritingReview(false);
        addToast('Review submitted successfully!', 'success');
      }
      
      setComment('');
      setRating(5);
      await fetchReviews();
      onReviewChange?.();
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    const confirmed = await confirm({
      title: 'Delete Review',
      message: 'Are you sure you want to delete your review? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) return;
    
    try {
      await api.delete(`/reviews/${userReview?.id}`);
      addToast('Review deleted successfully', 'success');
      await fetchReviews();
      onReviewChange?.();
      setUserReview(null);
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Failed to delete review', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <ConfirmDialogComponent />
      <div className="space-y-6">
        {/* Rating Summary */}
        <div className="bg-[#0D0F0F] rounded-xl p-6 border border-[#2A302E]">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-[#EDEFEE]">{averageRating.toFixed(1)}</p>
              <StarRating rating={averageRating} size="md" />
              <p className="text-sm text-[#5C6360] mt-1">{totalReviews} reviews</p>
            </div>

            <div className="flex-1 w-full space-y-1.5">
              {[5, 4, 3, 2, 1].map((ratingValue) => {
                const count = distribution[ratingValue] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={ratingValue} className="flex items-center gap-3">
                    <span className="text-xs text-[#5C6360] w-8">{ratingValue}⭐</span>
                    <div className="flex-1 h-1.5 bg-[#2A302E] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FBBF24] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#5C6360] w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Write Review Section */}
        {user && (
          <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
            {!userReview && !isWritingReview ? (
              <Button
                variant="secondary"
                onClick={() => setIsWritingReview(true)}
                className="gap-2"
              >
                <Star className="w-4 h-4" />
                Write a Review
              </Button>
            ) : (isWritingReview || isEditingReview) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#EDEFEE]">
                    {isEditingReview ? 'Edit Your Review' : 'Write a Review'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsWritingReview(false);
                      setIsEditingReview(false);
                      setRating(userReview?.rating || 5);
                      setComment(userReview?.comment || '');
                    }}
                    className="text-[#5C6360] hover:text-[#EDEFEE] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-[#9CA3A0] mb-2">Your Rating</label>
                  <StarRating
                    rating={rating}
                    size="lg"
                    interactive
                    onRatingChange={setRating}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#9CA3A0] mb-2">Your Review</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this course..."
                    className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] resize-none min-h-[100px] transition-all duration-200"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="gap-2"
                  >
                    {submitting ? 'Submitting...' : isEditingReview ? 'Update Review' : 'Submit Review'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsWritingReview(false);
                      setIsEditingReview(false);
                      setRating(userReview?.rating || 5);
                      setComment(userReview?.comment || '');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-[#5C6360]">
              <p>No reviews yet. Be the first to review this course!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className={`bg-[#161A19] border border-[#2A302E] rounded-xl p-5 ${
                  userReview?.id === review.id ? 'border-[#10B981]/30 bg-[#10B981]/5' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-semibold flex-shrink-0">
                      {review.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-[#EDEFEE]">{review.user.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6360]">
                        <StarRating rating={review.rating} size="sm" />
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatISTDate(review.createdAt, 'datetime')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {userReview?.id === review.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setIsEditingReview(true);
                          setRating(review.rating);
                          setComment(review.comment);
                        }}
                        className="p-1.5 text-[#5C6360] hover:text-[#60A5FA] hover:bg-[#60A5FA]/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDeleteReview}
                        className="p-1.5 text-[#5C6360] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[#9CA3A0] mt-2 text-sm leading-relaxed">{review.comment}</p>
                {userReview?.id === review.id && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-[#10B981]">
                    <Check className="w-3 h-3" />
                    <span>Your review</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default CourseReviews;