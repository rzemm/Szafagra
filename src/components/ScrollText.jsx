import { useEffect, useRef, useState } from 'react'

export function ScrollText({ children, className }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const [dist, setDist] = useState(0)

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    const measure = () => {
      const overflow = inner.scrollWidth - outer.clientWidth
      setDist(overflow > 2 ? overflow : 0)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(outer)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [children])

  return (
    <span ref={outerRef} className={className} style={{ overflow: 'hidden', display: 'block', minWidth: 0 }}>
      <span
        ref={innerRef}
        className={dist > 0 ? 'scroll-text scrolling' : 'scroll-text'}
        style={dist > 0 ? { '--scroll-dist': `-${dist}px` } : {}}
      >
        {children}
      </span>
    </span>
  )
}
