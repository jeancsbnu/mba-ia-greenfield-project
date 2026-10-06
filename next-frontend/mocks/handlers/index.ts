import { handlers as authHandlers } from "./auth";
import { handlers as channelsHandlers } from "./channels";
import { handlers as commentsHandlers } from "./comments";
import { handlers as reactionsHandlers } from "./reactions";
import { handlers as seedHandlers } from "./_seed";
import { handlers as subscriptionsHandlers } from "./subscriptions";
import { handlers as videosHandlers } from "./videos";

export const handlers = [
  ...authHandlers,
  ...videosHandlers,
  ...channelsHandlers,
  ...reactionsHandlers,
  ...commentsHandlers,
  ...subscriptionsHandlers,
  ...seedHandlers,
];
