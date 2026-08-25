import SectionEyebrow from '../components/SectionEyebrow';
import Button from '../components/Button';
import Icon from '../components/Icon';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <section className="container-pad flex min-h-[70vh] flex-col items-center justify-center py-28 text-center">
  <Seo title="Page Not Found" />
      <SectionEyebrow>Lost in the garden?</SectionEyebrow>
      <p className="mt-3 font-serif text-7xl text-ink md:text-8xl">404</p>
      <h1 className="mt-4 font-serif text-2xl text-ink md:text-3xl">
        This path doesn’t lead anywhere
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        The page you’re looking for may have moved or never existed. Let’s walk
        you back to familiar ground.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
        <Button to="/" variant="forest">
          Back home
        </Button>
        <Button to="/amenities" variant="ghost">
          Explore the garden
          <Icon name="arrow" className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
