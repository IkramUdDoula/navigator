import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusBadge from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('should render with status text', () => {
    render(<StatusBadge status="In Progress" variant="status" />);
    
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });
  
  it('should render with custom color for status labels', () => {
    render(
      <StatusBadge 
        status="In Progress" 
        variant="status" 
        color="#ff6b6b" 
      />
    );
    
    const badge = screen.getByText('In Progress');
    expect(badge).toHaveStyle({ backgroundColor: '#ff6b6b' });
  });
  
  it('should determine text color based on background contrast', () => {
    // Dark background should have white text
    render(
      <StatusBadge 
        status="Dark Status" 
        variant="status" 
        color="#000000" 
      />
    );
    
    const darkBadge = screen.getByText('Dark Status');
    expect(darkBadge).toHaveStyle({ color: '#ffffff' });
  });
  
  it('should handle light background with dark text', () => {
    // Light background should have black text
    render(
      <StatusBadge 
        status="Light Status" 
        variant="status" 
        color="#ffffff" 
      />
    );
    
    const lightBadge = screen.getByText('Light Status');
    expect(lightBadge).toHaveStyle({ color: '#000000' });
  });
  
  it('should render with default styling for status without color', () => {
    render(<StatusBadge status="No Color" variant="status" />);
    
    const badge = screen.getByText('No Color');
    expect(badge).toHaveClass('badge');
    expect(badge).not.toHaveStyle({ backgroundColor: expect.any(String) });
  });
  
  it('should render with secondary variant for closed status', () => {
    render(<StatusBadge status="Closed" variant="closed" />);
    
    const badge = screen.getByText('Closed');
    expect(badge).toHaveClass('badge');
  });
  
  it('should render with secondary variant for opened status', () => {
    render(<StatusBadge status="Opened" variant="opened" />);
    
    const badge = screen.getByText('Opened');
    expect(badge).toHaveClass('badge');
  });
  
  it('should normalize hex colors without # prefix', () => {
    render(
      <StatusBadge 
        status="Hex Test" 
        variant="status" 
        color="ff6b6b" 
      />
    );
    
    const badge = screen.getByText('Hex Test');
    expect(badge).toHaveStyle({ backgroundColor: '#ff6b6b' });
  });
  
  it('should handle named colors', () => {
    render(
      <StatusBadge 
        status="Named Color" 
        variant="status" 
        color="blue" 
      />
    );
    
    const badge = screen.getByText('Named Color');
    expect(badge).toHaveStyle({ backgroundColor: '#4dabf7' });
  });
  
  it('should ignore invalid color formats', () => {
    render(
      <StatusBadge 
        status="Invalid Color" 
        variant="status" 
        color="invalid-color" 
      />
    );
    
    const badge = screen.getByText('Invalid Color');
    expect(badge).not.toHaveStyle({ backgroundColor: expect.any(String) });
  });
  
  it('should apply custom className', () => {
    render(
      <StatusBadge 
        status="Custom Class" 
        variant="status" 
        className="custom-badge-class" 
      />
    );
    
    const badge = screen.getByText('Custom Class');
    expect(badge).toHaveClass('custom-badge-class');
  });
  
  it('should handle empty or undefined color', () => {
    render(
      <StatusBadge 
        status="No Color Prop" 
        variant="status" 
        color={undefined} 
      />
    );
    
    const badge = screen.getByText('No Color Prop');
    expect(badge).toHaveClass('badge');
  });
  
  it('should handle edge case color formats', () => {
    // Test short hex (should be ignored)
    render(
      <StatusBadge 
        status="Short Hex" 
        variant="status" 
        color="#fff" 
      />
    );
    
    const shortHexBadge = screen.getByText('Short Hex');
    expect(shortHexBadge).not.toHaveStyle({ backgroundColor: expect.any(String) });
  });
  
  it('should maintain font styling classes', () => {
    render(<StatusBadge status="Font Test" variant="status" />);
    
    const badge = screen.getByText('Font Test');
    expect(badge).toHaveClass('font-medium', 'text-xs');
  });
  
  describe('Color contrast calculations', () => {
    it('should use white text for dark red background', () => {
      render(
        <StatusBadge 
          status="Dark Red" 
          variant="status" 
          color="#8B0000" 
        />
      );
      
      const badge = screen.getByText('Dark Red');
      expect(badge).toHaveStyle({ color: '#ffffff' });
    });
    
    it('should use black text for light yellow background', () => {
      render(
        <StatusBadge 
          status="Light Yellow" 
          variant="status" 
          color="#FFFF99" 
        />
      );
      
      const badge = screen.getByText('Light Yellow');
      expect(badge).toHaveStyle({ color: '#000000' });
    });
    
    it('should use white text for medium brightness colors due to adjusted threshold', () => {
      render(
        <StatusBadge 
          status="Medium Blue" 
          variant="status" 
          color="#4dabf7" 
        />
      );
      
      const badge = screen.getByText('Medium Blue');
      expect(badge).toHaveStyle({ color: '#ffffff' });
    });
  });
  
  describe('Named color mapping', () => {
    const namedColorTests = [
      { name: 'red', expected: '#ff6b6b' },
      { name: 'blue', expected: '#4dabf7' },
      { name: 'green', expected: '#51cf66' },
      { name: 'gray', expected: '#868e96' },
      { name: 'grey', expected: '#868e96' }
    ];
    
    namedColorTests.forEach(({ name, expected }) => {
      it(`should map ${name} to ${expected}`, () => {
        render(
          <StatusBadge 
            status={`${name} status`} 
            variant="status" 
            color={name} 
          />
        );
        
        const badge = screen.getByText(`${name} status`);
        expect(badge).toHaveStyle({ backgroundColor: expected });
      });
    });
  });
});