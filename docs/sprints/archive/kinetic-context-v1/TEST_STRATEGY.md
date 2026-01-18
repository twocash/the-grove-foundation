# TEST_STRATEGY.md — kinetic-context-v1

## Component Tests

### File: `src/surface/components/KineticStream/__tests__/KineticHeader.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { KineticHeader } from '../KineticHeader';

describe('KineticHeader', () => {
  it('renders title', () => {
    render(<KineticHeader />);
    expect(screen.getByText('Explore The Grove')).toBeInTheDocument();
  });

  it('renders lens pill when lensName provided', () => {
    render(<KineticHeader lensName="Engineer" />);
    expect(screen.getByText('Engineer')).toBeInTheDocument();
  });

  it('calls onLensClick when pill clicked', () => {
    const onLensClick = jest.fn();
    render(<KineticHeader lensName="Engineer" onLensClick={onLensClick} />);
    fireEvent.click(screen.getByText('Engineer'));
    expect(onLensClick).toHaveBeenCalled();
  });

  it('renders stage indicator', () => {
    render(<KineticHeader stage="EXPLORING" exchangeCount={5} />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('Exploring')).toBeInTheDocument();
    expect(screen.getByText('• 5')).toBeInTheDocument();
  });

  it('renders streak when provided', () => {
    render(<KineticHeader currentStreak={7} showStreak={true} />);
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
```

### File: `src/surface/components/KineticStream/__tests__/KineticWelcome.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { KineticWelcome } from '../KineticWelcome';

const mockContent = {
  heading: 'Test Heading',
  thesis: 'Test thesis text',
  prompts: ['Prompt 1', 'Prompt 2', 'Prompt 3'],
  footer: 'Test footer'
};

describe('KineticWelcome', () => {
  it('renders heading and thesis', () => {
    render(<KineticWelcome content={mockContent} onPromptClick={jest.fn()} />);
    expect(screen.getByText('Test Heading')).toBeInTheDocument();
    expect(screen.getByText('Test thesis text')).toBeInTheDocument();
  });

  it('renders prompts as buttons', () => {
    render(<KineticWelcome content={mockContent} onPromptClick={jest.fn()} />);
    expect(screen.getByText('Prompt 1')).toBeInTheDocument();
    expect(screen.getByText('Prompt 2')).toBeInTheDocument();
    expect(screen.getByText('Prompt 3')).toBeInTheDocument();
  });

  it('calls onPromptClick when prompt clicked', () => {
    const onPromptClick = jest.fn();
    render(<KineticWelcome content={mockContent} onPromptClick={onPromptClick} />);
    fireEvent.click(screen.getByText('Prompt 1'));
    expect(onPromptClick).toHaveBeenCalledWith('Prompt 1', undefined, undefined);
  });

  it('uses provided prompts over content prompts', () => {
    const customPrompts = [{ id: '1', text: 'Custom Prompt', journeyId: 'journey-1' }];
    const onPromptClick = jest.fn();
    render(
      <KineticWelcome 
        content={mockContent} 
        prompts={customPrompts}
        onPromptClick={onPromptClick} 
      />
    );
    expect(screen.getByText('Custom Prompt')).toBeInTheDocument();
    expect(screen.queryByText('Prompt 1')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Custom Prompt'));
    expect(onPromptClick).toHaveBeenCalledWith('Custom Prompt', undefined, 'journey-1');
  });

  it('renders stage indicator', () => {
    render(<KineticWelcome content={mockContent} stage="ORIENTED" onPromptClick={jest.fn()} />);
    expect(screen.getByText('🧭')).toBeInTheDocument();
    expect(screen.getByText('Orienting')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<KineticWelcome content={mockContent} onPromptClick={jest.fn()} />);
    expect(screen.getByText('Test footer')).toBeInTheDocument();
  });
});
```

## Integration Tests

### File: `src/surface/components/KineticStream/__tests__/ExploreShell.context.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExploreShell } from '../ExploreShell';
// Mock providers as needed

describe('ExploreShell - Context Integration', () => {
  it('shows welcome when no messages', () => {
    render(<ExploreShell />);
    // Should show welcome content
    expect(screen.getByText(/heading/i)).toBeInTheDocument();
  });

  it('opens lens picker when header pill clicked', async () => {
    render(<ExploreShell />);
    // Click lens pill
    fireEvent.click(screen.getByText(/Choose Lens/i));
    // Should show picker overlay
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('hides welcome after first message', async () => {
    render(<ExploreShell />);
    // Submit a message
    const input = screen.getByPlaceholderText(/Ask anything/i);
    fireEvent.change(input, { target: { value: 'Test query' } });
    fireEvent.submit(input.closest('form')!);
    // Welcome should disappear
    await waitFor(() => {
      expect(screen.queryByText(/heading/i)).not.toBeInTheDocument();
    });
  });
});
```

## Manual Testing Checklist

1. **Header Verification**
   - [ ] Header renders with "Explore The Grove" title
   - [ ] Lens pill shows "Choose Lens" or selected lens name
   - [ ] Lens pill has colored dot when lens selected
   - [ ] Click lens pill → overlay appears
   - [ ] Journey pill shows on wide screens
   - [ ] Stage indicator updates with exchange count

2. **Welcome Card**
   - [ ] Shows when no messages in stream
   - [ ] Heading matches selected lens
   - [ ] Thesis matches selected lens
   - [ ] Three prompts are clickable
   - [ ] Click prompt → submits query
   - [ ] Welcome disappears after first message

3. **Lens Selection Flow**
   - [ ] Click lens pill → LensPicker opens
   - [ ] Select lens → picker closes
   - [ ] Header updates with new lens name
   - [ ] Welcome content updates

4. **Stage Progression**
   - [ ] ARRIVAL (0-2 exchanges)
   - [ ] ORIENTED (3-4 exchanges)
   - [ ] EXPLORING (5-9 exchanges or 2+ topics)
   - [ ] ENGAGED (10+ exchanges or journey completed)

5. **Suggested Prompts**
   - [ ] Prompts adapt to selected lens
   - [ ] Journey-linked prompts start journey when clicked
   - [ ] Refresh changes prompts

## Browser Testing

- Chrome: Primary
- Firefox: Verify CSS variables
- Safari: Check glass effects

## Coverage Goals

- KineticHeader: All props and click handlers
- KineticWelcome: All render states, prompt clicks
- ExploreShell integration: Context flow
