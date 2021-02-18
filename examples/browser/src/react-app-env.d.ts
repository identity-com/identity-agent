/// <reference types="react-scripts" />
import { Agent } from "identity-agent";

declare global {
  namespace NodeJS {
    interface Global {
      agent: Agent;
    }
  }
}
