import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import { SimulatorPage } from '../../pages/SimulatorPage';

test('click PC component shows details', async () => {
  render(<SimulatorPage />);
  
  // Find the PC component box in SystemDiagram
  const pcBox = screen.getByText('PC');
  
  // Find the text that should be shown when no component is selected
  expect(screen.getByText(/Click any component in the diagram/i)).toBeTruthy();
  
  // Click PC
  fireEvent.click(pcBox);
  
  // Now it should show PC details
  expect(screen.getByText('Program Counter (PC)')).toBeTruthy();
});
