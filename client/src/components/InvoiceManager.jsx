import { useRef } from 'react';

export default function InvoiceManager({ invoices, onUpload, onDelete }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onUpload(files);
      e.target.value = ''; // Reset input
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (contentType) => {
    if (contentType === 'application/pdf') {
      return '📄'; // PDF icon
    } else if (contentType?.startsWith('image/')) {
      return '🖼️'; // Image icon
    }
    return '📎'; // Generic file icon
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ border: '1px solid #e2e8f0' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold" style={{ color: '#1e293b' }}>
          Factures d'Achat ({invoices.length})
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-lg font-medium transition-colors text-white"
          style={{ backgroundColor: '#8b5cf6' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
        >
          📤 Ajouter des Factures
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {invoices.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: '#f1f5f9', border: '2px dashed #cbd5e1' }}
        >
          <p style={{ color: '#64748b', marginBottom: '8px' }}>
            Aucune facture téléchargée
          </p>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Formats acceptés: PDF, JPG, PNG (max 10MB par fichier)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 rounded-lg transition-colors"
              style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              <div className="flex items-center gap-3 flex-1">
                <span style={{ fontSize: '24px' }}>
                  {getFileIcon(invoice.content_type)}
                </span>
                <div className="flex-1">
                  <p className="font-medium" style={{ color: '#1e293b' }}>
                    {invoice.filename}
                  </p>
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    {formatFileSize(invoice.size)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={invoice.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#167bff',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
                >
                  📥 Télécharger
                </a>
                <button
                  onClick={() => onDelete(invoice.id)}
                  className="px-3 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#ef4444';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#ef4444';
                  }}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
