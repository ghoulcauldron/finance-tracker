// src/styles/guide.ts

export interface StyleGuide {
    layout: typeof layoutStyles;
    button: typeof buttonStyles;
    form: typeof formStyles;
    card: typeof cardStyles;
    typography: typeof typographyStyles;
    patterns: typeof patterns;
  }
  
  const layoutStyles = {
    pageContainer: "max-w-6xl mx-auto p-6",
    gridContainer: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
    flexRow: "flex items-center justify-between",
    flexColumn: "flex flex-col space-y-4",
    section: "mb-6",
    sectionDivider: "border-t border-gray-200 my-6"
  } as const;
  
  const buttonStyles = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded",
    danger: "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded",
    success: "bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded",
    iconButton: "text-gray-500 hover:text-gray-700",
    iconButtonPrimary: "text-blue-500 hover:text-blue-700",
    iconButtonDanger: "text-red-500 hover:text-red-700",
    withIcon: "flex items-center gap-2"
  } as const;
  
  const formStyles = {
    input: "w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    select: "p-2 border rounded text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    label: "block text-sm font-medium text-gray-700 mb-1",
    formGrid: "grid grid-cols-2 gap-4",
    formSection: "space-y-4 text-black"
  } as const;
  
  const cardStyles = {
    default: "bg-white shadow rounded-lg",
    header: "px-6 py-4 border-b border-gray-200",
    content: "p-6",
    footer: "px-6 py-4 bg-gray-50 rounded-b-lg",
    hoverable: "transition-shadow hover:shadow-lg",
    bordered: "border border-gray-200"
  } as const;
  
  const typographyStyles = {
    h1: "text-2xl font-bold text-gray-900",
    h2: "text-xl font-semibold text-gray-900",
    h3: "text-lg font-medium text-gray-900",
    h4: "text-base font-medium text-gray-900", // Add h4
    body: "text-gray-600",
    bodyLarge: "text-lg text-gray-600",
    bodySmall: "text-sm text-gray-500",
    amount: "font-mono text-lg",
    currency: "font-mono font-semibold"
  } as const;
  
  const patterns = {
    loadingSpinner: "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900",
    loadingContainer: "flex items-center justify-center min-h-screen",
    errorText: "text-red-500 text-sm",
    errorContainer: "bg-red-50 border-l-4 border-red-500 p-4",
    successText: "text-green-500 text-sm",
    successContainer: "bg-green-50 border-l-4 border-green-500 p-4",
    modalOverlay: "fixed inset-0 bg-black/50 backdrop-blur-sm z-40",
    modalContainer: "fixed inset-0 flex items-center justify-center z-50",
    modalContent: "bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-auto max-h-[90vh]"
  } as const;
  
  // This is the new export that creates and exports the styles object
  export const styles: StyleGuide = {
    layout: layoutStyles,
    button: buttonStyles,
    form: formStyles,
    card: cardStyles,
    typography: typographyStyles,
    patterns: patterns
  };