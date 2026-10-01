import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Step3Scores } from './Step3Scores';
import { SolutionTree } from './SolutionTree';
import type { ScaffolderState } from './useProjectScaffolder';
import { AdvisorService } from '../../../services/advisorService';
import { initialBlueprints } from '../../../services/mockSeedData';
import type { SolutionTreeNode } from '../../../services/projectService';

describe('<Step3Scores /> (extracted wizard step)', () => {
  const liveScores = AdvisorService.calculateScores(initialBlueprints[0]);
  const wizard = (setStep = vi.fn()) => ({ setStep, liveScores }) as unknown as ScaffolderState;

  it('renders one card per score category with its recommendations', () => {
    render(<Step3Scores wizard={wizard()} />);
    expect(liveScores.rationale.length).toBeGreaterThan(0);
    for (const r of liveScores.rationale) {
      expect(screen.getByText(r.category)).toBeTruthy();
      for (const rec of r.recommendations) expect(screen.getAllByText(rec).length).toBeGreaterThan(0);
    }
  });

  it('Back / Next move the wizard to steps 2 and 4', () => {
    const setStep = vi.fn();
    render(<Step3Scores wizard={wizard(setStep)} />);
    fireEvent.click(screen.getByRole('button', { name: /Back/ }));
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(setStep.mock.calls).toEqual([[2], [4]]);
  });
});

describe('<SolutionTree />', () => {
  const tree: SolutionTreeNode[] = [
    {
      id: 'src',
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [{ id: 'f1', name: 'Program.cs', type: 'file', path: 'src/Program.cs', contentSnippet: '' }],
    },
    { id: 'f2', name: 'README.md', type: 'file', path: 'README.md' },
  ];

  it('renders nested nodes and reports the clicked node', () => {
    const onSelect = vi.fn();
    render(<SolutionTree nodes={tree} selectedId={undefined} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Program.cs'));
    expect(onSelect).toHaveBeenCalledWith(tree[0].children![0]);
  });

  it('highlights the selected node', () => {
    render(<SolutionTree nodes={tree} selectedId="f2" onSelect={() => {}} />);
    expect(screen.getByText('README.md').parentElement!.className).toContain('bg-blue-600');
    expect(screen.getByText('src').parentElement!.className).not.toContain('bg-blue-600');
  });
});
