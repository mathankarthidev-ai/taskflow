import { NextResponse } from 'next/server';
import { ChatMessage } from '@/types';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

declare global {
  // eslint-disable-next-line no-var
  var __ambizconChatStore: Record<string, ChatMessage[]> | undefined;
}

function getServerChatStore(): Record<string, ChatMessage[]> {
  if (!globalThis.__ambizconChatStore) {
    globalThis.__ambizconChatStore = {
      channel_all: [],
      channel_creative: [],
      channel_marketing: [],
      channel_development: [],
    };
  }
  return globalThis.__ambizconChatStore;
}

function mapRowToChatMessage(row: any): ChatMessage {
  return {
    id: String(row.id),
    channelId: row.channel_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    senderAvatar: row.sender_avatar || undefined,
    senderTeam: row.sender_team || undefined,
    text: row.text || '',
    fileAttachment: row.file_attachment || undefined,
    linkUrl: row.link_url || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export async function GET() {
  const store = getServerChatStore();

  try {
    const { data: rows, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(500);

    if (!error && rows) {
      const grouped: Record<string, ChatMessage[]> = {
        channel_all: [],
        channel_creative: [],
        channel_marketing: [],
        channel_development: [],
      };
      for (const row of rows) {
        const msg = mapRowToChatMessage(row);
        if (!grouped[msg.channelId]) grouped[msg.channelId] = [];
        grouped[msg.channelId].push(msg);
      }
      globalThis.__ambizconChatStore = grouped;
      return NextResponse.json({
        success: true,
        source: 'supabase',
        messagesByChannel: grouped,
      });
    }
  } catch (e) {
    console.warn('Supabase chat GET warning:', e);
  }

  return NextResponse.json({
    success: true,
    source: 'memory',
    messagesByChannel: store,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channelId, message } = body as { channelId: string; message: ChatMessage };

    if (!channelId || !message || !message.id) {
      return NextResponse.json({ success: false, error: 'Invalid message payload' }, { status: 400 });
    }

    const store = getServerChatStore();
    if (!store[channelId]) {
      store[channelId] = [];
    }

    const exists = store[channelId].some((m) => m.id === message.id);
    if (!exists) {
      store[channelId].push(message);
      if (store[channelId].length > 200) {
        store[channelId] = store[channelId].slice(-200);
      }
    }

    try {
      await supabase.from('chat_messages').upsert(
        {
          id: message.id,
          channel_id: channelId,
          sender_id: message.senderId,
          sender_name: message.senderName,
          sender_role: message.senderRole,
          sender_avatar: message.senderAvatar || null,
          sender_team: message.senderTeam || null,
          text: message.text || '',
          file_attachment: message.fileAttachment || null,
          link_url: message.linkUrl || null,
          created_at: message.createdAt || new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (e) {
      console.warn('Supabase chat POST warning:', e);
    }

    return NextResponse.json({
      success: true,
      message,
      messagesByChannel: store,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to store chat message' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const messageId = searchParams.get('messageId');
    const clearAll = searchParams.get('clearAll');

    const store = getServerChatStore();

    if (clearAll === 'true') {
      globalThis.__ambizconChatStore = {
        channel_all: [],
        channel_creative: [],
        channel_marketing: [],
        channel_development: [],
      };
      try {
        await supabase.from('chat_messages').delete().neq('id', '___none___');
      } catch (_) {}
      return NextResponse.json({ success: true });
    }

    if (channelId && messageId) {
      store[channelId] = (store[channelId] || []).filter((m) => m.id !== messageId);
      try {
        await supabase.from('chat_messages').delete().eq('id', messageId);
      } catch (_) {}
    } else if (channelId) {
      store[channelId] = [];
      try {
        await supabase.from('chat_messages').delete().eq('channel_id', channelId);
      } catch (_) {}
    }

    return NextResponse.json({ success: true, messagesByChannel: store });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to delete chat message' }, { status: 500 });
  }
}
