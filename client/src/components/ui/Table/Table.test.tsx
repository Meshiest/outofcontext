import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from './Table';

describe('Table', () => {
  it('renders a table with caption and column-scoped headers', () => {
    render(
      <Table caption="Players">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Players').tagName).toBe('CAPTION');
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('scope', 'col');
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
  });

  it('applies positive and negative row classes', () => {
    render(
      <table>
        <tbody>
          <TableRow positive data-testid="me">
            <td>me</td>
          </TableRow>
          <TableRow negative data-testid="gone">
            <td>gone</td>
          </TableRow>
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('me').className).toContain('bg-positive');
    expect(screen.getByTestId('gone').className).toContain('bg-negative');
  });

  it('renders the table directly, with no clipping scroll wrapper', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    // An overflow container clips the table's own ambient shadow flush against its edge, and scrolls
    // long cell content sideways instead of letting it wrap.
    expect(container.firstElementChild?.tagName).toBe('TABLE');
  });

  it('forwards ref to the table element', () => {
    const ref = { current: null as HTMLTableElement | null };
    render(
      <Table ref={ref}>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(ref.current?.tagName).toBe('TABLE');
  });
});
