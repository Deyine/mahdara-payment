import { useState, useEffect, useRef } from 'react';
import { useDialog } from '../context/DialogContext';

/**
 * PhotoGallery Component
 * Reusable component for managing car photo groups (salvage or after-repair)
 *
 * Features:
 * - Upload multiple photos at once
 * - Preview grid (3 columns)
 * - Click to view fullscreen
 * - Delete individual photos
 * - 5MB per photo validation
 */
export default function PhotoGallery({
  photos = [],
  onUpload,
  onDelete,
  title = "Photos",
  emptyMessage = "Aucune photo"
}) {
  const { showAlert, showConfirm } = useDialog();
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const swiperRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position to show/hide navigation arrows
  const checkScrollPosition = () => {
    if (swiperRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = swiperRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Update arrow visibility when photos change
  useEffect(() => {
    checkScrollPosition();
    const handleResize = () => checkScrollPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [photos]);

  // Keyboard navigation for swiper
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!fullscreenImage && swiperRef.current) {
        if (e.key === 'ArrowLeft' && canScrollLeft) {
          scroll('left');
        } else if (e.key === 'ArrowRight' && canScrollRight) {
          scroll('right');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canScrollLeft, canScrollRight, fullscreenImage]);

  // Scroll swiper left or right
  const scroll = (direction) => {
    if (swiperRef.current) {
      const scrollAmount = 220; // Slightly more than photo width for smooth scroll
      const newScrollLeft = direction === 'left'
        ? swiperRef.current.scrollLeft - scrollAmount
        : swiperRef.current.scrollLeft + scrollAmount;

      swiperRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Add webkit scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .photo-swiper {
        scroll-snap-type: x mandatory;
        scrollbar-width: none; /* Hide scrollbar for Firefox */
        -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
      }
      .photo-swiper::-webkit-scrollbar {
        display: none; /* Hide scrollbar for Chrome/Safari */
      }
      .photo-swiper-item {
        scroll-snap-align: start;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Cleanup blob URLs when component unmounts or previews change
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview.url.startsWith('blob:')) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [previews]);

  // Handle file selection with validation
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Format non supporté. Utilisez JPG, PNG, GIF ou WebP`);
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: L'image doit faire moins de 5 Mo`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      showAlert(errors.join('\n'), 'error');
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);

      // Create previews
      const newPreviews = validFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name
      }));
      setPreviews(newPreviews);
    }

    // Reset input
    e.target.value = '';
  };

  // Upload selected photos
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await onUpload(selectedFiles);

      // Clean up previews
      previews.forEach(preview => {
        if (preview.url.startsWith('blob:')) {
          URL.revokeObjectURL(preview.url);
        }
      });

      setSelectedFiles([]);
      setPreviews([]);

      await showAlert(
        `${selectedFiles.length} photo${selectedFiles.length > 1 ? 's' : ''} téléchargée${selectedFiles.length > 1 ? 's' : ''} avec succès`,
        'success'
      );
    } catch (error) {
      await showAlert(
        error.response?.data?.errors?.[0] || 'Erreur lors du téléchargement',
        'error'
      );
    }
  };

  // Cancel selected photos
  const handleCancel = () => {
    // Clean up blob URLs
    previews.forEach(preview => {
      if (preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });

    setSelectedFiles([]);
    setPreviews([]);
  };

  // Delete a photo
  const handleDelete = async (photo) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer cette photo ?',
      'Supprimer la photo'
    );

    if (!confirmed) return;

    try {
      await onDelete(photo.id);
      await showAlert('Photo supprimée avec succès', 'success');
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };

  // ESC key handler for fullscreen viewer
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && fullscreenImage) {
        setFullscreenImage(null);
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [fullscreenImage]);

  return (
    <div>
      {/* Section Header */}
      <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>
        {title} ({photos.length})
      </h3>

      {/* Upload Section */}
      <div className="mb-6">
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileSelect}
          className="mb-3"
          style={{ display: 'block' }}
        />

        {/* Preview Selected Files */}
        {previews.length > 0 && (
          <div className="mb-4">
            <div
              className="photo-swiper"
              style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                overflowY: 'hidden',
                paddingBottom: '12px',
                marginBottom: '12px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
            >
              {previews.map((preview, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="rounded-lg"
                    style={{
                      border: '2px solid #167bff',
                      width: '150px',
                      height: '120px',
                      objectFit: 'cover'
                    }}
                  />
                  <p className="text-xs mt-1 truncate" style={{ color: '#64748b', width: '150px' }}>
                    {preview.name}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#167bff' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
              >
                Télécharger ({previews.length} photo{previews.length > 1 ? 's' : ''})
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Swiper with Navigation */}
      {photos.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: '#f1f5f9', border: '2px dashed #cbd5e1' }}
        >
          <p style={{ color: '#64748b' }}>{emptyMessage}</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Left Navigation Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              style={{
                position: 'absolute',
                left: '-12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                backgroundColor: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.borderColor = '#167bff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
              title="Précédent"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Right Navigation Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              style={{
                position: 'absolute',
                right: '-12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                backgroundColor: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.borderColor = '#167bff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
              title="Suivant"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Swiper Container */}
          <div
            ref={swiperRef}
            className="photo-swiper"
            onScroll={checkScrollPosition}
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              overflowY: 'hidden',
              paddingBottom: '4px',
              paddingTop: '4px'
            }}
          >
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="photo-swiper-item relative group rounded-lg overflow-hidden flex-shrink-0"
                style={{
                  border: '1px solid #e2e8f0',
                  width: '200px'
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="cursor-pointer"
                  style={{
                    width: '200px',
                    height: '150px',
                    objectFit: 'cover'
                  }}
                  onClick={() => setFullscreenImage(photo)}
                  title="Cliquez pour voir en plein écran"
                />

                {/* Delete Button (shows on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo);
                  }}
                  className="absolute top-2 right-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white' }}
                  title="Supprimer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                {/* Photo Info */}
                <div className="p-2" style={{ backgroundColor: '#fafbfc' }}>
                  <p className="text-xs truncate" style={{ color: '#475569' }}>
                    {photo.filename}
                  </p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>
                    {(photo.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full transition-colors"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={fullscreenImage.url}
              alt={fullscreenImage.filename}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <p className="text-center mt-4 text-white font-medium">
              {fullscreenImage.filename}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
