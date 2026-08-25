import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StayCard, { type StayCardData } from '../StayCard';

const stay: StayCardData = {
  slug: 'garden-villa',
  name: 'Garden Villa',
  badge: 'Most Popular',
  pricePerNight: 4500,
  heroImage: '/images/villa-main.jpg',
  gallery: ['/images/villa-2.jpg', '/images/villa-3.jpg'],
};

function renderCard(data: StayCardData = stay) {
  return render(
    <MemoryRouter>
      <StayCard stay={data} />
    </MemoryRouter>
  );
}

describe('StayCard', () => {
  it('renders the stay name and view-details link', () => {
    renderCard();
    expect(screen.getByRole('heading', { name: 'Garden Villa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute(
      'href',
      '/stays/garden-villa'
    );
  });

  it('links the hero image to the stay detail page', () => {
    renderCard();
    const links = screen.getAllByRole('link', { name: /Garden Villa at Shraddha Garden Resort/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/stays/garden-villa');
  });

  it('shows the badge and formatted price', () => {
    renderCard();
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
    expect(screen.getByText('₹4,500')).toBeInTheDocument();
    expect(screen.getByText('/ night')).toBeInTheDocument();
  });

  it('does not render the badge when absent', () => {
    renderCard({ ...stay, badge: null });
    expect(screen.queryByText('Most Popular')).not.toBeInTheDocument();
  });

  it('shows gallery navigation buttons only when there are extra images', () => {
    const { unmount } = renderCard();
    expect(screen.getByRole('button', { name: 'Next image' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous image' })).toBeInTheDocument();
    unmount();

    renderCard({ ...stay, gallery: [] });
    expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous image' })).not.toBeInTheDocument();
  });

  it('cycles to the next image when next is clicked', async () => {
    const user = userEvent.setup();
    renderCard();

    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('villa-main.jpg');

    await user.click(screen.getByRole('button', { name: 'Next image' }));
    expect((screen.getByRole('img') as HTMLImageElement).src).toContain('villa-2.jpg');

    await user.click(screen.getByRole('button', { name: 'Next image' }));
    expect((screen.getByRole('img') as HTMLImageElement).src).toContain('villa-3.jpg');
  });

  it('wraps around when advancing past the last image', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Next image' }));
    await user.click(screen.getByRole('button', { name: 'Next image' }));
    await user.click(screen.getByRole('button', { name: 'Next image' }));

    expect((screen.getByRole('img') as HTMLImageElement).src).toContain('villa-main.jpg');
  });

  it('moves to the previous image when prev is clicked', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Previous image' }));
    expect((screen.getByRole('img') as HTMLImageElement).src).toContain('villa-3.jpg');
  });
});