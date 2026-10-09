import { m, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ResponsiveImg } from './ResponsiveImg'
import { SectionReveal } from './SectionReveal'
import { useContent } from '../content/context'
import { useCssScrollTimeline } from '../hooks/useCssScrollTimeline'
import { useMotionBudget } from '../hooks/useMotionBudget'
import { easeOutExpo, gpuTransformTemplate } from '../lib/motion'

function AboutCopy() {
  const { about } = useContent()
  return (
    <m.div
      className="about__copy"
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.85, ease: easeOutExpo }}
    >
      <h3>{about.lead}</h3>
      {about.body.map((p, i) => (
        <m.p
          key={`${i}-${p.slice(0, 24)}`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: i * 0.08, duration: 0.55, ease: easeOutExpo }}
        >
          {p}
        </m.p>
      ))}
      {about.note ? <p className="about__note">{about.note}</p> : null}
      {about.timeline && about.timeline.length > 0 ? (
        <div className="about__timeline">
          <p className="eyebrow">Experience</p>
          <ol>
            {about.timeline.map((entry, i) => (
              <m.li
                key={`${entry.period}-${entry.role}-${i}`}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.45 }}
              >
                <span className="about__period">{entry.period}</span>
                <span className="about__role">{entry.role}</span>
                <span className="about__org">{entry.org}</span>
              </m.li>
            ))}
          </ol>
        </div>
      ) : null}
    </m.div>
  )
}

function AboutPortrait() {
  const { about, site } = useContent()
  return (
    <>
      <div className="about__portrait-frame">
        {about.portrait ? (
          <ResponsiveImg
            src={about.portrait}
            layout="panel"
            alt={about.portraitAlt || site.name}
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <ResponsiveImg
          className="about__portrait-overlay"
          src="/images/piano-detail.png"
          layout="panel"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
        />
      </div>
      <figcaption className="about__caption">{site.name}</figcaption>
    </>
  )
}

function AboutFramer() {
  const budget = useMotionBudget()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const portraitY = useTransform(scrollYProgress, [0, 1], budget.portraitY)

  return (
    <section className="section about" id="about" ref={ref}>
      <SectionReveal>
        <p className="eyebrow">About</p>
        <h2 className="about__lead-title">Program notes</h2>
      </SectionReveal>
      <div className="about__stage">
        <m.figure
          className="about__portrait gpu-scroll"
          style={{ y: portraitY }}
          transformTemplate={gpuTransformTemplate}
        >
          <AboutPortrait />
        </m.figure>
        <AboutCopy />
      </div>
    </section>
  )
}

export function About() {
  const cssTimeline = useCssScrollTimeline()

  if (cssTimeline) {
    return (
      <section className="section about" id="about">
        <SectionReveal>
          <p className="eyebrow">About</p>
          <h2 className="about__lead-title">Program notes</h2>
        </SectionReveal>
        <div className="about__stage">
          <figure className="about__portrait gpu-scroll parallax-portrait">
            <AboutPortrait />
          </figure>
          <AboutCopy />
        </div>
      </section>
    )
  }

  return <AboutFramer />
}
