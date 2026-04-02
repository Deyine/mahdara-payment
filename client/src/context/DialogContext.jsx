import { createContext, useContext, useState } from 'react';

const DialogContext = createContext();

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export function DialogProvider({ children }) {
  const [alertDialog, setAlertDialog] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showAlert = (message, type = 'error') => {
    return new Promise((resolve) => {
      setAlertDialog({ message, type, resolve });
    });
  };

  const showConfirm = (message, title = 'تأكيد') => {
    return new Promise((resolve) => {
      setConfirmDialog({ message, title, resolve });
    });
  };

  const closeAlert = () => {
    if (alertDialog) {
      alertDialog.resolve();
      setAlertDialog(null);
    }
  };

  const handleConfirm = (result) => {
    if (confirmDialog) {
      confirmDialog.resolve(result);
      setConfirmDialog(null);
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Alert Dialog */}
      {alertDialog && (
        <div
          className="fixed inset-0 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999 }}
          onClick={closeAlert}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Alert Header */}
              <div className="flex items-center gap-3 p-6" style={{ borderBottom: '1px solid #e2e8f0' }}>
                {alertDialog.type === 'error' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
                    <svg className="w-6 h-6" style={{ color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {alertDialog.type === 'success' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
                    <svg className="w-6 h-6" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {alertDialog.type === 'warning' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
                    <svg className="w-6 h-6" style={{ color: '#f59e0b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
                <h3 className="text-lg font-semibold flex-1" style={{ color: '#1e293b', textAlign: 'right' }}>
                  {alertDialog.type === 'error' ? 'خطأ' : alertDialog.type === 'success' ? 'نجاح' : 'تنبيه'}
                </h3>
              </div>

              {/* Alert Body */}
              <div className="p-6">
                <p style={{ color: '#475569', textAlign: 'right' }}>{alertDialog.message}</p>
              </div>

              {/* Alert Footer */}
              <div className="flex justify-end p-6 pt-0">
                <button
                  onClick={closeAlert}
                  className="px-6 py-2 rounded-lg font-medium transition-colors text-white"
                  style={{ backgroundColor: '#167bff' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
                >
                  حسناً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div
          className="fixed inset-0 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999 }}
          onClick={() => handleConfirm(false)}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Confirm Header */}
              <div className="flex items-center gap-3 p-6" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
                  <svg className="w-6 h-6" style={{ color: '#f59e0b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold flex-1" style={{ color: '#1e293b', textAlign: 'right' }}>
                  {confirmDialog.title}
                </h3>
              </div>

              {/* Confirm Body */}
              <div className="p-6">
                <p style={{ color: '#475569', textAlign: 'right' }}>{confirmDialog.message}</p>
              </div>

              {/* Confirm Footer */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => handleConfirm(false)}
                  className="flex-1 px-6 py-2 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  className="flex-1 px-6 py-2 rounded-lg font-medium transition-colors text-white"
                  style={{ backgroundColor: '#ef4444' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
