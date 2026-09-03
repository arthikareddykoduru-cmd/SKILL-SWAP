import { useEffect, useMemo, useState, useRef } from 'react'
import { MoreHorizontal, Paperclip, Phone, Search, Send, Video, MessageSquare, Sparkles, CheckCheck, FileText, Download, X, Image as ImageIcon, File } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import Card from '../components/Card'
import { subscribeToConversations, sendMessage, subscribeToMessages, getConnections } from '../services/api'

function MessagesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState({ conversations: [], messages: [] })
  const [activeConversation, setActiveConversation] = useState(null)
  const [connectedIds, setConnectedIds] = useState(new Set())
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState(null) // { name, size, type, dataUrl }
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [initialRouteResolved, setInitialRouteResolved] = useState(false)
  
  const initialConvId = useRef(location.state?.conversationId)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  
  useEffect(() => {
    let mounted = true
    
    getConnections().then(data => {
      if (mounted && data?.connections) {
        setConnectedIds(new Set(data.connections.map(c => c.id)))
      }
    }).catch(() => {})

    const unsubscribe = subscribeToConversations((conversations) => {
      if (mounted) {
        setData(current => ({
          ...current,
          conversations
        }))
        
        setActiveConversation(prev => {
          if (initialConvId.current && !initialRouteResolved) {
            setInitialRouteResolved(true)
            return initialConvId.current
          }
          
          if (!prev && conversations.length > 0) {
            return conversations[0].id
          }
          
          if (prev && !conversations.some(c => c.id === prev)) {
             return conversations.length > 0 ? conversations[0].id : null
          }
          
          return prev
        })
        
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [location.state, initialRouteResolved])

  // Direct route jump if conversationId passed in state
  useEffect(() => {
    if (location.state?.conversationId) {
      setActiveConversation(location.state.conversationId)
    }
  }, [location.state?.conversationId])

  const { conversations = [], messages = [] } = data || {}
  const active = useMemo(() => {
    if (activeConversation) {
      return conversations.find(c => c.id === activeConversation) || null
    }
    return conversations.length > 0 ? conversations[0] : null
  }, [conversations, activeConversation])

  const filteredConversations = useMemo(() => {
    let list = conversations
    if (searchQuery.trim()) {
      list = list.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    const seen = new Set()
    const seenNames = new Set()
    return list.filter(c => {
      const pKey = c.otherUserId || c.id
      const nKey = (c.name || '').trim().toLowerCase()
      if (seen.has(pKey) || (nKey && nKey !== 'anonymous' && seenNames.has(nKey))) return false
      seen.add(pKey)
      if (nKey && nKey !== 'anonymous') seenNames.add(nKey)
      return true
    })
  }, [conversations, searchQuery])

  useEffect(() => {
    if (!active?.id) return
    const unsubscribe = subscribeToMessages(active.id, (newMessages) => {
      setData((current) => ({
        ...current,
        messages: newMessages
      }))
    })
    return () => unsubscribe()
  }, [active?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type.startsWith('image/') ? 'image' : 'file',
        dataUrl: reader.result
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSend = async (event) => {
    event?.preventDefault()
    if ((!messageText.trim() && !selectedFile) || !active?.id || sending) return
    
    setSending(true)
    const textToSend = messageText.trim()
    const fileToSend = selectedFile
    
    setMessageText('')
    setSelectedFile(null)

    try {
      await sendMessage(active.id, textToSend, fileToSend)
    } catch (e) {
      console.error('Send error:', e)
    } finally {
      setSending(false)
    }
  }

  if (loading || !data) {
    return (
      <AppLayout>
        <div className="h-[calc(100vh-8rem)] rounded-3xl bg-slate-200 animate-pulse" />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Card className="h-[calc(100vh-8rem)] overflow-hidden p-0 border border-slate-200/80 shadow-lg shadow-slate-200/40">
        <div className="grid h-full lg:grid-cols-[0.8fr_1.2fr]">
          
          {/* Left Sidebar: Conversations List */}
          <div className="border-r border-slate-200/80 bg-slate-50/50 p-4 flex flex-col h-full">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/10 mb-3">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input 
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none" 
                placeholder="Search direct messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => {
                  const isCurrent = conversation.id === active?.id
                  return (
                    <button
                      key={conversation.id || conversation.name}
                      type="button"
                      className={`w-full text-left rounded-2xl p-3.5 transition-all duration-150 cursor-pointer ${
                        isCurrent 
                          ? 'bg-white shadow-sm border border-slate-200/80 ring-1 ring-violet-500/10' 
                          : 'hover:bg-white/80 border border-transparent'
                      }`}
                      onClick={() => {
                        setActiveConversation(conversation.id)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={conversation.name} size="sm" status="online" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-bold text-slate-900">{conversation.name}</p>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">{conversation.time}</span>
                          </div>
                          <p className="truncate text-xs text-slate-500 mt-0.5">{conversation.preview}</p>
                        </div>
                        {conversation.unread > 0 ? (
                          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            {conversation.unread}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                  No conversations found.
                </div>
              )}
            </div>
          </div>

          {/* Right Area: Active Chat Window */}
          <div className="flex flex-col bg-white h-full overflow-hidden">
            {active ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white/90 backdrop-blur">
                  <div className="flex items-center gap-3.5">
                    <Avatar name={active.name} size="md" status="online" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{active.name}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online for skill swap
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const otherId = active.otherUserId || active.id

                      return (
                        <>
                          <button 
                            className="rounded-xl border border-slate-200/80 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 cursor-pointer p-2.5 transition shadow-2xs"
                            onClick={() => otherId && navigate(`/call/${otherId}`)} 
                            title="Voice Call"
                          >
                            <Phone size={17} />
                          </button>
                          
                          <button 
                            className="rounded-xl border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-300 active:scale-95 cursor-pointer p-2.5 transition shadow-2xs"
                            onClick={() => otherId && navigate(`/call/${otherId}`)} 
                            title="Live Video Session"
                          >
                            <Video size={17} />
                          </button>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 space-y-3.5 overflow-y-auto p-6 bg-slate-50/30">
                  {messages.length > 0 ? (
                    messages.map((message) => {
                      const isMe = message.from === 'me'
                      const hasFile = !!message.file
                      const isImage = hasFile && message.file.type?.startsWith('image/')

                      return (
                        <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-3xl p-3.5 text-xs shadow-2xs space-y-2 ${
                            isMe 
                              ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-br-xs' 
                              : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs'
                          }`}>
                            
                            {/* File Attachment Rendering */}
                            {hasFile && (
                              <div className="rounded-2xl overflow-hidden">
                                {isImage ? (
                                  <a href={message.file.dataUrl} target="_blank" rel="noopener noreferrer" className="block group">
                                    <img 
                                      src={message.file.dataUrl} 
                                      alt={message.file.name} 
                                      className="max-h-60 max-w-full rounded-xl object-cover hover:opacity-95 transition"
                                    />
                                    <span className="text-[10px] opacity-80 mt-1 block truncate">
                                      {message.file.name} ({message.file.size})
                                    </span>
                                  </a>
                                ) : (
                                  <a 
                                    href={message.file.dataUrl} 
                                    download={message.file.name}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                                      isMe 
                                        ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' 
                                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                                    }`}
                                  >
                                    <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
                                      <FileText size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold truncate text-xs">{message.file.name}</p>
                                      <p className="text-[10px] opacity-75">{message.file.size}</p>
                                    </div>
                                    <Download size={15} className="shrink-0 opacity-80" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Message Text Content */}
                            {message.text && (
                              <p className="leading-relaxed font-normal whitespace-pre-wrap">{message.text}</p>
                            )}

                            <div className={`flex items-center justify-end gap-1 text-[10px] ${isMe ? 'text-violet-200' : 'text-slate-400'}`}>
                              <span>{message.time}</span>
                              {isMe && <CheckCheck size={11} />}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 mb-3">
                        <Sparkles size={20} />
                      </div>
                      <p className="text-sm font-bold text-slate-800">Start conversation with {active.name}</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">Share skills, ask questions, or send learning files &amp; code.</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Selected File Pending Preview Bar */}
                {selectedFile && (
                  <div className="border-t border-slate-100 bg-violet-50/60 px-4 py-2 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                        {selectedFile.type?.startsWith('image/') ? <ImageIcon size={16} /> : <File size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-500">{selectedFile.size}</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSelectedFile(null)}
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                      title="Remove file"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {/* Message Input Box & File Uploader */}
                <div className="border-t border-slate-100 p-4 bg-white flex items-center gap-2">
                  
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*,.pdf,.doc,.docx,.txt,.zip,.json,.js,.py,.html"
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300 transition active:scale-95 cursor-pointer shrink-0 shadow-2xs"
                    title="Attach file or image"
                  >
                    <Paperclip size={17} />
                  </button>

                  <input
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                    placeholder={`Message ${active.name}... (Press Enter to send)`}
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend()
                    }}
                    aria-label="Message input"
                  />

                  <button 
                    type="button" 
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/25 transition hover:shadow-lg hover:shadow-violet-500/35 active:scale-95 cursor-pointer disabled:opacity-50 shrink-0" 
                    onClick={handleSend} 
                    disabled={(!messageText.trim() && !selectedFile) || sending}
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-600">
                  <MessageSquare size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Your Messages</h3>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  Select a conversation or find connections in Explore Skills to start messaging.
                </p>
              </div>
            )}
          </div>

        </div>
      </Card>
    </AppLayout>
  )
}

export default MessagesPage