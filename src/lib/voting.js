export function resolveVoting(keys, votes, voteMode = 'highest') {
  if (!keys.length) {
    return { winnerKey: null, countsByOption: {} }
  }

  const countsByOption = Object.fromEntries(keys.map(key => [key, 0]))
  for (const vote of Object.values(votes ?? {})) {
    if (vote in countsByOption) countsByOption[vote] += 1
  }

  if (voteMode === 'weighted') {
    const weights = keys.map(key => countsByOption[key] + 1)
    const total = weights.reduce((sum, value) => sum + value, 0)
    let rng = Math.random() * total
    for (let i = 0; i < keys.length; i++) {
      rng -= weights[i]
      if (rng <= 0) {
        return { winnerKey: keys[i], countsByOption }
      }
    }
    return { winnerKey: keys[keys.length - 1], countsByOption }
  }

  const maxVotes = Math.max(...keys.map(key => countsByOption[key]))
  const leaders = keys.filter(key => countsByOption[key] === maxVotes)
  const winnerKey = leaders[Math.floor(Math.random() * leaders.length)]
  return { winnerKey, countsByOption }
}

