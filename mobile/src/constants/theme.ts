export const theme = {
  colors: {
    // Cores primárias empresariais
    primary: '#0066CC', // Azul corporativo
    primaryDark: '#004C99',
    primaryLight: '#3385D6',
    
    // Cores secundárias
    secondary: '#6C757D', // Cinza neutro
    secondaryLight: '#ADB5BD',
    secondaryDark: '#495057',
    
    // Fundos
    background: '#F8F9FA', // Fundo claro neutro
    backgroundSecondary: '#FFFFFF', // Cards brancos
    backgroundTertiary: '#E9ECEF', // Elementos secundários
    backgroundElevated: '#FFFFFF',
    
    // Textos
    textPrimary: '#212529', // Preto/dark gray
    textSecondary: '#6C757D', // Cinza médio
    textTertiary: '#ADB5BD', // Cinza claro
    textInverse: '#FFFFFF',
    
    // Bordas
    border: '#DEE2E6', // Cinza muito claro
    borderLight: '#E9ECEF',
    borderDark: '#CED4DA',
    
    // Estados
    success: '#28A745',
    successLight: 'rgba(40, 167, 69, 0.1)',
    error: '#DC3545',
    errorLight: 'rgba(220, 53, 69, 0.1)',
    warning: '#FFC107',
    warningLight: 'rgba(255, 193, 7, 0.1)',
    info: '#17A2B8',
    infoLight: 'rgba(23, 162, 184, 0.1)',
    
    // Status de reservas
    pending: '#FFC107',
    approved: '#28A745',
    cancelled: '#6C757D',
    
    // Interações
    hover: 'rgba(0, 102, 204, 0.08)',
    pressed: 'rgba(0, 102, 204, 0.12)',
    selected: 'rgba(0, 102, 204, 0.1)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
  },
};
