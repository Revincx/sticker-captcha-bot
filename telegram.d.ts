export {}

declare module "node-telegram-bot-api" {
    interface User {
        supports_guest_queries?: boolean;
    }
    interface Message {
        guest_query_id?: string;
        guest_bot_caller_user?: User;
        guest_bot_caller_chat?: Chat;
    }
    interface Update {
        guest_message?: Message;
    }
}
