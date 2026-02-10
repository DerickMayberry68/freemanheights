import { useMemo } from 'react'

const WORDS = [
  'forgiven',
  'reborn',
  'salvation',
  'grace',
  'redeemed',
  'restored',
  'new life',
  'washed clean',
  'set free',
  'blameless',
  'made pure',
  'peace with God',
  'bestowed',
  'elected',
  'made righteous',
  'gift',
  'blood bought',
  'justified',
  'beloved',
  'chosen',
  'sanctified',
  'mercy',
  'faith',
  'hope',
  'love',
  'blessed',
  'YHWH'
]

const WordMontage = () => {
  // Generate random positions and styles for each word
  const wordStyles = useMemo(() => {
    return WORDS.map((word, index) => {
      const isSpecial = ['faith', 'hope', 'love'].includes(word.toLowerCase())
      const fontSize = isSpecial
        ? Math.random() * 2 + 4 // 4rem to 6rem for faith, hope, love
        : Math.random() * 2 + 1.5 // 1.5rem to 3.5rem for others

      // Position words everywhere except center (avoid logo area)
      let top, left
      do {
        top = Math.random() * 90 + 5 // 5% to 95%
        left = Math.random() * 90 + 5 // 5% to 95%
      } while (
        // Avoid center area where logo is (roughly 30-70% horizontally, 25-75% vertically)
        left > 30 && left < 70 && top > 25 && top < 75
      )

      const rotation = Math.random() * 40 - 20 // -20deg to 20deg
      const delay = Math.random() * 30 // 0s to 30s delay - spread out over time
      const duration = Math.random() * 8 + 10 // 10s to 18s duration - longer cycles

      return {
        word,
        isSpecial,
        style: {
          fontSize: `${fontSize}rem`,
          top: `${top}%`,
          left: `${left}%`,
          transform: `rotate(${rotation}deg)`,
          opacity: 0,
          animation: `word-flicker ${duration}s ease-in-out ${delay}s infinite`,
          color: isSpecial ? '#991B1B' : undefined, // Red for faith, hope, love
        },
      }
    })
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {wordStyles.map(({ word, isSpecial, style }, index) => (
        <div
          key={`${word}-${index}`}
          className={`absolute font-serif font-bold select-none ${
            isSpecial ? 'text-primary' : 'text-white'
          }`}
          style={style}
        >
          {word}
        </div>
      ))}
    </div>
  )
}

export default WordMontage
