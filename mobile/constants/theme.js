export const colors = {
  primary: '#e61536',
  primaryDark: '#b81129',
  background: '#ffffff',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  placeholder: '#e2e8f0',
  shadow: '#000000',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const fontFamily = {
  regular: 'Nunito-Regular',
  semiBold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
};

export const fonts = {
  regular: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.text },
  small: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textSecondary },
  title: { fontSize: 20, fontFamily: fontFamily.bold, color: colors.text },
  subtitle: { fontSize: 16, fontFamily: fontFamily.semiBold, color: colors.text },
};
