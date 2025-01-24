type RealtimeEvent = {
    table: 'tickets' | 'messages';
    schema: 'public';
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    payload: {
      new: {
        id: string;
        ticket_id?: string | null;
        [key: string]: any;
      };
      old: {
        [key: string]: any;
      };
    };
  };

export type { RealtimeEvent };
