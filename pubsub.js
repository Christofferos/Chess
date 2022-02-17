import { PubSub } from "@google-cloud/pubsub";
import path from "path";

const projectId = "chessonlinepro";
const keyFilename = path.join(path.resolve(), "google-credentials.json");
export const pubSubClient = new PubSub({ projectId, keyFilename });
export const TOPIC_NAME = "projects/chessonlinepro/topics/signup";
