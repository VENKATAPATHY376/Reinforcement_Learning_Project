export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        canvas: '#F8FAFC',
        sidebar: {
          DEFAULT: '#111827',
          hover: '#1F2937',
          border: '#1F2937',
          text: '#9CA3AF',
        },
        accent: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          soft: '#EEF2FF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        ink: '#111827',
        muted: '#6B7280',
        hairline: '#E5E7EB',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(17, 24, 39, 0.04), 0 1px 3px 0 rgba(17, 24, 39, 0.04)',
        lift: '0 8px 24px -6px rgba(17, 24, 39, 0.12), 0 2px 6px -2px rgba(17, 24, 39, 0.06)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
}
