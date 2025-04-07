// src/styles/guide.d.ts

declare module '@/styles/guide' {
  export interface StyleGuide {
    layout: {
      pageContainer: string;
      gridContainer: string;
      flexRow: string;
      flexColumn: string;
      section: string;
      sectionDivider: string;
    };
    button: {
      primary: string;
      secondary: string;
      danger: string;
      success: string;
      iconButton: string;
      iconButtonPrimary: string;
      iconButtonDanger: string;
      withIcon: string;
    };
    form: {
      input: string;
      select: string;
      label: string;
      formGrid: string;
      formSection: string;
    };
    card: {
      default: string;
      header: string;
      content: string;
      footer: string;
      hoverable: string;
      bordered: string;
    };
    typography: {
      h1: string;
      h2: string;
      h3: string;
      body: string;
      bodyLarge: string;
      bodySmall: string;
      amount: string;
      currency: string;
    };
    patterns: {
      loadingSpinner: string;
      loadingContainer: string;
      errorText: string;
      errorContainer: string;
      successText: string;
      successContainer: string;
    };
  }

  export const styles: StyleGuide;
}