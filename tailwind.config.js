/** @type {import('tailwindcss').Config} */

// Helper function to use CSS variables with opacity
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    // Fix this 
    
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic colors using CSS variables
        'app-bg': withOpacity('--color-app-bg'),
        'panel-bg': withOpacity('--color-panel-bg'),
        'panel-secondary': withOpacity('--color-panel-secondary'),
        'input-bg': withOpacity('--color-input-bg'),
        'border-primary': withOpacity('--color-border-primary'),
        'border-secondary': withOpacity('--color-border-secondary'),
        'text-primary': withOpacity('--color-text-primary'),
        'text-secondary': withOpacity('--color-text-secondary'),
        'text-muted': withOpacity('--color-text-muted'),
        'accent': withOpacity('--color-accent'),
        'accent-hover': withOpacity('--color-accent-hover'),
        'accent-text': withOpacity('--color-accent-text'),
      },
    },
  },
  plugins: [],
}

