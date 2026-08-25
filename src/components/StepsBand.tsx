import { steps } from '../data/site';
import Reveal from './Reveal';

/** Dark green band: "Your celebration in three easy steps". */
export default function StepsBand() {
  return (
    <section className="bg-forest-deep text-cream">
      <div className="container-pad py-16 md:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl leading-tight text-cream md:text-[2.6rem]">
            Your celebration in three easy steps
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <Reveal key={step.no} delay={i * 0.1} className="text-center">
              <p className="font-serif text-5xl text-cream/25">{step.no}</p>
              <h3 className="mt-3 font-serif text-xl text-cream">{step.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-cream/65">
                {step.text}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
