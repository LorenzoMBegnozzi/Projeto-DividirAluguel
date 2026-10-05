/** "Fulano está digitando...": mesma bolha de mensagem da outra pessoa, com 3 pontinhos pulando. */
export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-lg rounded-bl-xs bg-surface-sunk px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-[typing-bounce_1.2s_infinite_ease-in-out] rounded-full bg-ink-3 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
