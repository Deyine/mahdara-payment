import { useState, useEffect } from 'react';

/**
 * FullscreenPhotoViewer Component
 * Displays photos in fullscreen with swipe/navigation support
 *
 * Features:
 * - Navigate between photos with left/right arrows
 * - Keyboard navigation (← → arrows, ESC to close)
 * - Touch swipe support for mobile
 * - Photo counter (e.g., "3 / 10")
 * - Click outside to close
 */
export default function FullscreenPhotoViewer({ photos, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;

  // Navigate to previous photo
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  // Navigate to next photo
  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length]);

  // Touch event handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (!photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full transition-colors z-10"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        title="Fermer (ESC)"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Photo Counter */}
      {photos.length > 1 && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white' }}
        >
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Previous Button */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all z-10"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          title="Photo précédente (←)"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next Button */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all z-10"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          title="Photo suivante (→)"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Photo Display */}
      <div
        className="max-w-7xl max-h-full px-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.filename || `Photo ${currentIndex + 1}`}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          style={{ userSelect: 'none' }}
        />
        <p className="text-center mt-4 text-white font-medium">
          {currentPhoto.filename || `Photo ${currentIndex + 1}`}
        </p>
      </div>

      {/* Swipe indicator for mobile (optional visual feedback) */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-xs px-4 py-2 rounded-full"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', color: 'rgba(255, 255, 255, 0.7)' }}
        >
          ← Glissez pour naviguer →
        </div>
      )}
    </div>
  );
}
