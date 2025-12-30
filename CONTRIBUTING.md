# Contributing to PDF Kit

Thank you for your interest in contributing to PDF Kit! This guide will help you get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Translations](#translations)

---

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Git

### Setup

1. **Fork the repository**
   
   Click "Fork" on GitHub to create your copy.

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pdf-kit.git
   cd pdf-kit
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/user/pdf-kit.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code patterns
- Add tests for new features
- Update documentation if needed

### 3. Test Your Changes

```bash
npm run test        # Run tests
npm run lint        # Check code style
npm run build       # Verify build works
```

### 4. Commit Changes

Write clear commit messages:

```bash
git commit -m "feat: add PDF watermark feature"
git commit -m "fix: resolve crash when opening large files"
git commit -m "docs: update installation instructions"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no feature/fix |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub.

---

## Pull Request Process

### Before Submitting

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated (if needed)
- [ ] Commits are clean and well-described

### PR Description

Include:
- What the PR does
- Related issue number (if any)
- Screenshots (for UI changes)
- Testing instructions

### Review Process

1. Automated checks run
2. Maintainers review code
3. Feedback addressed
4. Approval and merge

---

## Coding Standards

### TypeScript

- Use strict mode
- Define types explicitly
- Avoid `any` when possible

```typescript
// Good
function processPage(page: PDFPage): ProcessResult {
  // ...
}

// Avoid
function processPage(page: any) {
  // ...
}
```

### React Components

- Use functional components
- Use hooks for state/effects
- Keep components focused

```tsx
// Good
const PageNavigation: React.FC<Props> = ({ currentPage, totalPages, onNavigate }) => {
  return (
    <div className="page-navigation">
      <button onClick={() => onNavigate(currentPage - 1)}>Prev</button>
      <span>{currentPage} / {totalPages}</span>
      <button onClick={() => onNavigate(currentPage + 1)}>Next</button>
    </div>
  );
};
```

### CSS

- Use meaningful class names
- Follow BEM-like naming
- Use CSS variables for theming

```css
.pdf-viewer { }
.pdf-viewer__toolbar { }
.pdf-viewer__page { }
.pdf-viewer__page--active { }
```

---

## Testing

### Running Tests

```bash
npm run test           # All tests
npm run test -- --watch # Watch mode
npm run test -- path/to/test.ts # Specific file
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = processInput(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Coverage

Aim for meaningful coverage, not just high numbers.

---

## Documentation

### Code Comments

- Explain "why", not "what"
- Document complex algorithms
- Use JSDoc for functions

```typescript
/**
 * Splits a PDF into multiple files based on page ranges.
 * @param pdf - The source PDF document
 * @param ranges - Array of page ranges to extract
 * @returns Array of new PDF documents
 */
async function splitPDF(pdf: PDFDocument, ranges: PageRange[]): Promise<PDFDocument[]> {
  // ...
}
```

### Documentation Files

- Keep docs up to date with code
- Use clear, simple language
- Include examples

---

## Translations

### Adding Translations

1. Copy `src/renderer/i18n/locales/en.json`
2. Rename to your language code (e.g., `es.json`)
3. Translate all strings
4. Add to i18n configuration

### Translation Guidelines

- Keep same JSON structure
- Preserve placeholders like `{{name}}`
- Test in the app

---

## Getting Help

- Open an [issue](https://github.com/user/pdf-kit/issues) for bugs
- Use [discussions](https://github.com/user/pdf-kit/discussions) for questions
- Join our community chat (coming soon)

---

## Recognition

Contributors are listed in:
- CHANGELOG.md for each release
- README.md contributors section

Thank you for contributing! 🎉
