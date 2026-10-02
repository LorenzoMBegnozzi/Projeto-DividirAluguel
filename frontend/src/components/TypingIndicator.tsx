/** "Fulano está digitando...": mesma bolha de mensagem da outra pessoa, com 3 pontinhos pulando. */
export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-lg rounded-bl-[4px] bg-surface-sunk px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-ink-3"
            style={{ animation: 'typing-bounce 1.2s infinite ease-in-out', animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
