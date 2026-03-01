import { useState, useEffect, useRef } from 'react';
import { useDialog } from '../context/DialogContext';
import { useAuth } from '../context/AuthContext';
import FullscreenPhotoViewer from './FullscreenPhotoViewer';

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
 * - Drag-and-drop reordering (when onReorder is provided and canWrite)
 */
export default function PhotoGallery({
  photos = [],
  onUpload,
  onDelete,
  onReorder,
  title = "Photos",
  emptyMessage = "Aucune photo"
}) {
  const { canWrite } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const [fullscreenIndex, setFullscreenIndex] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const swiperRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Local photos state for optimistic drag-and-drop reordering
  const [localPhotos, setLocalPhotos] = useState(photos);
  const draggedIdRef = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Sync local photos when parent updates
  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

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
  }, [localPhotos]);

  // Keyboard navigation for swiper
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (fullscreenIndex === null && swiperRef.current) {
        if (e.key === 'ArrowLeft' && canScrollLeft) {
          scroll('left');
        } else if (e.key === 'ArrowRight' && canScrollRight) {
          scroll('right');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canScrollLeft, canScrollRight, fullscreenIndex]);

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

  // Drag-and-drop handlers
  const handleDragStart = (e, photoId) => {
    draggedIdRef.current = photoId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, photoId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (photoId !== draggedIdRef.current) {
      setDragOverId(photoId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    setDragOverId(null);

    const draggedId = draggedIdRef.current;
    draggedIdRef.current = null;

    if (!draggedId || draggedId === targetId) return;

    const currentPhotos = [...localPhotos];
    const draggedIndex = currentPhotos.findIndex(p => p.id === draggedId);
    const targetIndex = currentPhotos.findIndex(p => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Optimistic reorder
    const reordered = [...currentPhotos];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);
    setLocalPhotos(reordered);

    try {
      await onReorder(reordered.map(p => p.id));
    } catch (error) {
      // Revert on failure
      setLocalPhotos(currentPhotos);
      await showAlert('Erreur lors de la réorganisation', 'error');
    }
  };

  const handleDragEnd = () => {
    draggedIdRef.current = null;
    setDragOverId(null);
  };

  const canReorder = canWrite && typeof onReorder === 'function';

  return (
    <div>
      {/* Section Header */}
      <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>
        {title} ({localPhotos.length})
        {canReorder && localPhotos.length > 1 && (
          <span className="text-sm font-normal ml-2" style={{ color: '#94a3b8' }}>
            — glissez pour réordonner
          </span>
        )}
      </h3>

      {/* Upload Section */}
      {canWrite && (
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
      )}

      {/* Photo Swiper with Navigation */}
      {localPhotos.length === 0 ? (
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
            {localPhotos.map((photo) => (
              <div
                key={photo.id}
                className="photo-swiper-item relative group rounded-lg overflow-hidden flex-shrink-0"
                draggable={canReorder}
                onDragStart={canReorder ? (e) => handleDragStart(e, photo.id) : undefined}
                onDragOver={canReorder ? (e) => handleDragOver(e, photo.id) : undefined}
                onDragLeave={canReorder ? handleDragLeave : undefined}
                onDrop={canReorder ? (e) => handleDrop(e, photo.id) : undefined}
                onDragEnd={canReorder ? handleDragEnd : undefined}
                style={{
                  border: dragOverId === photo.id ? '2px dashed #167bff' : '1px solid #e2e8f0',
                  width: '200px',
                  cursor: canReorder ? 'grab' : 'default',
                  opacity: draggedIdRef.current === photo.id ? 0.5 : 1,
                  transition: 'border-color 0.15s, opacity 0.15s'
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="cursor-pointer"
                  style={{
                    width: '200px',
                    height: '150px',
                    objectFit: 'cover',
                    pointerEvents: canReorder ? 'none' : 'auto'
                  }}
                  onClick={canReorder ? undefined : () => setFullscreenIndex(localPhotos.findIndex(p => p.id === photo.id))}
                  title={canReorder ? undefined : "Cliquez pour voir en plein écran"}
                />

                {/* Click overlay for fullscreen when reorder is active */}
                {canReorder && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      height: '150px',
                      cursor: 'grab'
                    }}
                    onClick={() => setFullscreenIndex(localPhotos.findIndex(p => p.id === photo.id))}
                  />
                )}

                {/* Delete Button (shows on hover) */}
                {canWrite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo);
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', zIndex: 5 }}
                    title="Supprimer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}

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

      {/* Fullscreen Photo Viewer */}
      {fullscreenIndex !== null && (
        <FullscreenPhotoViewer
          photos={localPhotos}
          initialIndex={fullscreenIndex}
          onClose={() => setFullscreenIndex(null)}
        />
      )}
    </div>
  );
}
