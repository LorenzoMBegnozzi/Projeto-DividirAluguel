import { MessagesSquare } from 'lucide-react'
import ChatLayout from '../components/chat/ChatLayout'
import { EmptyState } from '../components/ui'

/**
 * /conversas: já abre no modo lista + conversa, sem nenhuma selecionada. No celular, só a lista.
 */
export default function ConversationsPage() {
  return (
    <ChatLayout showListOnMobile>
      <div className="grid flex-1 place-items-center rounded-xl border border-line bg-surface p-6">
        <EmptyState icon={MessagesSquare} title="Escolha uma conversa" className="border-0">
          Abra uma conversa da lista para ver as mensagens aqui.
        </EmptyState>
      </div>
    </ChatLayout>
  )
}
